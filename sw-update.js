// sw-update.js · registra sw.js y muestra banner no bloqueante cuando hay nueva versión.
(function(){
  'use strict';
  if (!('serviceWorker' in navigator)) return;

  function showUpdateBanner(registration){
    if (document.getElementById('sw-update-banner')) return;
    var b = document.createElement('div');
    b.id = 'sw-update-banner';
    b.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#0f6b4a;color:#fff;padding:14px 18px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:99999;font:600 14px/1.4 -apple-system,system-ui,sans-serif;max-width:90%;display:flex;gap:12px;align-items:center;';
    b.innerHTML = '<span>✨ Nueva versión disponible</span>'
      + '<button id="sw-update-btn" style="background:#fff;color:#0f6b4a;border:none;border-radius:8px;padding:8px 14px;font:inherit;cursor:pointer;">Actualizar</button>'
      + '<button id="sw-dismiss-btn" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.4);border-radius:8px;padding:8px 10px;font:inherit;cursor:pointer;opacity:.8;">Más tarde</button>';
    document.body.appendChild(b);
    document.getElementById('sw-update-btn').onclick = function(){
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      location.reload();
    };
    document.getElementById('sw-dismiss-btn').onclick = function(){ b.remove(); };
  }

  window.addEventListener('load', function(){
    navigator.serviceWorker.register('/sw.js').then(function(reg){
      // Si ya hay un SW esperando al cargar → mostrar banner.
      if (reg.waiting) showUpdateBanner(reg);
      reg.addEventListener('updatefound', function(){
        var newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', function(){
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner(reg);
          }
        });
      });

      // Fuerza chequeo de nueva versión cuando:
      //   • el usuario vuelve a la pestaña (visibilitychange → visible)
      //   • el navegador recupera conexión (online)
      //   • cada 30 minutos mientras la pestaña esté abierta
      // Crítico para PWAs instaladas que pueden quedarse semanas sin
      // cerrarse y por tanto sin detectar versiones nuevas.
      function checkUpdate(){ try{ reg.update(); }catch(e){} }
      document.addEventListener('visibilitychange', function(){
        if (document.visibilityState === 'visible') checkUpdate();
      });
      window.addEventListener('online', checkUpdate);
      setInterval(checkUpdate, 30 * 60 * 1000);
    }).catch(function(){});

    // Recarga automática cuando el nuevo SW toma control.
    var refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', function(){
      if (refreshing) return;
      refreshing = true;
      location.reload();
    });
  });
})();
