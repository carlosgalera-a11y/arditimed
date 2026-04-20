// ══════════════════════════════════════════════════════════════════════
// firebase-init.js — init compartido (un único sitio de verdad)
// ══════════════════════════════════════════════════════════════════════
// Carga en orden: firebase-app/auth/firestore/functions/app-check compat
// + este init + ai-client.js.  Así cada HTML solo añade los <script src>.
// ══════════════════════════════════════════════════════════════════════
(function(){
  'use strict';
  if (typeof firebase === 'undefined' || !firebase.initializeApp) {
    console.error('[firebase-init] Firebase SDK no cargado');
    return;
  }
  if (firebase.apps && firebase.apps.length) return;

  // Config pública del proyecto. App Check + referrer restrictions son
  // los controles reales; esta clave no da acceso sin ellos.
  var config = {
    apiKey: 'AIzaSyAvdYi6BVdltgeFH4KLHD_5iFZrSRgoykc',
    authDomain: 'docenciacartagenaeste.firebaseapp.com',
    projectId: 'docenciacartagenaeste',
    storageBucket: 'docenciacartagenaeste.firebasestorage.app',
    messagingSenderId: '1056320755107',
    appId: '1:1056320755107:web:126637bf63c13bbb297616',
  };
  try { firebase.initializeApp(config); } catch (e) { console.error('[firebase-init]', e); }

  // reCAPTCHA v3 site key: pública, se define en window antes de cargar
  // este script. Si no existe, ai-client.js avisa y salta App Check.
  // Ejemplo en el HTML:
  //   <script>window.RECAPTCHA_SITE_KEY='6Lc…';</script>
  //   <script src="firebase-init.js"></script>
})();
