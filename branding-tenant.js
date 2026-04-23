/* ══════════════════════════════════════════════════════════════════
   BRANDING-TENANT.JS · Branding dinámico por centro
   ══════════════════════════════════════════════════════════════════
   Lee window.Centros.getCurrentConfig() y aplica el branding del
   tenant activo a cualquier elemento marcado con data-cart-tenant.

   Marcado soportado:
     <span data-cart-tenant="nombre"></span>        → "Área II Cartagena"
     <span data-cart-tenant="hospital"></span>      → "H.G.U. Santa Lucía"
     <span data-cart-tenant="ccaa"></span>          → "Región de Murcia · SMS"
     <span data-cart-tenant="logo"></span>          → "🏥"
     <a   data-cart-tenant-href="dominio">...</a>   → href = https://<dominio>
     <a   data-cart-tenant-href="telefonoUrgencias">→ href = tel:<num>

   CSS custom properties inyectadas en :root:
     --tenant-color        color primario del centro (ej. #0f6b4a)
     --tenant-color-dark   variante oscura
     --tenant-nombre       nombre legible (use con content en ::before)

   Uso:
     <script src="branding-tenant.js" defer></script>

   Retrocompatible: si Centros no está cargado, no hace nada.
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  function apply(cfg){
    if(!cfg) return;
    try{
      var root = document.documentElement;
      if(cfg.color)     root.style.setProperty('--tenant-color', cfg.color);
      if(cfg.colorDark) root.style.setProperty('--tenant-color-dark', cfg.colorDark);
      if(cfg.nombre)    root.style.setProperty('--tenant-nombre', '"' + cfg.nombre.replace(/"/g, '\\"') + '"');
    }catch(e){}

    // Sustituir contenido en elementos [data-cart-tenant="<campo>"]
    try{
      var nodes = document.querySelectorAll('[data-cart-tenant]');
      nodes.forEach(function(el){
        var key = el.getAttribute('data-cart-tenant');
        var val = cfg[key];
        if(val == null) return;
        el.textContent = String(val);
      });
    }catch(e){}

    // Sustituir href en [data-cart-tenant-href="<campo>"]
    try{
      var hrefNodes = document.querySelectorAll('[data-cart-tenant-href]');
      hrefNodes.forEach(function(el){
        var key = el.getAttribute('data-cart-tenant-href');
        var val = cfg[key];
        if(!val) return;
        var s = String(val);
        var href;
        if(key === 'dominio')              href = 'https://' + s.replace(/^https?:\/\//, '');
        else if(/telefono|phone/i.test(key)) href = 'tel:' + s.replace(/\s+/g, '');
        else if(/email|correo/i.test(key)) href = 'mailto:' + s;
        else                               href = s;
        el.setAttribute('href', href);
      });
    }catch(e){}

    // Meta tag de debugging (y para lectura server-side si hacemos SSR algún día)
    try{
      var meta = document.querySelector('meta[name="cart-tenant"]');
      if(!meta){
        meta = document.createElement('meta');
        meta.name = 'cart-tenant';
        document.head.appendChild(meta);
      }
      meta.content = cfg.id || '';
    }catch(e){}
  }

  function run(){
    try{
      if(!window.Centros || !window.Centros.getCurrentConfig) return;
      window.Centros.getCurrentConfig().then(apply).catch(function(){});
      if(window.Centros.onChange){
        window.Centros.onChange(function(){
          window.Centros.getCurrentConfig().then(apply).catch(function(){});
        });
      }
    }catch(e){}
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
