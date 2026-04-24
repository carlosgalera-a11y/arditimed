// ══════════════════════════════════════════════════════════════════════
// firebase-init.js — init compartido (un único sitio de verdad)
// ══════════════════════════════════════════════════════════════════════
// © 2026 Carlos Galera Román · Licencia propietaria · LPI 00765-03096622
// Ver LICENSE y NOTICE.md · Reutilización requiere autorización escrita.
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

  // ── Registro de perfil mínimo en users/{uid} al hacer login ──
  // Escribe {email, displayName, lastSeen} cuando se detecta sesión.
  // Permite que admin-dashboard cruce UIDs con emails/dominios y ver
  // qué centros/servicios están usando la plataforma. Idempotente
  // (merge:true) y no escribe el campo `role` (lo protegen las rules).
  try {
    if (firebase.auth && firebase.firestore) {
      firebase.auth().onAuthStateChanged(function(user){
        if(!user) return;
        try {
          var update = {
            email: user.email || null,
            displayName: user.displayName || null,
            emailDomain: (user.email || '').split('@')[1] || null,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
          };
          firebase.firestore().collection('users').doc(user.uid)
            .set(update, { merge: true })
            .catch(function(){ /* best-effort, rules pueden bloquear en ciertos estados */ });
        } catch(e) {}
      });
    }
  } catch(e) {}

  // reCAPTCHA v3 site key: pública, se define en window antes de cargar
  // este script. Si no existe, ai-client.js avisa y salta App Check.
  // Ejemplo en el HTML:
  //   <script>window.RECAPTCHA_SITE_KEY='6Lc…';</script>
  //   <script src="firebase-init.js"></script>
})();
