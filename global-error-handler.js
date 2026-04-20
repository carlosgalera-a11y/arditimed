// global-error-handler.js — Manejo global de errores no capturados.
// Envía a Sentry si está inicializado. Muestra toast al usuario. Nunca pantalla blanca.
(function(global){
  'use strict';
  if (global.__globalErrorHandlerInstalled) return;
  global.__globalErrorHandlerInstalled = true;

  function showToast(msg){
    try {
      if (!msg) return;
      var t = document.createElement('div');
      t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#b91c1c;color:#fff;padding:12px 18px;border-radius:10px;font:500 14px/1.4 -apple-system,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.3);z-index:99999;max-width:90%;text-align:center;';
      t.textContent = '⚠️ ' + msg;
      document.body.appendChild(t);
      setTimeout(function(){ t.style.opacity='0'; t.style.transition='opacity .4s'; setTimeout(function(){ t.remove(); }, 400); }, 5000);
    } catch(e) {}
  }

  function niceMessage(err){
    if (global.getErrorMessage) return global.getErrorMessage(err);
    return (err && err.message) || 'Error inesperado';
  }

  global.addEventListener('error', function(ev){
    var err = ev.error || ev.message;
    // Ignorar errores de extensiones
    if (ev.filename && /(chrome|moz|safari)-extension:\/\//i.test(ev.filename)) return;
    if (global.Sentry && global.Sentry.captureException && err instanceof Error) {
      try { global.Sentry.captureException(err); } catch(e) {}
    }
    showToast(niceMessage(err));
  });

  global.addEventListener('unhandledrejection', function(ev){
    var reason = ev.reason;
    if (global.Sentry && global.Sentry.captureException && reason instanceof Error) {
      try { global.Sentry.captureException(reason); } catch(e) {}
    }
    showToast(niceMessage(reason));
  });
})(typeof window !== 'undefined' ? window : globalThis);
