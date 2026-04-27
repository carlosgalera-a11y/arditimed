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
window.RECAPTCHA_SITE_KEY = '';
