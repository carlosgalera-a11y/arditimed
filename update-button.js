// ══════════════════════════════════════════════════════════════════════
// update-button.js · Botón flotante de "Actualizar app" en todas las páginas
// ══════════════════════════════════════════════════════════════════════
// Resuelve: usuarios con PWA instalada o con caché antigua que no se
// actualiza automáticamente pese al skipWaiting del SW.
//
// Al pulsar:
//   1. Desregistra todos los Service Workers.
//   2. Borra todas las Cache Storage caches del dominio.
//   3. Limpia localStorage/sessionStorage relacionados con caché de la app.
//   4. Recarga la página con query-string ?_t=<timestamp> (cache-busting).
//
// Uso: añadir <script src="update-button.js" defer></script> en cada HTML.
// Se auto-inyecta al DOM sin necesidad de más código.
// ══════════════════════════════════════════════════════════════════════
(function(){
  'use strict';

  function $(id){ return document.getElementById(id); }

  function createButton(){
    // Modo inline: si la página trae un elemento con [data-cart-update]
    // (p.ej. un botón en el topbar), enganchamos ahí y no creamos flotante.
    var inline = document.querySelector('[data-cart-update]');
    if(inline && !inline.__cartWired){
      inline.__cartWired = true;
      inline.addEventListener('click', forceUpdate);
      return;
    }
    if($('cart-update-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'cart-update-btn';
    btn.setAttribute('aria-label', 'Actualizar aplicación a la última versión');
    btn.type = 'button';
    btn.innerHTML = '<span style="font-size:16px;line-height:1;">🔄</span><span class="cart-update-label">Actualizar</span>';
    btn.style.cssText = [
      'position:fixed',
      'top:10px',
      'right:10px',
      'z-index:2147483646',
      'display:inline-flex',
      'align-items:center',
      'gap:6px',
      'padding:8px 12px',
      'background:linear-gradient(135deg,#0d47a1,#1565c0)',
      'color:#fff',
      'border:none',
      'border-radius:20px',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
      'font-size:12px',
      'font-weight:700',
      'cursor:pointer',
      'box-shadow:0 2px 8px rgba(13,71,161,.35)',
      'transition:transform .15s ease, box-shadow .15s ease',
      'opacity:.85'
    ].join(';');

    // Estilo responsive: en móviles <=480px solo icono
    var style = document.createElement('style');
    style.textContent = '@media(max-width:480px){#cart-update-btn .cart-update-label{display:none;}#cart-update-btn{padding:8px 10px;border-radius:50%;}}#cart-update-btn:hover{transform:translateY(-1px);opacity:1;box-shadow:0 4px 14px rgba(13,71,161,.5);}#cart-update-btn:active{transform:translateY(0);}#cart-update-btn:focus-visible{outline:2px solid #fff;outline-offset:2px;}';
    document.head.appendChild(style);

    btn.addEventListener('click', forceUpdate);
    document.body.appendChild(btn);
  }

  async function forceUpdate(ev){
    var btn = ev && ev.currentTarget;
    if(btn){
      btn.disabled = true;
      btn.innerHTML = '<span style="display:inline-block;animation:spin 1s linear infinite;font-size:16px;line-height:1;">⏳</span><span class="cart-update-label">Actualizando…</span>';
      var spinStyle = document.createElement('style');
      spinStyle.textContent = '@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}';
      document.head.appendChild(spinStyle);
    }

    // Confirma solo si hay datos en localStorage que podrían ser importantes.
    // Para preservar sesiones Firebase, NO tocamos localStorage genérico.
    // Solo limpiamos cachés del navegador y service worker.
    try{
      // 1. Desregistrar todos los Service Workers.
      if('serviceWorker' in navigator){
        var regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(function(r){ return r.unregister(); }));
      }
    }catch(e){ console.warn('[update-btn] SW unregister error:', e); }

    try{
      // 2. Borrar todas las Cache Storage caches del dominio.
      if('caches' in window){
        var keys = await caches.keys();
        await Promise.all(keys.map(function(k){ return caches.delete(k); }));
      }
    }catch(e){ console.warn('[update-btn] Cache delete error:', e); }

    try{
      // 3. Limpiar solo las keys de caché de app (no sesiones ni datos user).
      var keepPrefixes = ['firebase:', 'firebaseLocalStorage', 'fbase', '_megacuaderno', 'scan_hist'];
      var toRemove = [];
      for(var i=0;i<localStorage.length;i++){
        var k = localStorage.key(i);
        if(!k) continue;
        var keep = keepPrefixes.some(function(p){ return k.indexOf(p)===0; });
        if(!keep && (k.indexOf('cache')>=0 || k.indexOf('_v')===0 || k==='last_version')){
          toRemove.push(k);
        }
      }
      toRemove.forEach(function(k){ try{ localStorage.removeItem(k); }catch(e){} });
    }catch(e){ console.warn('[update-btn] localStorage clean error:', e); }

    // 4. Recargar con cache-busting.
    var base = location.pathname + location.search;
    var sep = base.indexOf('?') >= 0 ? '&' : '?';
    var url = base + sep + '_t=' + Date.now() + location.hash;
    // Pequeña pausa para dar feedback visual antes del reload.
    setTimeout(function(){ location.replace(url); }, 300);
  }

  // Inyección cuando el DOM esté listo.
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', createButton);
  } else {
    createButton();
  }

  // Expón función global por si se quiere llamar desde onclick custom.
  window.cartForceUpdate = function(){ forceUpdate({ currentTarget: document.getElementById('cart-update-btn') }); };
})();
