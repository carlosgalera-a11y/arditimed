// ════════════════════════════════════════════════════════════════════
// content-protection.js · Capa de protección de contenido del Área II
// ════════════════════════════════════════════════════════════════════
//
// © 2026 Carlos Galera Román · Reg. Propiedad Intelectual 00765-03096622
//
// Capas defensivas (defense in depth · disuasión + forense):
//   1. Watermark dinámico con email del usuario autenticado.
//   2. Anti right-click / copy / cut / paste / drag / selectstart sobre
//      bloques marcados con la clase `.protected` o data-protect.
//   3. Disable print (Ctrl/Cmd+P interceptado con aviso).
//   4. Disable image drag/saveAs.
//   5. Detector heurístico de DevTools abierto → log a Firestore con
//      uid + timestamp + páginaUrl + userAgent.
//   6. Cabeceras CSS `user-select: none` aplicadas a `.protected`.
//   7. Watermark forense: cada vista renderiza un identificador único
//      por sesión (email + timestamp) repetido en background con
//      opacidad baja — si alguien hace screenshot se ve la procedencia.
//
// IMPORTANTE: estas capas son DISUASIVAS, no inviolables. En navegador
// web cualquier código JS puede ser inspeccionado por un atacante
// skilled. El valor real es:
//   (a) detener el 99% de copia casual (clic derecho, arrastrar imagen),
//   (b) dejar evidencia forense (watermark + logs) para perseguir
//       legalmente al filtrador,
//   (c) hacer costoso el robo masivo (anti-bot + App Check + rate limit).
//
// CONFIGURACIÓN:
//   window.PROTECT_CONTENT = {
//     enabled: true,             // default true en páginas que cargan el script
//     blockPrint: true,
//     blockCopy: true,
//     watermark: true,
//     detectDevTools: true,
//     logToFirestore: true,      // requiere firebase.auth() inicializado
//     allowSelectIn: ['.allow-copy', 'textarea', 'input'],
//   };
//
// USO:
//   Marca el bloque con class="protected" o atributo data-protect, o
//   simplemente carga este script en la página y el body completo será
//   protegido salvo elementos con clase `.allow-copy`, inputs y textareas.
//
// ════════════════════════════════════════════════════════════════════

