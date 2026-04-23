/* ══════════════════════════════════════════════════════════════════
   FOOTER-GLOBAL.JS · Footer unificado Cartagenaeste
   ══════════════════════════════════════════════════════════════════
   Inyecta un footer consistente en todas las páginas públicas con:
     · Disclaimer formativo permanente (CLAUDE.md §4)
     · Autoría + Registro Propiedad Intelectual
     · Badges de acreditaciones (HONcode, CC, RGPD, AI Act)
     · Enlaces legales (Aviso legal, Privacidad, Acreditaciones, etc.)

   Uso:
     <script src="footer-global.js" defer></script>

   Si la página ya tiene un <footer data-global="skip">...</footer>,
   no se inyecta nada (opt-out explícito).
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  if(document.querySelector('footer[data-global="injected"]')) return;
  if(document.querySelector('footer[data-global="skip"]')) return;

  var css = '' +
    '#cart-footer-global{margin-top:48px;padding:32px 20px 24px;background:#0f172a;color:#cbd5e1;font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;border-top:3px solid #2563eb}' +
    '#cart-footer-global .cfg-wrap{max-width:1200px;margin:0 auto}' +
    '#cart-footer-global .cfg-disclaimer{background:#1e293b;border-left:3px solid #f59e0b;padding:10px 14px;margin-bottom:20px;font-size:13px;color:#fef3c7;border-radius:0 6px 6px 0}' +
    '#cart-footer-global .cfg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px;margin-bottom:24px}' +
    '#cart-footer-global .cfg-grid h4{margin:0 0 8px;color:#f8fafc;font-size:13px;text-transform:uppercase;letter-spacing:.5px}' +
    '#cart-footer-global .cfg-grid ul{list-style:none;padding:0;margin:0}' +
    '#cart-footer-global .cfg-grid li{margin:4px 0}' +
    '#cart-footer-global .cfg-grid a{color:#cbd5e1;text-decoration:none}' +
    '#cart-footer-global .cfg-grid a:hover{color:#60a5fa;text-decoration:underline}' +
    '#cart-footer-global .cfg-badges{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 20px}' +
    '#cart-footer-global .cfg-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:#1e293b;border:1px solid #334155;border-radius:999px;font-size:11px;color:#cbd5e1}' +
    '#cart-footer-global .cfg-badge .cfg-dot{width:6px;height:6px;border-radius:50%;background:#94a3b8}' +
    '#cart-footer-global .cfg-badge.active .cfg-dot{background:#10b981}' +
    '#cart-footer-global .cfg-badge.pending .cfg-dot{background:#f59e0b}' +
    '#cart-footer-global .cfg-meta{border-top:1px solid #1e293b;padding-top:16px;font-size:12px;color:#94a3b8;text-align:center}' +
    '#cart-footer-global .cfg-meta strong{color:#e2e8f0}' +
    '@media(prefers-color-scheme:light){#cart-footer-global{background:#f1f5f9;color:#334155;border-top-color:#2563eb}' +
      '#cart-footer-global .cfg-disclaimer{background:#fef3c7;color:#78350f}' +
      '#cart-footer-global .cfg-grid h4{color:#0f172a}' +
      '#cart-footer-global .cfg-grid a{color:#334155}' +
      '#cart-footer-global .cfg-badge{background:#fff;border-color:#cbd5e1;color:#334155}' +
      '#cart-footer-global .cfg-meta{border-top-color:#cbd5e1;color:#64748b}' +
      '#cart-footer-global .cfg-meta strong{color:#0f172a}}';

  var year = new Date().getFullYear();
  var swVer = 'v119';

  var html = '' +
    '<div class="cfg-wrap">' +
      '<div class="cfg-disclaimer">' +
        '<strong>Plataforma formativa.</strong> No diagnóstica. No sustituye al juicio clínico. ' +
        'Datos seudonimizados con fines docentes conforme a RGPD y LOPDGDD.' +
      '</div>' +

      '<div class="cfg-grid">' +
        '<div>' +
          '<h4>Sobre el proyecto</h4>' +
          '<ul>' +
            '<li><a href="/about.html">Quiénes somos</a></li>' +
            '<li><a href="/financiacion.html">Financiación y transparencia</a></li>' +
            '<li><a href="/acreditaciones.html">Acreditaciones</a></li>' +
            '<li><a href="/producto.html">El producto</a></li>' +
          '</ul>' +
        '</div>' +
        '<div>' +
          '<h4>Legal</h4>' +
          '<ul>' +
            '<li><a href="/aviso-legal.html">Aviso legal</a></li>' +
            '<li><a href="/privacidad.html">Política de privacidad</a></li>' +
            '<li><a href="/eliminar-cuenta.html">Eliminar mi cuenta</a></li>' +
            '<li><a href="/sitemap.xml">Mapa del sitio</a></li>' +
          '</ul>' +
        '</div>' +
        '<div>' +
          '<h4>Para profesionales</h4>' +
          '<ul>' +
            '<li><a href="/profesionales.html">Panel profesional</a></li>' +
            '<li><a href="/docencia.html">Docencia</a></li>' +
            '<li><a href="/fuentes-recursos.html">Fuentes y recursos</a></li>' +
            '<li><a href="/fichas-consulta-rapida.html">Fichas de consulta rápida</a></li>' +
          '</ul>' +
        '</div>' +
        '<div>' +
          '<h4>Para pacientes</h4>' +
          '<ul>' +
            '<li><a href="/pacientes.html">Espacio paciente</a></li>' +
            '<li><a href="/consejos-salud.html">Consejos de salud</a></li>' +
            '<li><a href="/prepara-consulta.html">Prepara tu consulta</a></li>' +
            '<li><a href="/recursos-comunitarios.html">Recursos comunitarios</a></li>' +
          '</ul>' +
        '</div>' +
      '</div>' +

      '<div class="cfg-badges" aria-label="Acreditaciones y cumplimiento">' +
        '<span class="cfg-badge pending"><span class="cfg-dot"></span>HONcode · en trámite</span>' +
        '<span class="cfg-badge active"><span class="cfg-dot"></span>RGPD + LOPDGDD</span>' +
        '<span class="cfg-badge active"><span class="cfg-dot"></span>EU AI Act 2024/1689</span>' +
        '<span class="cfg-badge active"><span class="cfg-dot"></span>Datos en UE · europe-west1</span>' +
        '<span class="cfg-badge active"><span class="cfg-dot"></span>App Check enforce</span>' +
        '<span class="cfg-badge pending"><span class="cfg-dot"></span>WIS Applauded · prevista</span>' +
      '</div>' +

      '<div class="cfg-meta">' +
        '© ' + year + ' <strong>Carlos Galera Román</strong> · ' +
        'Registro Propiedad Intelectual <strong>00765-03096622</strong> · ' +
        'Art. 51 LPI · Todos los derechos reservados.<br>' +
        'Cartagenaeste · <span data-cart-tenant="nombre">Área II Cartagena</span> · ' +
        '<span title="Service Worker cache">SW ' + swVer + '</span>' +
      '</div>' +
    '</div>';

  function inject(){
    if(document.querySelector('footer[data-global="injected"]')) return;
    var style = document.createElement('style');
    style.setAttribute('data-cfg-footer', '1');
    style.textContent = css;
    document.head.appendChild(style);
    var footer = document.createElement('footer');
    footer.id = 'cart-footer-global';
    footer.setAttribute('data-global', 'injected');
    footer.setAttribute('role', 'contentinfo');
    footer.innerHTML = html;
    document.body.appendChild(footer);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
