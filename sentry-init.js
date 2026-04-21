// ══════════════════════════════════════════════════════════════════════
// sentry-init.js · Inicialización de Sentry con scrubbing RGPD agresivo
// ══════════════════════════════════════════════════════════════════════
// Requiere: window.SENTRY_DSN definido ANTES de cargar este script.
// Inerte si no hay DSN (no rompe la app, no hace nada).
//
// PRIVACY (RGPD + HIPAA compat):
// - No envía prompts IA, notas clínicas, diagnósticos ni imágenes.
// - Redacta DNI/NIE/NHC/API keys/bearer tokens del texto libre.
// - Anonimiza user.id (hash del UID Firebase, nunca email).
// ══════════════════════════════════════════════════════════════════════
(function(global){
  'use strict';

  if(!global.SENTRY_DSN) return;             // Sin DSN → inerte.
  if(global.__sentryInitialized) return;     // No doble init.

  var SDK_URL = 'https://browser.sentry-cdn.com/8.45.0/bundle.tracing.min.js';

  // ── Campos que NUNCA deben salir (deep-scrub recursivo) ───────────
  var PII_KEYS = [
    'prompt','systemprompt','fullprompt','userprompt','response','answer','text','content',
    'notes','observations','diagnosis','treatment','plan',
    'initials','name','surname','apellido','nombre',
    'dni','nif','nie','nhc','historia',
    'cama','bed','room','habitacion','address','direccion',
    'email','password','phone','telefono','mobile',
    'imagebase64','image','base64','photo',
    'apikey','api_key','token','bearer','authorization','secret'
  ];

  // Regex para redactar identificadores en strings libres.
  var PII_PATTERNS = [
    { re:/\b\d{8}[A-HJ-NP-TV-Z]\b/g,                 tag:'[REDACTED_DNI]' },
    { re:/\b[XYZ]\d{7}[A-HJ-NP-TV-Z]\b/gi,            tag:'[REDACTED_NIE]' },
    { re:/\bNHC[:\s]*\d{5,}/gi,                       tag:'[REDACTED_NHC]' },
    { re:/sk-or-v1-[a-f0-9]{20,}/gi,                  tag:'[REDACTED_OPENROUTER]' },
    { re:/sk-[a-zA-Z0-9_-]{15,}/g,                    tag:'[REDACTED_SK_KEY]' },
    { re:/gsk_[a-zA-Z0-9_-]{15,}/g,                   tag:'[REDACTED_GROQ_KEY]' },
    { re:/AIza[A-Za-z0-9_-]{30,}/g,                   tag:'[REDACTED_FIREBASE_KEY]' },
    { re:/Bearer\s+[A-Za-z0-9_.\-~+/=]{10,}/gi,       tag:'Bearer [REDACTED]' }
  ];

  function redactString(s){
    if(typeof s !== 'string') return s;
    var out = s;
    for(var i=0;i<PII_PATTERNS.length;i++){
      out = out.replace(PII_PATTERNS[i].re, PII_PATTERNS[i].tag);
    }
    return out;
  }

  function scrub(obj, depth){
    if(depth == null) depth = 0;
    if(depth > 6) return '[...depth_limit]';
    if(obj == null) return obj;
    if(typeof obj === 'string') return redactString(obj);
    if(typeof obj !== 'object') return obj;
    if(Array.isArray(obj)) return obj.map(function(x){ return scrub(x, depth+1); });

    var out = {};
    for(var k in obj){
      if(!Object.prototype.hasOwnProperty.call(obj,k)) continue;
      var lk = String(k).toLowerCase();
      var hit = false;
      for(var i=0;i<PII_KEYS.length;i++){
        if(lk.indexOf(PII_KEYS[i]) >= 0){ hit = true; break; }
      }
      out[k] = hit ? '[REDACTED]' : scrub(obj[k], depth+1);
    }
    return out;
  }

  function beforeSend(event){
    try{
      // 1. Request body entero — no enviar nunca.
      if(event.request){
        if(event.request.data)    event.request.data    = '[REDACTED_BODY]';
        if(event.request.cookies) event.request.cookies = '[REDACTED]';
        if(event.request.headers){
          var h = {};
          for(var k in event.request.headers){
            var lk = String(k).toLowerCase();
            h[k] = (lk === 'authorization' || lk === 'cookie' || lk.indexOf('auth') >= 0)
              ? '[REDACTED]' : event.request.headers[k];
          }
          event.request.headers = h;
        }
      }
      // 2. Scrub recursivo en extra/contexts/tags.
      if(event.extra)    event.extra    = scrub(event.extra);
      if(event.contexts) event.contexts = scrub(event.contexts);
      if(event.tags)     event.tags     = scrub(event.tags);

      // 3. Breadcrumbs (fetch bodies, console.log args).
      if(Array.isArray(event.breadcrumbs)){
        event.breadcrumbs = event.breadcrumbs.map(function(b){
          if(!b) return b;
          if(b.data){
            if(b.data.url)  b.data.url  = redactString(b.data.url);
            if(b.data.body) b.data.body = '[REDACTED_BODY]';
            b.data = scrub(b.data);
          }
          if(b.message) b.message = redactString(b.message);
          return b;
        });
      }

      // 4. Mensajes libres del error.
      if(event.message) event.message = redactString(event.message);
      if(event.exception && event.exception.values){
        event.exception.values.forEach(function(ex){
          if(ex.value) ex.value = redactString(ex.value);
        });
      }

      // 5. User: solo ID anonimizado, nunca email.
      if(event.user){
        event.user = { id: event.user.id || 'anon' };
      }
    }catch(e){
      // Si el scrubber peta, mejor no enviar a Sentry que filtrar PII.
      return null;
    }
    return event;
  }

  function boot(){
    if(!global.Sentry || !global.Sentry.init) return;
    global.Sentry.init({
      dsn: global.SENTRY_DSN,
      environment: (global.location && global.location.hostname === 'area2cartagena.es') ? 'production' : 'development',
      release: (global.APP_VERSION || 'cartagenaeste@v78'),
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      maxBreadcrumbs: 30,
      attachStacktrace: true,
      denyUrls: [
        /^chrome-extension:\/\//i,
        /^moz-extension:\/\//i,
        /^safari-extension:\/\//i,
        /^safari-web-extension:\/\//i
      ],
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Non-Error promise rejection captured',
        'Script error.',
        'Network request failed',
        /Extension context invalidated/,
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request',
        'auth/network-request-failed'
      ],
      beforeSend: beforeSend
    });

    // Tag de página (sin PII) y del institution branding.
    try{
      global.Sentry.setTag('page', (global.location && global.location.pathname) || '/');
      if(global.INSTITUTION_BRANDING) global.Sentry.setTag('institution', global.INSTITUTION_BRANDING);
    }catch(e){}

    // ID anonimizado determinista cuando hay sesión Firebase.
    try{
      if(global.firebase && global.firebase.auth){
        global.firebase.auth().onAuthStateChanged(function(u){
          if(u && u.uid){
            var h = 0, s = 'cart-' + u.uid;
            for(var i=0;i<s.length;i++) h = ((h<<5)-h) + s.charCodeAt(i) | 0;
            global.Sentry.setUser({ id: 'anon_' + Math.abs(h).toString(36) });
          } else {
            global.Sentry.setUser(null);
          }
        });
      }
    }catch(e){}

    global.__sentryInitialized = true;
  }

  // Carga diferida del SDK para no bloquear render.
  var s = document.createElement('script');
  s.src = SDK_URL;
  s.crossOrigin = 'anonymous';
  s.defer = true;
  s.onload = boot;
  s.onerror = function(){ /* best-effort silencioso */ };
  document.head.appendChild(s);
})(typeof window !== 'undefined' ? window : globalThis);
