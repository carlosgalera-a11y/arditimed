// ════════════════════════════════════════════════════════════════════
// locale-input.js · Saneador unificado de inputs numéricos
// ════════════════════════════════════════════════════════════════════
//
// Por qué existe: en España la coma decimal es el separador habitual
// (escribir "70,5 kg"). Pero los inputs `type="number"` del HTML aceptan
// punto decimal estricto en JavaScript. Si el usuario escribe "1,5", el
// parseFloat nativo devuelve NaN o 1 (corta en la coma), que en una
// calculadora de dosis pediátrica puede generar un cálculo falso
// silencioso.
//
// Esta capa:
//   1. Expone `window.parseLocaleNumber(str)` — admite coma o punto,
//      espacios, signo negativo. Devuelve `null` si no es numérico
//      válido (en lugar de NaN, que coerciona a 0 a veces).
//   2. Expone `window.attachLocaleInput(input)` — escucha `input` y
//      `blur` para normalizar el valor mostrado a punto decimal en el
//      input y exponer el valor numérico real vía dataset.
//   3. Auto-aplicación en DOMContentLoaded a todos los `<input
//      type="number">` y los `<input data-locale-number>` para no
//      tener que tocar cada formulario manualmente.
//
// Uso programático:
//   var w = window.parseLocaleNumber(document.getElementById('w').value);
//   if (w === null) { showError('Peso inválido'); return; }
//
// Filosofía: NUNCA aceptar "0" silencioso ante input inválido en
// cálculos clínicos. Devolver `null` y obligar al caller a manejarlo.
//
// ════════════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  /**
   * Parsea un número en formato local español o internacional.
   * Acepta: "1,5", "1.5", " 70 ,5 ", "-3,2", "1234,56", "1.234,56", "1,234.56".
   * Rechaza: "", "abc", "1,2,3", "1.2.3", NaN.
   *
   * @param {string|number} input
   * @returns {number|null} número parseado, o null si no es válido.
   */
  function parseLocaleNumber(input) {
    if (input == null) return null;
    if (typeof input === 'number') {
      return isFinite(input) ? input : null;
    }
    var s = String(input).trim();
    if (!s) return null;

    // Eliminar espacios internos ("70 ,5" → "70,5").
    s = s.replace(/\s+/g, '');

    // Detectar separadores de miles vs decimal. Heurística:
    // - Si hay tanto "." como "," → el último es el decimal.
    // - Si solo hay "," → es decimal.
    // - Si solo hay "." → ambiguo, asumir decimal (formato JS estándar).
    var hasDot = s.indexOf('.') !== -1;
    var hasComma = s.indexOf(',') !== -1;

    if (hasDot && hasComma) {
      var lastDot = s.lastIndexOf('.');
      var lastComma = s.lastIndexOf(',');
      if (lastComma > lastDot) {
        // Estilo europeo: "1.234,56" → punto = miles, coma = decimal.
        s = s.replace(/\./g, '').replace(',', '.');
      } else {
        // Estilo anglosajón: "1,234.56" → coma = miles, punto = decimal.
        s = s.replace(/,/g, '');
      }
    } else if (hasComma) {
      // Solo coma → si aparece más de una vez es inválido.
      if ((s.match(/,/g) || []).length > 1) return null;
      s = s.replace(',', '.');
    } else if (hasDot) {
      // Solo punto → si aparece más de una vez es inválido.
      if ((s.match(/\./g) || []).length > 1) return null;
      // s tal cual
    }

    // Validación final: debe coincidir con número signado decimal.
    if (!/^-?\d+(\.\d+)?$/.test(s)) return null;

    var n = parseFloat(s);
    return isFinite(n) ? n : null;
  }

  /**
   * Refleja en el input el valor saneado y guarda el número en
   * `input.dataset.numericValue`. Si el valor es inválido marca el
   * input con `aria-invalid="true"` para que el CSS pueda destacarlo.
   *
   * @param {HTMLInputElement} input
   * @param {{ silent?: boolean, allowEmpty?: boolean }} [opts]
   */
  function normalizeInput(input, opts) {
    opts = opts || {};
    var raw = input.value;
    if (!raw && opts.allowEmpty) {
      input.removeAttribute('aria-invalid');
      delete input.dataset.numericValue;
      return null;
    }
    var n = parseLocaleNumber(raw);
    if (n === null) {
      input.setAttribute('aria-invalid', 'true');
      delete input.dataset.numericValue;
      return null;
    }
    // Aplicar min/max si están definidos.
    var min = input.min !== '' ? parseFloat(input.min) : null;
    var max = input.max !== '' ? parseFloat(input.max) : null;
    if (min !== null && isFinite(min) && n < min) {
      input.setAttribute('aria-invalid', 'true');
      delete input.dataset.numericValue;
      return null;
    }
    if (max !== null && isFinite(max) && n > max) {
      input.setAttribute('aria-invalid', 'true');
      delete input.dataset.numericValue;
      return null;
    }
    input.removeAttribute('aria-invalid');
    input.dataset.numericValue = String(n);
    return n;
  }

  /**
   * Vincula un input con el saneador. Re-evalúa en input, blur y change.
   * No modifica el .value mientras escribe (UX no intrusivo); marca
   * aria-invalid en directo. Al blur sí normaliza a punto decimal si
   * está activo `normalizeOnBlur`.
   *
   * @param {HTMLInputElement} input
   * @param {{ normalizeOnBlur?: boolean, allowEmpty?: boolean }} [opts]
   */
  function attachLocaleInput(input, opts) {
    if (!input || input.__localeAttached) return;
    input.__localeAttached = true;
    opts = Object.assign({ normalizeOnBlur: true, allowEmpty: true }, opts || {});
    // El navegador rechaza coma en type="number"; convertimos a text
    // y añadimos inputmode="decimal" para móvil → teclado numérico con
    // coma y punto disponibles. Mantenemos pattern para validación HTML5.
    if (input.type === 'number') {
      input.type = 'text';
      if (!input.inputMode) input.inputMode = 'decimal';
      if (!input.getAttribute('pattern')) {
        input.setAttribute('pattern', '^-?\\d+([\\.,]\\d+)?$');
      }
    }
    input.addEventListener('input', function () {
      normalizeInput(input, opts);
    });
    input.addEventListener('blur', function () {
      var n = normalizeInput(input, opts);
      if (opts.normalizeOnBlur && n !== null) {
        // Refleja con punto decimal estándar (para que el resto del JS
        // que lee .value siga funcionando como esperaba).
        input.value = String(n);
      }
    });
  }

  /**
   * Recorre la página y vincula todos los inputs numéricos
   * (type="number" o data-locale-number).
   */
  function autoAttach(root) {
    root = root || document;
    var nodes = root.querySelectorAll(
      'input[type="number"], input[data-locale-number]'
    );
    Array.prototype.forEach.call(nodes, function (i) {
      attachLocaleInput(i);
    });
  }

  // ── Init ────────────────────────────────────────────────────────
  function init() {
    autoAttach(document);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── API pública ────────────────────────────────────────────────
  global.parseLocaleNumber = parseLocaleNumber;
  global.attachLocaleInput = attachLocaleInput;
  global.LocaleInput = {
    parse: parseLocaleNumber,
    attach: attachLocaleInput,
    autoAttach: autoAttach,
    normalize: normalizeInput,
  };

  // Export CommonJS para tests Node (vitest + jsdom).
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      parseLocaleNumber: parseLocaleNumber,
      attachLocaleInput: attachLocaleInput,
      autoAttach: autoAttach,
      normalizeInput: normalizeInput,
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
