# 04 · Coste mensual >50€ · ALTA

⚠️ **Esta alerta NO se crea con `gcloud alpha monitoring policies` — requiere Cloud Billing API directamente** (los presupuestos de GCP viven en otra superficie).

## Crear vía GUI (recomendado · 5 min)

1. https://console.cloud.google.com/billing/?project=docenciacartagenaeste
2. Seleccionar la cuenta de facturación.
3. Sidebar → **Budgets & alerts** → **CREATE BUDGET**.
4. Configurar:
   - **Name**: `Cartagenaeste Monthly Cap`
   - **Time range**: Monthly
   - **Projects**: docenciacartagenaeste
   - **Services**: All
   - **Budget amount**: Specified amount → **50 EUR**
   - **Threshold rules**:
     - 50% of budget → email
     - 90% of budget → email
     - 100% of budget → email + Pub/Sub topic (opcional, para auto-killswitch)
   - **Email recipients**: `carlosgalera2roman@gmail.com`
5. Save.

## Crear vía CLI (si tienes gcloud + permisos billing)

```bash
gcloud billing budgets create \
  --billing-account=$(gcloud billing accounts list --format='value(name)' | head -1) \
  --display-name='Cartagenaeste Monthly Cap' \
  --budget-amount=50EUR \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=0.9 \
  --threshold-rule=percent=1.0 \
  --notifications-rule-monitoring-notification-channels=[EMAIL_CHANNEL_ID] \
  --filter-projects=docenciacartagenaeste
```

## Auto-killswitch (opcional, paranoid mode)

Si el coste real llega al 100%, una Cloud Function suscrita al tópico Pub/Sub puede desactivar APIs (Cloud Functions, Firestore) para parar el sangrado. Implementación: ver https://cloud.google.com/billing/docs/how-to/notify

**Recomendación**: NO activar killswitch en clínica viva — un overspend es más reparable que un outage durante una guardia.
