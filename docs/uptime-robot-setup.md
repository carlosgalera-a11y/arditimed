# Uptime Robot · configuración monitor externo

**Objetivo:** monitor externo gratuito que detecte caídas del sitio public de Cartagenaeste (GitHub Pages + dominio `area2cartagena.es`) en <5 min.

**Tiempo:** 5 minutos · **Coste:** 0 €/mes (free tier 50 monitors).
**Requiere:** cuenta del autor (tú).

---

## 1. Alta

1. Ir a https://uptimerobot.com/signUp
2. Crear cuenta con `carlosgalera2roman@gmail.com`.
3. Verificar email.
4. Saltar upsells a paid tier (Free 50 monitors es suficiente).

## 2. Crear monitor principal

En **Dashboard → + Add New Monitor**:

| Campo | Valor |
|---|---|
| Monitor Type | **HTTP(s)** |
| Friendly Name | `Cartagenaeste · status page` |
| URL | `https://area2cartagena.es/status.html` |
| Monitoring Interval | **5 minutes** (mínimo del free tier) |
| Monitor Timeout | 30 seconds |
| HTTP Method | GET |
| Alert Contacts to Notify | tu email |

Click **Create Monitor**.

## 3. Crear monitor secundario para landing

Repetir el paso 2 con:

| Campo | Valor |
|---|---|
| Friendly Name | `Cartagenaeste · landing` |
| URL | `https://area2cartagena.es/` |
| Monitoring Interval | 5 minutes |

## 4. Monitor de la Cloud Function pública

Repetir para el endpoint `publicMetrics` (que alimenta la status page):

| Campo | Valor |
|---|---|
| Friendly Name | `Cartagenaeste · publicMetrics` |
| URL | `https://europe-west1-docenciacartagenaeste.cloudfunctions.net/publicMetrics` |
| Monitoring Interval | 5 minutes |

## 5. Configurar alertas

En **My Settings → Alert Contacts**:

- **Email** (ya configurado con tu cuenta): listo.
- **SMS** (opcional, coste): útil si quieres alerta en horario guardia. 0,50 €/mes orientativo.
- **Webhook** (avanzado): apuntar a un endpoint que actualice `config/ops_status` en Firestore. Pendiente de implementar.
- **Slack / Discord / Telegram**: integración directa, elegir uno y pegar el webhook.

## 6. Status page pública (opcional, gratis)

Uptime Robot ofrece su propia status page pública:

1. **Dashboard → My Status Pages → Add**.
2. Friendly Name: `Cartagenaeste`.
3. Monitors to include: los 3 creados arriba.
4. Appearance: colores de Cartagenaeste (verde `#10b981`, azul `#2563eb`).
5. Custom subdomain: `cartagenaeste.status.com` (free).
6. Opcional: apuntar CNAME `status.area2cartagena.es` → uptimerobot para integrar en tu dominio.

**Recomendación**: por ahora quédate con la status page propia `/status.html` (ya implementada y lee healthchecks y ops_status). La de Uptime Robot es un complemento para clientes externos que quieran una vista "por defecto".

## 7. Integración con `config/ops_status` (avanzado, pendiente)

En el futuro, si quieres que una caída de Uptime Robot escriba automáticamente en Firestore:

```bash
# Cloud Function `uptimeWebhook` (pendiente de implementar):
exports.uptimeWebhook = onRequest(
  { region: 'europe-west1' },
  async (req, res) => {
    // Validar secret en header x-uptime-secret
    if (req.header('x-uptime-secret') !== process.env.UPTIME_SECRET) {
      res.status(401).send('unauthorized');
      return;
    }
    const { monitorID, monitorFriendlyName, alertType } = req.body;
    const db = getFirestore(getApp());
    await db.collection('config').doc('ops_status').set({
      maintenance: alertType === 1, // 1 = down, 2 = up
      incidents: FieldValue.arrayUnion({
        date: new Date().toISOString(),
        severity: alertType === 1 ? 'SEV-2' : 'info',
        text: `${monitorFriendlyName}: alertType=${alertType}`
      })
    }, { merge: true });
    res.status(200).send('ok');
  }
);
```

Esto no es prioritario hoy; el workflow manual (Uptime Robot → email → tú actualizas `ops_status` desde admin console) es suficiente para la fase actual.

---

## 8. Qué hacer cuando salta una alerta

1. Revisar `https://area2cartagena.es/status.html` desde un navegador externo (no tuyo).
2. Revisar GitHub Pages status: https://www.githubstatus.com/
3. Revisar Firebase status: https://status.firebase.google.com/
4. Si todo parece operativo remote pero Uptime Robot persiste en "down", probablemente es falso positivo de DNS (pasa). Verificar en https://www.whatsmydns.net/#A/area2cartagena.es.
5. Si es caída real:
   - Anotar en `config/ops_status` con `incidents: [{date, severity, text}]` vía admin-dashboard Firestore Console.
   - Escalar en runbook §9.4 según severidad.

---

## 9. Checklist de éxito

- [ ] Cuenta creada.
- [ ] 3 monitores HTTP creados (status, landing, publicMetrics) con 5 min interval.
- [ ] Test: hacer `curl -I https://area2cartagena.es/` debe devolver 200.
- [ ] Esperar 10 minutos y confirmar en dashboard que los 3 están "Up" en verde.
- [ ] Forzar una alerta: cambiar la URL a algo inexistente (`/noexiste.html`), esperar 5 min, confirmar que llega email de alerta. Luego restaurar.

---

## 10. Ampliaciones futuras

- Integración con Sentry para correlacionar caídas con errores runtime.
- Monitoreo de latencia (no solo up/down): Uptime Robot "Keyword" o "Port" monitors.
- SMS alert si quieres alerta en guardia (0,50 €/mes aprox).
- Status page white-label para clientes contractuales.
