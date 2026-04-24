/* ══════════════════════════════════════════════════════════════════
   CANONICAL-BANNER.JS · Sugerencia de dominio oficial
   ══════════════════════════════════════════════════════════════════
   Si el usuario está en el mirror github.io (porque escaneó un QR
   antiguo), muestra una banda discreta arriba sugiriendo ir a
   area2cartagena.es preservando el path. No es un redirect forzado:
   es una sugerencia. El usuario puede cerrarla y seguir usando el
   mirror.

   Objetivo: consolidar tráfico en el dominio canónico sin romper
   la experiencia de quien ya tenga la URL antigua guardada.

   Solo se activa en hostnames que contienen 'github.io' o
   parametrizados aquí. En area2cartagena.es nunca se muestra.
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  // Solo activar en el mirror GitHub Pages
  var host = (location.hostname || '').toLowerCase();
  var MIRROR_HOSTS = ['github.io'];
  var isMirror = MIRROR_HOSTS.some(function(h){ return host.indexOf(h) >= 0; });
  if(!isMirror) return;

  // Opt-out persistente
  try{
    if(localStorage.getItem('cart_canonical_dismissed') === '1') return;
  }catch(e){}

  // Construir URL canónica preservando path
  var path = location.pathname || '/';
  // github.io sirve desde /Cartagenaeste/ · area2cartagena.es sirve desde /
  path = path.replace(/^\/Cartagenaeste\//, '/');
  if(path === '/Cartagenaeste') path = '/';
  var canonicalUrl = 'https://area2cartagena.es' + path + (location.search || '') + (location.hash || '');

  function show(){
    if(document.getElementById('cart-canonical-banner')) return;
    var bar = document.createElement('div');
    bar.id = 'cart-canonical-banner';
    bar.setAttribute('role', 'complementary');
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;padding:10px 14px;font:500 13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;align-items:center;gap:10px;flex-wrap:wrap;box-shadow:0 2px 10px rgba(0,0,0,.25)';
    bar.innerHTML =
      '<span style="font-size:16px">🌐</span>' +
      '<span style="flex:1;min-width:220px">Esta plataforma tiene dominio oficial: <strong>area2cartagena.es</strong></span>' +
      '<a href="' + canonicalUrl + '" id="cart-canonical-go" style="background:#fff;color:#2563eb;padding:5px 12px;border-radius:6px;font-weight:700;text-decoration:none;font-size:12px">Ir al oficial ↗</a>' +
      '<button id="cart-canonical-close" aria-label="Cerrar" style="background:transparent;border:0;color:#fff;font-size:18px;cursor:pointer;padding:0 4px;line-height:1;opacity:.75">×</button>';
    document.body.appendChild(bar);

    var goBtn = document.getElementById('cart-canonical-go');
    if(goBtn){
      goBtn.addEventListener('click', function(){
        try{ if(window.cartTrack) window.cartTrack('canonical_redirect_accept', { from: host }); }catch(e){}
      });
    }
    var closeBtn = document.getElementById('cart-canonical-close');
    if(closeBtn){
      closeBtn.addEventListener('click', function(){
        try{ localStorage.setItem('cart_canonical_dismissed', '1'); }catch(e){}
        try{ if(window.cartTrack) window.cartTrack('canonical_redirect_dismiss', { from: host }); }catch(e){}
        bar.remove();
      });
    }

    // Padding top para que el banner no tape el contenido
    try{
      var extra = bar.offsetHeight || 44;
      document.body.style.paddingTop = (parseInt(getComputedStyle(document.body).paddingTop) || 0) + extra + 'px';
    }catch(e){}

    // Evento GA4 de impresión (para medir cuántos ven el banner)
    try{ if(window.cartTrack) window.cartTrack('canonical_banner_shown', { from: host }); }catch(e){}
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', show);
  } else {
    show();
  }
})();
