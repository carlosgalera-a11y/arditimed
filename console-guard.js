/* ══════════════════════════════════════════════════════════════════
   CONSOLE-GUARD.JS · Silencia logs ruidosos en producción
   ══════════════════════════════════════════════════════════════════
   En producción (hostname area2cartagena.es) silencia los niveles
   `log`, `debug`, `info` y atenúa `warn` (solo primer aviso por
   mensaje), manteniendo `error` intacto para Sentry.

   En desarrollo (localhost / 127.0.0.1 / github.io / ?debug=1)
   deja todo intacto.

   Uso:
     <script src="console-guard.js"></script>  <!-- lo antes posible -->

   Override manual:
     ?debug=1 en la URL → fuerza modo verbose
     localStorage.setItem('cartDebug','1') → persistente
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  try{
    var host = (location && location.hostname || '').toLowerCase();
    var qs = (location && location.search || '');
    var isDev = host === 'localhost'
             || host === '127.0.0.1'
             || host.indexOf('github.io') >= 0
             || host.indexOf('.local') >= 0
             || qs.indexOf('debug=1') >= 0;
    try{ if(localStorage.getItem('cartDebug') === '1') isDev = true; }catch(e){}

    window.cartDebug = isDev;
    if(isDev) return;

    var noop = function(){};
    // Silenciamos ruido, nunca `error` (Sentry + debugging crítico).
    ['log','debug','info','trace'].forEach(function(k){
      try{ console[k] = noop; }catch(e){}
    });

    // `warn`: deduplicación por mensaje (evita inundar consola).
    var seen = Object.create(null);
    var origWarn = console.warn ? console.warn.bind(console) : noop;
    console.warn = function(){
      try{
        var key = String(arguments[0] || '').slice(0, 120);
        if(seen[key]) return;
        seen[key] = 1;
        origWarn.apply(null, arguments);
      }catch(e){ origWarn.apply(null, arguments); }
    };
  }catch(e){}
})();
