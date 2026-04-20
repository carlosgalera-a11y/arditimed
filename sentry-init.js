// sentry-init.js — Inicialización condicional de Sentry en el frontend.
// Requiere: window.SENTRY_DSN definido antes de este script (p.ej. en un
// <script> previo o en firebase-init.js).
// Si SENTRY_DSN no está, no hace nada (no rompe la app).
//
// PRIVACY:
// - beforeSend scrubber: elimina cualquier campo notes/diagnosis/treatment/
//   observations/prompt/response/content del payload antes de enviar.
// - denyUrls ignora extensiones del navegador.
(function(global){
  'use strict';
  if (!global.SENTRY_DSN) return;
  if (global.__sentryInitialized) return;

  var SDK_URL = 'https://browser.sentry-cdn.com/8.45.0/bundle.tracing.min.js';

  function scrub(event){
    if (!event) return event;
    // Breadcrumb data
    if (Array.isArray(event.breadcrumbs)) {
      event.breadcrumbs = event.breadcrumbs.map(function(b){
        if (b && b.data) {
          ['prompt','response','text','content','notes','diagnosis','treatment','observations']
            .forEach(function(k){ if (k in b.data) b.data[k] = '[REDACTED]'; });
        }
        return b;
      });
    }
    // Extra + contexts
    ['extra','contexts','request'].forEach(function(prop){
      var obj = event[prop];
      if (obj && typeof obj === 'object') {
        JSON.parse(JSON.stringify(obj), function(k, v){
          if (/^(prompt|response|notes|diagnosis|treatment|observations|content|body)$/i.test(String(k)) && typeof v === 'string') {
            return '[REDACTED]';
          }
          return v;
        });
      }
    });
    return event;
  }

  function boot(){
    if (!global.Sentry || !global.Sentry.init) return;
    global.Sentry.init({
      dsn: global.SENTRY_DSN,
      environment: (location.hostname.indexOf('area2cartagena.es') === 0 ? 'production' : 'dev'),
      release: (global.APP_VERSION || 'v1'),
      tracesSampleRate: 0.1,
      integrations: [
        // BrowserTracing sin config explícita — coge defaults.
      ],
      denyUrls: [
        /chrome-extension:\/\//i,
        /moz-extension:\/\//i,
        /safari-extension:\/\//i,
      ],
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        /Extension context invalidated/,
      ],
      beforeSend: scrub,
      beforeBreadcrumb: function(b){
        // Descartar breadcrumbs de URLs sensibles
        if (b && b.data && b.data.url) {
          if (/askAi|aiRequests|cases/.test(String(b.data.url))) {
            delete b.data.to; delete b.data.from;
          }
        }
        return b;
      },
    });
    global.__sentryInitialized = true;
  }

  // Cargar SDK en diferido para no bloquear la carga.
  var s = document.createElement('script');
  s.src = SDK_URL;
  s.crossOrigin = 'anonymous';
  s.defer = true;
  s.onload = boot;
  s.onerror = function(){ /* silencioso — Sentry es best-effort */ };
  document.head.appendChild(s);
})(typeof window !== 'undefined' ? window : globalThis);
