// ══════════════════════════════════════════════════════════════════════
// ai-client.js — Cliente único del frontend hacia la Cloud Function askAi
// ══════════════════════════════════════════════════════════════════════
// Toda llamada a IA del frontend pasa por aquí. Nunca claves en cliente.
// Requiere: firebase-app-compat.js, firebase-auth-compat.js,
//           firebase-functions-compat.js, firebase-app-check-compat.js
// ══════════════════════════════════════════════════════════════════════
(function(global){
  'use strict';

  var REGION = 'europe-west1';

  function getFunctions(){
    try{ return firebase.app().functions(REGION); }
    catch(e){ return firebase.functions(); }
  }

  // ── App Check init (idempotente) ────────────────────────────────────
  // reCAPTCHA v3 site key se lee de window.RECAPTCHA_SITE_KEY (constante
  // pública). Si no está definido, App Check no se activa y las llamadas
  // a askAi fallarán con failed-precondition en producción.
  var _appCheckActivated = false;
  function initAppCheck(){
    if(_appCheckActivated) return;
    try{
      var siteKey = global.RECAPTCHA_SITE_KEY || '';
      if(!siteKey){
        console.warn('[ai-client] RECAPTCHA_SITE_KEY no definido. App Check NO activado.');
        return;
      }
      if(!firebase.appCheck){
        console.warn('[ai-client] firebase-app-check-compat.js no cargado.');
        return;
      }
      var appCheck = firebase.appCheck();
      appCheck.activate(siteKey, /* isTokenAutoRefreshEnabled */ true);
      _appCheckActivated = true;
    }catch(e){ console.error('[ai-client] initAppCheck error:', e); }
  }

  // ── Mapeo de HttpsError a UX amigable ───────────────────────────────
  function handleAiError(e){
    var code = (e && e.code) || '';
    var msg = (e && e.message) || 'Error inesperado.';
    switch(code){
      case 'functions/unauthenticated':
        return { userMessage: 'Inicia sesión para usar la IA.', retryable: false, redirect: '#login' };
      case 'functions/invalid-argument':
        // El server ya devuelve un mensaje específico (ej: "contiene un DNI").
        return { userMessage: msg, retryable: false };
      case 'functions/resource-exhausted':
        return { userMessage: msg, retryable: false };
      case 'functions/unavailable':
        return { userMessage: 'Servicio IA temporalmente no disponible. Reintenta en 1 minuto.', retryable: true };
      case 'functions/deadline-exceeded':
        return { userMessage: 'La IA tardó demasiado. Reintentando...', retryable: true };
      case 'functions/failed-precondition':
        return { userMessage: 'Verificación de seguridad (App Check) fallida. Recarga la página.', retryable: false };
      default:
        return { userMessage: msg, retryable: false };
    }
  }

  // ── Cliente principal ───────────────────────────────────────────────
  // payload: { type, prompt, systemPrompt?, imageBase64?, model? }
  //   type ∈ 'clinical_case' | 'educational' | 'vision'
  // retorna: { provider, model, text, cached, latencyMs, tokensIn, tokensOut }
  // lanza: error con .code (functions/*) y .userMessage (string amigable)
  async function askAi(payload){
    initAppCheck();
    if(!firebase.auth().currentUser){
      var e = new Error('Inicia sesión para usar la IA.');
      e.code = 'functions/unauthenticated';
      e.userMessage = 'Inicia sesión para usar la IA.';
      throw e;
    }
    var fns = getFunctions();
    var callable = fns.httpsCallable('askAi');
    var retried = false;
    while(true){
      try{
        var res = await callable(payload);
        return res.data;
      }catch(err){
        var info = handleAiError(err);
        if(info.retryable && !retried){
          retried = true;
          await new Promise(function(r){ setTimeout(r, 3000); });
          continue;
        }
        err.userMessage = info.userMessage;
        err.redirect = info.redirect;
        throw err;
      }
    }
  }

  // ── API pública ─────────────────────────────────────────────────────
  global.askAi = askAi;
  global.aiClient = {
    askAi: askAi,
    initAppCheck: initAppCheck,
    // Atajos tipados:
    clinicalCase: function(p){ return askAi(Object.assign({type:'clinical_case'}, p)); },
    educational:  function(p){ return askAi(Object.assign({type:'educational'},  p)); },
    vision:       function(p){ return askAi(Object.assign({type:'vision'},       p)); },
  };
})(typeof window !== 'undefined' ? window : globalThis);
