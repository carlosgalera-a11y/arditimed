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
  // este script. Si no existe, App Check no se activa.
  // IMPORTANTE: la inicialización de App Check se hace defer a DOMContentLoaded
  // para evitar el error "Cannot read properties of null (reading 'appendChild')"
  // que sucede si reCAPTCHA intenta insertar su badge antes de que <body> exista.
  function initAppCheckSafe(){
    try {
      var siteKey = (typeof window !== 'undefined' && window.RECAPTCHA_SITE_KEY) || '';
      if (!siteKey) return; // App Check desactivado intencionalmente
      if (!firebase.appCheck) return; // SDK no cargado
      if (!document.body) return; // DOM no listo, no intentar (evita appendChild error)
      var appCheck = firebase.appCheck();
      appCheck.activate(siteKey, /* isTokenAutoRefreshEnabled */ true);
      console.log('[app-check] activado');
    } catch(e) {
      // NO propagar — App Check fallido NO debe bloquear Auth ni Firestore.
      console.warn('[firebase-init] appCheck (no crítico):', e && e.message);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppCheckSafe);
  } else {
    initAppCheckSafe();
  }
})();
