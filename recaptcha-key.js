// ════════════════════════════════════════════════════════════════════
// recaptcha-key.js — site key pública de reCAPTCHA v3 para App Check
// ════════════════════════════════════════════════════════════════════
// 👉 PARA ACTIVAR APP CHECK EN PRODUCCIÓN:
//    1. Crear site key en https://www.google.com/recaptcha/admin/create
//       · Tipo: reCAPTCHA v3
//       · Dominios: area2cartagena.es, carlosgalera-a11y.github.io
//    2. Registrarla en Firebase App Check:
//       https://console.firebase.google.com/project/docenciacartagenaeste/appcheck/apps
//    3. Pegar la site key abajo, commit + merge.
//    4. Verificar en DevTools que aparece "[app-check] activado" en consola
//       y que las requests a la Cloud Function llevan header X-Firebase-AppCheck.
//    5. SOLO después: PR aparte para flipar enforceAppCheck:true en askAi.ts.
// ════════════════════════════════════════════════════════════════════
// Nota: este site key es PÚBLICO por diseño (la verificación se hace en
// servidor con la secret key, que NO está aquí). Por eso vive en este
// archivo plano servido por GitHub Pages.
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
// reCAPTCHA / App Check · DESACTIVADO temporalmente (2026-04-30)
// ════════════════════════════════════════════════════════════════════
// Motivo: el badge de reCAPTCHA v3 lanzaba el error
//   "Cannot read properties of null (reading 'appendChild')"
// que bloqueaba el flujo de Auth en producción para todos los usuarios.
//
// Site key generada (queda guardada para reactivación futura):
//   6LeMI9IsAAAAANIE2jdmccuKKSNWpayWe5yOMBlN
// Secret key (en Firebase Console · NO modificar aquí):
//   6LeMI9IsAAAAAEcpObV2MdElaS-0K4P4Szr9yDvP
//
// Para reactivar:
// 1. Investigar por qué el badge falla en appendChild (orden de scripts,
//    DOM no listo, conflicto con extensiones del navegador, etc.)
// 2. Restaurar la línea: window.RECAPTCHA_SITE_KEY = '6LeMI9Is...'
// 3. Verificar en producción con `console.log('[app-check] activado')`
// 4. Redeploy
// ════════════════════════════════════════════════════════════════════
window.RECAPTCHA_SITE_KEY = '';
