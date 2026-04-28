/* ══════════════════════════════════════════════════════════════════
   COOKIE-CONSENT.JS · Consentimiento para cookies analíticas (GA4)
   ══════════════════════════════════════════════════════════════════
   © 2026 Carlos Galera Román · Licencia propietaria · LPI 00765-03096622
   ══════════════════════════════════════════════════════════════════
   Cumple AEPD Cookies Guide 2024 + ePrivacy art. 5.3:
   · Cookies estrictamente necesarias (Firebase Auth, sesión) cargan
     siempre.
   · Cookies analíticas (GA4 _ga) solo si el usuario las ACEPTA.
   · Banner se muestra hasta que el usuario elige; Aceptar y Rechazar
     son igual de prominentes y de un solo click.
   · La decisión persiste en localStorage. Cambiarla: el footer (o esta
     misma página) ofrece "gestionar cookies".
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var KEY = 'cart_cookie_consent_v1';
  var STATE = {
    PENDING:  '',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
  };

  function leerEstado(){
    try { return localStorage.getItem(KEY) || STATE.PENDING; } catch(e) { return STATE.PENDING; }
  }
  function guardarEstado(v){
    try { localStorage.setItem(KEY, v); } catch(e) {}
    try { window.dispatchEvent(new CustomEvent('cart-cookie-consent', { detail: { state: v } })); } catch(e) {}
  }

  // Estado expuesto para que analytics-config.js lo consulte.
  window.cartCookieConsent = {
    isAccepted: function(){ return leerEstado() === STATE.ACCEPTED; },
    isRejected: function(){ return leerEstado() === STATE.REJECTED; },
    isPending:  function(){ return leerEstado() === STATE.PENDING; },
    state: leerEstado,
    accept: function(){ guardarEstado(STATE.ACCEPTED); ocultarBanner(); },
    reject: function(){ guardarEstado(STATE.REJECTED); ocultarBanner(); },
    reset:  function(){ guardarEstado(STATE.PENDING); mostrarBanner(); },
  };

  function inyectarBanner(){
    if (document.getElementById('cartCookieBanner')) return;
    var el = document.createElement('div');
    el.id = 'cartCookieBanner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Aviso de cookies');
    el.style.cssText = [
      'position:fixed','left:16px','right:16px','bottom:16px','z-index:9999',
      'max-width:780px','margin:0 auto','padding:14px 18px',
      'background:#0d3d26','color:#fff','border:1px solid rgba(212,168,83,.45)',
      'border-radius:14px','box-shadow:0 12px 40px rgba(0,0,0,.45)',
      'font-family:Source Sans 3,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',
      'font-size:.86rem','line-height:1.5',
      'display:flex','flex-wrap:wrap','gap:14px','align-items:center',
    ].join(';');
    el.innerHTML =
      '<div style="flex:1;min-width:240px">'
        + '<strong style="display:block;margin-bottom:4px;font-size:.92rem">🍪 Cookies y privacidad</strong>'
        + 'Usamos cookies <strong>estrictamente necesarias</strong> (sesión Firebase Auth) y, si lo aceptas, '
        + 'cookies <strong>analíticas</strong> (Google Analytics 4 con IP anonimizada) para entender cómo se '
        + 'usa la plataforma y mejorarla. No usamos cookies publicitarias ni de terceros distintos. '
        + '<a href="privacidad.html" style="color:#f3d98a;text-decoration:underline">Más información</a>.'
      + '</div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
        + '<button id="cartCookieRej" type="button" style="padding:8px 16px;background:rgba(255,255,255,.10);color:#fff;border:1px solid rgba(255,255,255,.30);border-radius:10px;cursor:pointer;font-family:inherit;font-size:.86rem;font-weight:700">Solo necesarias</button>'
        + '<button id="cartCookieAcc" type="button" style="padding:8px 16px;background:#d4a853;color:#0d3d26;border:0;border-radius:10px;cursor:pointer;font-family:inherit;font-size:.86rem;font-weight:800">Aceptar todas</button>'
      + '</div>';
    document.body.appendChild(el);
    document.getElementById('cartCookieAcc').addEventListener('click', function(){ window.cartCookieConsent.accept(); });
    document.getElementById('cartCookieRej').addEventListener('click', function(){ window.cartCookieConsent.reject(); });
  }
  function mostrarBanner(){ inyectarBanner(); }
  function ocultarBanner(){
    var el = document.getElementById('cartCookieBanner');
    if (el) el.parentNode.removeChild(el);
  }

  // Auto-disparo al cargar: si está PENDING, mostrar; si decidido, no
  // hacer nada (analytics-config.js consulta el estado).
  function init(){
    if (leerEstado() === STATE.PENDING) mostrarBanner();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
