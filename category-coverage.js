// ════════════════════════════════════════════════════════════════════
// category-coverage.js · UX de especialidades sin material cargado
// ════════════════════════════════════════════════════════════════════
//
// Hace tres cosas (carga después de app-main.js, no toca el código
// existente):
//
//   1. Tras cargar `documents.json`, recorre los botones del sidebar
//      de especialidades. A los que tengan 0 documentos:
//        · añade un badge "WIP" (work-in-progress) visible.
//        · los mueve AL FINAL de la lista (appendChild reordena DOM).
//
//   2. Hook en `cambiarCategoria` (si está disponible) o detección via
//      MutationObserver para inyectar un banner amarillo prominente en
//      el panel de documentos cuando la categoría seleccionada esté
//      vacía. Mensaje claro: "esta especialidad aún no tiene material
//      cargado, la consulta IA estará disponible cuando se añadan
//      documentos."
//
//   3. Expone `window.CategoryCoverage.getEmptyCategories()` para que
//      el admin-dashboard pueda pintarlo en su propio panel.
//
// Defensa: si `documents` o `categories` no están disponibles, la
// función NO falla — simplemente no hace nada. Sin riesgo de romper
// la carga de la app.
// ════════════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  var MAX_WAIT_MS = 8000;
  var POLL_MS = 250;
  var started = Date.now();

  function getDocCount(cat) {
    try {
      var docs = global.documents && global.documents[cat];
      return Array.isArray(docs) ? docs.length : 0;
    } catch (e) {
      return 0;
    }
  }

  function getEmptyCategories() {
    if (!global.categories) return [];
    var empty = [];
    Object.keys(global.categories).forEach(function (cat) {
      if (getDocCount(cat) === 0) empty.push(cat);
    });
    return empty;
  }

  function injectStyle() {
    if (document.getElementById('cc-style')) return;
    var s = document.createElement('style');
    s.id = 'cc-style';
    s.textContent =
      '.cc-wip-badge{display:inline-block;margin-left:6px;padding:2px 7px;' +
      'background:rgba(212,168,83,.22);color:#a16207;border:1px solid rgba(212,168,83,.45);' +
      'border-radius:8px;font-size:.62rem;font-weight:800;letter-spacing:.04em;' +
      'text-transform:uppercase;vertical-align:middle;}' +
      '.category-btn.cc-empty{opacity:.78;}' +
      '.category-btn.cc-empty:hover{opacity:1;}' +
      '.cc-empty-banner{background:linear-gradient(135deg,#fef3c7,#fde68a);' +
      'border:1px solid #f59e0b;border-left:4px solid #d97706;border-radius:10px;' +
      'padding:14px 18px;margin:14px 0;color:#92400e;font-size:.92rem;line-height:1.55;}' +
      '.cc-empty-banner strong{color:#78350f;font-weight:800;}' +
      '.cc-empty-banner .cc-banner-actions{margin-top:8px;font-size:.84rem;opacity:.85;}';
    document.head.appendChild(s);
  }

  function markSidebar() {
    if (!global.categories || !global.documents) return false;
    var btns = document.querySelectorAll('#categoriesList .category-btn');
    if (!btns.length) return false;
    var list = document.getElementById('categoriesList');
    if (!list) return false;

    var moved = 0;
    btns.forEach(function (btn) {
      // El texto del botón incluye emoji + nombre de categoría.
      // Extraemos la categoría comparando contra el objeto categories.
      var label = (btn.textContent || '').trim();
      var matchedCat = null;
      Object.keys(global.categories).forEach(function (cat) {
        if (label.indexOf(cat) !== -1) matchedCat = cat;
      });
      if (!matchedCat) return;
      var count = getDocCount(matchedCat);
      if (count > 0) {
        // Si tuvo badge en el pasado, lo quitamos (por si se añadieron docs).
        var oldBadge = btn.querySelector('.cc-wip-badge');
        if (oldBadge) oldBadge.remove();
        btn.classList.remove('cc-empty');
        return;
      }
      if (!btn.querySelector('.cc-wip-badge')) {
        var b = document.createElement('span');
        b.className = 'cc-wip-badge';
        b.title = 'Work in progress — sin documentos cargados';
        b.textContent = 'WIP';
        btn.appendChild(b);
      }
      btn.classList.add('cc-empty');
      // Mueve al final del sidebar.
      list.appendChild(btn);
      moved++;
    });
    return true;
  }

  function injectBanner(cat) {
    if (!cat) return;
    var docList = document.getElementById('documentosList');
    if (!docList) return;
    // Si ya hay banner para esta categoría, no duplicar.
    var existing = docList.querySelector('.cc-empty-banner');
    if (existing && existing.dataset.cat === cat) return;
    if (existing) existing.remove();
    if (getDocCount(cat) > 0) return; // hay docs, no banner

    var banner = document.createElement('div');
    banner.className = 'cc-empty-banner';
    banner.dataset.cat = cat;
    banner.innerHTML =
      '⚠️ <strong>' + cat + '</strong> aún no tiene material cargado.' +
      '<br>La consulta IA por documentos NO estará disponible para esta especialidad hasta que ' +
      'se añadan PDFs o protocolos al panel. Las preguntas IA generales del sistema seguirán ' +
      'funcionando, pero sin contexto local.' +
      '<div class="cc-banner-actions">📥 Si eres administrador, sube material desde ' +
      '<em>Profesionales → Atención Hospitalaria → ' + cat + ' → +Añadir</em>.</div>';
    // Insertamos antes de la lista de documentos vacía.
    docList.parentNode.insertBefore(banner, docList);
  }

  function removeBanner() {
    document.querySelectorAll('.cc-empty-banner').forEach(function (b) {
      b.remove();
    });
  }

  function wrapCambiarCategoria() {
    if (typeof global.cambiarCategoria !== 'function') return false;
    if (global.cambiarCategoria.__ccWrapped) return true;
    var original = global.cambiarCategoria;
    global.cambiarCategoria = function (c, b) {
      removeBanner();
      var r = original.apply(this, arguments);
      try {
        injectBanner(c);
      } catch (e) {}
      return r;
    };
    global.cambiarCategoria.__ccWrapped = true;
    return true;
  }

  function checkInitialCategory() {
    // Si al cargar la página ya hay una categoría activa (la primera
    // del array, "Cardiología") inyecta banner si está vacía.
    if (global.currentCategory) injectBanner(global.currentCategory);
  }

  function tick() {
    injectStyle();
    var ok1 = markSidebar();
    var ok2 = wrapCambiarCategoria();
    if (ok1 && ok2) {
      checkInitialCategory();
      return; // listo
    }
    if (Date.now() - started > MAX_WAIT_MS) {
      // Última oportunidad y nos rendimos silenciosamente.
      return;
    }
    setTimeout(tick, POLL_MS);
  }

  function init() {
    setTimeout(tick, POLL_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // API pública para admin-dashboard.
  global.CategoryCoverage = {
    getEmptyCategories: getEmptyCategories,
    getDocCount: getDocCount,
    refresh: function () {
      markSidebar();
      if (global.currentCategory) injectBanner(global.currentCategory);
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
