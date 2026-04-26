# Cloud Monitoring · Cartagenaeste Producción

Dashboards y alertas para producción. Los archivos están en [monitoring/](../monitoring/) y se aplican vía **Firebase Console + Cloud Monitoring GUI** (recomendado, 15 min) o **gcloud CLI**.

## Inventario

| # | Archivo | Severidad | Descripción |
|---|---|---|---|
| Dashboard | `monitoring/dashboard-cartagenaeste-prod.json` | — | Latencia p50/p95/p99, invocaciones, errores, Firestore reads/writes, instancias activas, sign-ins |
| Alert 01 | `alerts/01-askai-error-rate.json` | ERROR | askAi 5xx >5% en 10 min |
| Alert 02 | `alerts/02-askai-p95-latency.json` | WARNING | askAi p95 >8s en 5 min |
| Alert 03 | `alerts/03-firestore-reads-spike.json` | WARNING | Firestore reads >200k/h |
| Alert 04 | `alerts/04-billing-budget.md` | ERROR | Budget mensual >50€ (Cloud Billing API, GUI obligatoria) |
| Alert 05 | `alerts/05-hosting-5xx.json` | WARNING | area2cartagena.es uptime check failure |
| Alert 06 | `alerts/06-quota-exhaustion.json` | WARNING | Cuotas IA agotadas en muchos usuarios |
| Alert 07 | `alerts/07-cold-start-prolonged.json` | INFO | askAi cold start >20s |
| Alert 08 | `alerts/08-auth-failures-spike.json` | WARNING | Fallos de sign-in >50/min |

## Pasos manuales (Carlos · 15 min)

### 1. Crear notification channel email (1 min)

https://console.cloud.google.com/monitoring/alerting/notifications?project=docenciacartagenaeste

→ **EDIT NOTIFICATION CHANNELS** → **EMAIL** → **ADD NEW** →
- Display name: `Carlos personal`
- Email: `carlosgalera2roman@gmail.com`
- Save.

Anotar el **channel ID** (formato `projects/docenciacartagenaeste/notificationChannels/123…`). Lo necesitan las alertas.

### 2. Importar dashboard (2 min)

https://console.cloud.google.com/monitoring/dashboards?project=docenciacartagenaeste

→ **CREATE DASHBOARD** → **JSON editor** → pegar contenido de [monitoring/dashboard-cartagenaeste-prod.json](../monitoring/dashboard-cartagenaeste-prod.json) → **APPLY CHANGES**.

### 3. Crear uptime check para Alert 05 (2 min)

Antes de aplicar la alerta 05, crea el uptime check del que depende:

https://console.cloud.google.com/monitoring/uptime?project=docenciacartagenaeste

→ **CREATE UPTIME CHECK**:
- Title: `area2cartagena.es production`
- Target: `https://area2cartagena.es/`
- Frequency: 1 minute
- Regions: Europe (3 regions mínimo)
- Save.

### 4. Crear las 7 alertas JSON vía gcloud (5 min · si tienes gcloud)

```bash
# Reemplaza CHANNEL_ID por el del paso 1
CHANNEL_ID="projects/docenciacartagenaeste/notificationChannels/XXXXX"

cd /Users/carlos/cartagenaestewebappSOLIDA
for f in monitoring/alerts/*.json; do
  echo "Aplicando $f"
  jq --arg ch "$CHANNEL_ID" '. + {notificationChannels: [$ch]}' "$f" > /tmp/alert.json
  gcloud alpha monitoring policies create --policy-from-file=/tmp/alert.json --project=docenciacartagenaeste
done
```

### 4b. Alternativa GUI (si no tienes gcloud)

https://console.cloud.google.com/monitoring/alerting/policies?project=docenciacartagenaeste

→ **CREATE POLICY** → seleccionar la métrica del JSON, condición, threshold, notification channel del paso 1. Repetir para los 7 archivos JSON.

### 5. Crear el budget mensual (Alert 04, 2 min)

Ver [monitoring/alerts/04-billing-budget.md](../monitoring/alerts/04-billing-budget.md) — instrucciones detalladas en GUI.

### 6. Verificar (3 min)

- Dashboard: navegar y ver que cada widget tiene datos.
- Alertas: en el listado todas debe estar **Enabled**, severity correcta, notification channel asociado.
- Forzar disparo de una alerta de baja severidad (Alert 07: cold start) haciendo redeploy de askAi y midiendo.

## Nota sobre el coste de Cloud Monitoring

Las alertas y dashboards en sí son gratis. Los costes vienen de:
- Logs ingeridos (ya hay TTL).
- Métricas custom (`logging.googleapis.com/user/askai_quota_exceeded` se usa en Alert 06 — requiere log-based metric definida; ver `functions/src/quotaCheck.ts` y crear log-based metric matching `severity=WARNING jsonPayload.event=\"quota_exceeded\"`).
- Uptime checks (gratuitos hasta 1M checks/mes — sobra).

Total estimado: **0–2 €/mes**.
