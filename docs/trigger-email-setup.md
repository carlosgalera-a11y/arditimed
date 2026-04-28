# Trigger Email · setup para notificación de aprobación de propuesta

Cuando un moderador aprueba una propuesta, `app-main.js` encola un correo
en la colección `/mail/{id}` con el formato que espera la extensión
**Firestore Send Email** de Firebase Extensions. Si la extensión NO está
instalada, los docs en `/mail/` quedan inertes (no rompen nada — el flujo
de aprobación funciona igual; simplemente no llega correo).

## Instalación (5 minutos · Firebase Console)

1. Ir a <https://console.firebase.google.com/project/docenciacartagenaeste/extensions>
2. Click **Explore extensions** → buscar "Trigger Email" (Firebase Extensions oficial).
3. Configurar parámetros:
   - **SMTP connection URI**: `smtps://USUARIO:PASSWORD@smtp.gmail.com:465`
     - Si usas Gmail: crear app password en <https://myaccount.google.com/apppasswords>.
     - Alternativa: SendGrid (`smtps://apikey:SG.xxx@smtp.sendgrid.net:465`), Mailgun, Brevo, etc.
   - **Email documents collection**: `mail` (literal, sin slash).
   - **Default FROM address**: `noreply@area2cartagena.es` (o la que uses).
   - **Default reply-to**: `carlosgalera2roman@gmail.com` (opcional).
   - **Region**: `europe-west1` (consistente con el resto).
4. Aceptar permisos. La extensión crea una Cloud Function que escucha
   `mail/{id}` y despacha. Tiempo medio de entrega: <30 s.

## Verificar funcionamiento

Tras instalación, aprobar una propuesta de prueba y comprobar:

```bash
firebase firestore:get mail/{ULTIMO_ID}
```

El doc tendrá un campo `delivery` con:
- `state: "SUCCESS"` y `attempts: 1` → entregado.
- `state: "ERROR"` → mira `error.message` (típicamente credenciales SMTP).

## Coste

Free tier de Gmail: ~500 envíos/día. SendGrid free tier: 100/día. Brevo:
300/día. Para Cartagenaeste con la actividad actual (<10 aprobaciones/día)
cualquiera vale.

## Operativa

- Si en algún momento queremos pausar los correos, basta con:
  - Desinstalar la extensión, o
  - Borrar la regla `match /mail/{id}` de `firestore.rules`.
- Si queremos extender la funcionalidad (notificar también al moderador,
  digest semanal, etc.) basta con encolar más docs en `/mail/`.

## Privacidad

El doc en `/mail/` contiene email del proponente y nombre. Reglas:
- `create`: moderador o admin.
- `read/update/delete`: solo admin.
- La extensión opera con permisos de servicio (no necesita acceso de
  usuario).

Retención: el doc queda en Firestore hasta que se borre manualmente.
Recomendable cron mensual que borre docs >30 días con `delivery.state == 'SUCCESS'`.