(function(global){
  'use strict';

  var cfg = Object.assign({
    enabled: true,
    blockCopy: true,
    blockPrint: true,
    blockDrag: true,
    blockRightClick: true,
    watermark: true,
    detectDevTools: true,
    logToFirestore: true,
    allowSelectIn: ['.allow-copy', 'textarea', 'input', '[contenteditable="true"]'],
  }, (global.PROTECT_CONTENT || {}));

  if (!cfg.enabled) return;

  // ── Helper: ¿el evento ocurre dentro de un elemento permitido? ──
  function isAllowed(target){
    if (!target || !target.matches) return false;
    for (var i=0; i<cfg.allowSelectIn.length; i++){
      try { if (target.closest(cfg.allowSelectIn[i])) return true; } catch(e){}
    }
    return false;
  }

  // ── Aviso disuasivo cuando se detecta intento de copia ─────────
  var _warnShown = false;
  function showWarning(reason){
    if (_warnShown) return;
    _warnShown = true;
    try {
      var box = document.createElement('div');
      box.setAttribute('role', 'alert');
      box.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);'
        + 'background:#fef3c7;color:#92400e;border:1px solid #f59e0b;border-radius:10px;'
        + 'padding:12px 18px;font-family:system-ui,-apple-system,sans-serif;font-size:.88rem;'
        + 'box-shadow:0 4px 16px rgba(0,0,0,.18);z-index:99999;max-width:90vw;line-height:1.45;';
      box.innerHTML = '⚠️ <strong>Contenido protegido</strong> · '
        + 'Obra registrada (Reg. PI 00765-03096622). '
        + 'La reproducción sin autorización es perseguible legalmente. '
        + (reason ? '<br><small style="opacity:.75">Motivo: ' + reason + '</small>' : '');
      document.body.appendChild(box);
      setTimeout(function(){ try { box.remove(); _warnShown = false; } catch(e){} }, 4500);
    } catch(e){}
  }

  // ── 1. Block right-click ────────────────────────────────────────
  if (cfg.blockRightClick){
    document.addEventListener('contextmenu', function(ev){
      if (isAllowed(ev.target)) return;
      ev.preventDefault();
      showWarning('clic derecho');
      return false;
    }, true);
  }

  // ── 2. Block copy / cut ─────────────────────────────────────────
  if (cfg.blockCopy){
    ['copy', 'cut'].forEach(function(evt){
      document.addEventListener(evt, function(ev){
        if (isAllowed(ev.target)) return;
        ev.preventDefault();
        try { ev.clipboardData && ev.clipboardData.setData('text/plain',
          '© Cartagenaeste · Reg. PI 00765-03096622 · Contenido protegido. '
          + 'Copia no autorizada. Fecha: ' + new Date().toISOString()); } catch(e){}
        showWarning('copia bloqueada');
        logAttempt('copy');
        return false;
      }, true);
    });
  }

  // ── 3. Block drag (imágenes, textos seleccionados) ──────────────
  if (cfg.blockDrag){
    document.addEventListener('dragstart', function(ev){
      if (isAllowed(ev.target)) return;
      ev.preventDefault();
      return false;
    }, true);
  }

  // ── 4. Block print ──────────────────────────────────────────────
  if (cfg.blockPrint){
    window.addEventListener('beforeprint', function(ev){
      showWarning('impresión bloqueada — usa la opción "Exportar PDF" oficial si está disponible');
      logAttempt('print');
      // No podemos cancelar beforeprint en todos los navegadores; el CSS
      // @media print de abajo oculta el contenido como segunda capa.
    });
    // CSS print bloqueo: si beforeprint no se cancela, esto vacía la
    // página en el print preview.
    var style = document.createElement('style');
    style.textContent = '@media print { body > *:not(.allow-print) { display:none !important; } '
      + 'body::after { content:"📋 Esta página contiene contenido protegido (Reg. PI 00765-03096622). '
      + 'Para una copia oficial contacta con el administrador."; display:block; padding:40px; font-family:sans-serif; }}';
    document.head.appendChild(style);

    // Capturar Ctrl/Cmd+P
    document.addEventListener('keydown', function(ev){
      if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'p' || ev.key === 'P')){
        ev.preventDefault();
        showWarning('atajo de impresión bloqueado');
        logAttempt('print-shortcut');
        return false;
      }
    }, true);
  }

  // ── 5. Block Ctrl/Cmd+S, Ctrl/Cmd+U (view source) ──────────────
  document.addEventListener('keydown', function(ev){
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === 's' || ev.key === 'u' || ev.key === 'S' || ev.key === 'U')){
      ev.preventDefault();
      showWarning(ev.key.toLowerCase() === 's' ? 'guardar página bloqueado' : 'ver código fuente bloqueado');
      logAttempt('save-or-view-source');
      return false;
    }
  }, true);

  // ── 6. Watermark forense (variante discreta 2026-05) ───────────
  // El watermark masivo en diagonal (84 repeticiones) molestaba la
  // lectura clínica. Lo sustituimos por:
  //   (a) Stamp pequeño esquina inferior-izquierda con email +
  //       timestamp (solo tras login, opacidad baja). Sigue siendo
  //       evidencia forense si el usuario hace screenshot.
  //   (b) Bloque @media print: al imprimir o "Guardar como PDF",
  //       imprime el mismo texto como pie de página visible y un
  //       watermark diagonal central. Cumple el propósito original
  //       (huella en cualquier copia distribuida) sin estorbar
  //       durante el uso normal.
  // El audit log (logAttempt) sigue activo — sigue grabando intentos
  // sospechosos (devtools, save-as, view-source, copy de bloques
  // grandes) en /protect_audit Firestore.
  function injectWatermark(label){
    if (!cfg.watermark) return;
    var existing = document.getElementById('__cartage_wm');
    if (existing) existing.remove();
    var existingPrint = document.getElementById('__cartage_wm_print');
    if (existingPrint) existingPrint.remove();

    var text = label || '© Cartagenaeste · Reg.PI 00765-03096622';

    // (a) Stamp permanente esquina inferior-izquierda, discreto.
    var wm = document.createElement('div');
    wm.id = '__cartage_wm';
    wm.setAttribute('aria-hidden', 'true');
    wm.style.cssText = 'position:fixed;left:8px;bottom:6px;z-index:9998;'
      + 'pointer-events:none;user-select:none;'
      + 'font-family:system-ui,-apple-system,sans-serif;font-size:9px;'
      + 'color:#94a3b8;opacity:.38;letter-spacing:.2px;'
      + 'text-shadow:0 1px 0 rgba(255,255,255,.55);'
      + 'max-width:62vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    wm.textContent = text;
    if (document.body) document.body.appendChild(wm);

    // (b) Bloque print: watermark grande diagonal + pie de página.
    var style = document.createElement('style');
    style.id = '__cartage_wm_print';
    style.textContent =
      '@media print{' +
        '#__cartage_wm{position:fixed;left:50%;top:50%;bottom:auto;' +
          'transform:translate(-50%,-50%) rotate(-30deg);' +
          'font-size:42pt;color:#000;opacity:.07;font-weight:700;' +
          'letter-spacing:1px;max-width:none;white-space:nowrap;' +
          'text-shadow:none;}' +
        '#__cartage_wm::after{content:"' + text.replace(/"/g, '\\"') + '";' +
          'position:fixed;left:0;right:0;bottom:6mm;font-size:8pt;' +
          'opacity:.50;color:#475569;text-align:center;display:block;' +
          'transform:none;font-weight:400;letter-spacing:.5px;}' +
      '}';
    document.head.appendChild(style);
  }

  // ── 7. DevTools detector (heurístico) ──────────────────────────
  // Compara window.outerHeight - innerHeight; cuando DevTools se abre
  // en panel inferior/lateral, la diferencia salta. Es heurístico y
  // puede dar falsos positivos en algunos navegadores, por eso solo
  // LOG (no bloqueo).
  if (cfg.detectDevTools){
    var devToolsOpen = false;
    var threshold = 160;
    setInterval(function(){
      try {
        var w = window.outerWidth - window.innerWidth;
        var h = window.outerHeight - window.innerHeight;
        var open = (w > threshold) || (h > threshold);
        if (open && !devToolsOpen){
          devToolsOpen = true;
          logAttempt('devtools-open');
        } else if (!open && devToolsOpen){
          devToolsOpen = false;
        }
      } catch(e){}
    }, 1500);
  }

  // ── Audit log ──────────────────────────────────────────────────
  // Envía intentos a Firestore (colección protect_audit) con info
  // mínima: email/uid (si hay), userAgent, url, tipo de intento.
  // Si firebase no está disponible, falla silenciosamente.
  function logAttempt(reason){
    if (!cfg.logToFirestore) return;
    try {
      if (typeof firebase === 'undefined' || !firebase.firestore) return;
      var u = (firebase.auth && firebase.auth().currentUser) || null;
      var doc = {
        reason: reason,
        url: location.href.slice(0, 500),
        ua: (navigator.userAgent || '').slice(0, 200),
        ts: firebase.firestore.FieldValue.serverTimestamp(),
        uid: u ? u.uid : null,
        email: u ? (u.email || null) : null,
      };
      firebase.firestore().collection('protect_audit').add(doc).catch(function(){});
    } catch(e){}
  }

  // ── Init ───────────────────────────────────────────────────────
  function init(){
    // Watermark inicial (sin user). Tras auth, se actualiza con email.
    injectWatermark();
    if (typeof firebase !== 'undefined' && firebase.auth){
      try {
        firebase.auth().onAuthStateChanged(function(u){
          if (u){
            var ts = new Date().toISOString().slice(0,16).replace('T',' ');
            injectWatermark('© ' + (u.email || u.uid || 'Cartagenaeste') + ' · ' + ts);
          } else {
            injectWatermark();
          }
        });
      } catch(e){}
    }
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose minimal API para que páginas pueden re-renderizar watermark
  // si crean DOM dinámicamente que lo tape.
  global.CartageProtect = {
    refreshWatermark: function(label){ injectWatermark(label); },
    log: logAttempt,
  };

})(typeof window !== 'undefined' ? window : globalThis);
