/* ══════════════════════════════════════════════════════════════════
   SCAN-PII-GUARD.JS · Detección OCR de PII antes de envío a IA
   ══════════════════════════════════════════════════════════════════
   Ejecuta Tesseract.js (vía CDN) en el navegador sobre la imagen
   que el usuario ha subido al Scan IA, aplica regex sobre el texto
   reconocido y bloquea el envío si detecta:
     · DNI español (8 dígitos + letra)
     · NIE (X/Y/Z + 7 dígitos + letra)
     · NHC / HCN / números largos precedidos de "historia"
     · patrones "Apellido, Nombre" o "Nombre Apellido Apellido"
     · "NombrePaciente: X", "Paciente: X"
   Y AVISA (sin bloquear) de:
     · fechas de nacimiento DD/MM/YYYY
     · teléfonos 9 dígitos

   Cumple mitigación R-03 del risk register (exposición accidental
   de datos identificativos) · requisito EU AI Act art. 10 calidad
   de datos + art. 14 supervisión humana.

   API:
     window.ScanPiiGuard.checkImage(dataUrl, opts) → Promise<{
       ok: boolean,       // true si se puede enviar
       detected: [...],   // hallazgos bloqueantes
       warnings: [...],   // hallazgos de aviso
       ocrText: string,   // texto reconocido (debug, se descarta tras)
       elapsedMs: number
     }>
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js';
  var _loadPromise = null;

  function loadTesseract(){
    if(window.Tesseract) return Promise.resolve(window.Tesseract);
    if(_loadPromise) return _loadPromise;
    _loadPromise = new Promise(function(resolve, reject){
      var s = document.createElement('script');
      s.src = TESSERACT_CDN;
      s.onload = function(){ window.Tesseract ? resolve(window.Tesseract) : reject(new Error('Tesseract no expuesto')); };
      s.onerror = function(){ reject(new Error('No se pudo cargar Tesseract.js')); };
      document.head.appendChild(s);
    });
    return _loadPromise;
  }

  // Detectores. Cada uno devuelve { kind, matches:[...], block:bool }
  function detectDni(txt){
    var m = txt.match(/\b[0-9]{8}[A-HJ-NP-TV-Z]\b/g) || [];
    return { kind: 'DNI', matches: m, block: m.length > 0 };
  }
  function detectNie(txt){
    var m = txt.match(/\b[XYZ][0-9]{7}[A-HJ-NP-TV-Z]\b/g) || [];
    return { kind: 'NIE', matches: m, block: m.length > 0 };
  }
  function detectNhc(txt){
    var m = [];
    var pat1 = /(NHC|HCN|HC|Historia\s*Cl[ií]nica)[\s:#]*[0-9]{6,}/gi;
    var f;
    while((f = pat1.exec(txt))) m.push(f[0].substring(0, 30));
    var pat2 = /\bN[º°o]?\s*HC\s*[:#]?\s*[0-9]{6,}/gi;
    while((f = pat2.exec(txt))) m.push(f[0].substring(0, 30));
    return { kind: 'NHC', matches: m, block: m.length > 0 };
  }
  function detectPatientLabel(txt){
    // "Paciente: Algo" / "Nombre: Algo" / "Apellidos: Algo"
    var m = [];
    var pat = /\b(Paciente|Nombre\s*Paciente|Apellidos?|Nombre\s*y\s*Apellidos)\s*[:#]\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})/g;
    var f;
    while((f = pat.exec(txt))) m.push(f[0].substring(0, 60));
    return { kind: 'Etiqueta paciente', matches: m, block: m.length > 0 };
  }
  function detectFullName(txt){
    // 3 palabras seguidas con inicial mayúscula (Nombre Apellido Apellido)
    // Excluimos casos comunes del entorno clínico.
    var exclude = /(Servicio\s+Mu|Área\s+II|Hospital\s+General|Cartagena\s+Este|Santa\s+Luc|Rafael\s+Méndez|Carlos\s+Galera)/i;
    var m = [];
    var pat = /\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}\b/g;
    var f;
    while((f = pat.exec(txt))){
      if(!exclude.test(f[0])) m.push(f[0]);
    }
    // Si encontramos > 1 patrón de nombre completo, bloquear.
    return { kind: 'Posible nombre completo', matches: m, block: m.length > 0 };
  }
  function detectBirthDate(txt){
    var m = txt.match(/\b(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-](19|20)\d{2}\b/g) || [];
    return { kind: 'Fecha nacimiento', matches: m, block: false }; // solo warn
  }
  function detectPhone(txt){
    var m = txt.match(/\b[6-9][0-9]{8}\b/g) || [];
    return { kind: 'Teléfono 9d', matches: m, block: false };
  }

  var BLOCKING = [detectDni, detectNie, detectNhc, detectPatientLabel, detectFullName];
  var WARNING = [detectBirthDate, detectPhone];

  async function runOcr(dataUrl){
    var T = await loadTesseract();
    // Tesseract 5 API: Tesseract.recognize(image, 'spa', {logger: ...}).
    var ret = await T.recognize(dataUrl, 'spa', { logger: function(){} });
    return (ret && ret.data && ret.data.text) || '';
  }

  async function checkImage(dataUrl, opts){
    opts = opts || {};
    var start = Date.now();
    var text = '';
    try{
      text = await runOcr(dataUrl);
    }catch(e){
      // Si Tesseract falla, NO bloqueamos (fail-open con aviso).
      return {
        ok: true,
        detected: [],
        warnings: [{ kind: 'OCR indisponible', matches: [e.message || 'error'] }],
        ocrText: '',
        elapsedMs: Date.now() - start,
        ocrFailed: true
      };
    }
    var detected = [];
    BLOCKING.forEach(function(fn){
      var r = fn(text);
      if(r.matches.length) detected.push(r);
    });
    var warnings = [];
    WARNING.forEach(function(fn){
      var r = fn(text);
      if(r.matches.length) warnings.push(r);
    });
    var block = detected.some(function(d){ return d.block; });
    return {
      ok: !block,
      detected: detected,
      warnings: warnings,
      ocrText: opts.debug ? text : '',
      elapsedMs: Date.now() - start
    };
  }

  window.ScanPiiGuard = {
    checkImage: checkImage,
    loadTesseract: loadTesseract
  };
})();
