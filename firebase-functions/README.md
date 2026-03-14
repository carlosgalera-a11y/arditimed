# Firebase Cloud Functions — Área II Cartagena

## Setup (5 minutos)

### Requisitos
- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`

### Pasos

1. Login en Firebase:
```bash
firebase login
```

2. Inicializar funciones:
```bash
cd firebase-functions
firebase init functions
# Selecciona: docenciacartagenaeste
# Selecciona: JavaScript
# No instalar dependencias (ya están en package.json)
```

3. Copiar los archivos:
```bash
cp index.js functions/index.js
cp package.json functions/package.json
cd functions && npm install
```

4. Configurar email (para citas):
```bash
firebase functions:config:set email.user="cartagenaeste.docencia@gmail.com" email.pass="TU_APP_PASSWORD"
```

5. Deploy:
```bash
firebase deploy --only functions
```

### Funciones incluidas

| Función | Trigger | Descripción |
|---|---|---|
| `enviarConfirmacionCita` | Firestore onCreate | Envía email cuando paciente pide cita |
| `notificarNuevoProtocolo` | Firestore onCreate | Push notification a profesionales |
| `limpiarLogsAntiguos` | Scheduled (semanal) | Limpia logs de uso_anonimo > 90 días |
| `generarResumenSemanal` | Scheduled (lunes 8am) | Genera resumen de uso en Firestore |
| `apiMetricas` | HTTPS callable | Devuelve métricas para dashboard |

### Coste
- Firebase Blaze (pay-as-you-go): 0€ hasta 125K invocaciones/mes
- Nodemailer: gratuito con Gmail
- FCM: gratuito hasta 1M mensajes/mes
