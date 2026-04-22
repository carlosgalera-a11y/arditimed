// ══════════════════════════════════════════════════════════════════════
// visados-ai.js · Consulta IA sobre la Guía de Visado para médicos
// prescriptores (SMS · documento 457-2023).
//
// Flujo:
// 1. Lazy-load de /docs/guia-visado-prescriptores-457-2023.txt.
// 2. Chunking por página + corte en frases (~400 chars).
// 3. Retrieval por bag-of-words normalizado (Spanish-aware).
// 4. Envío a Cloud Function askAi (type=educational → DeepSeek V3).
// ══════════════════════════════════════════════════════════════════════
(function(global){
  'use strict';

  var TXT_URL = 'docs/guia-visado-prescriptores-457-2023.txt';
  var PDF_URL = 'docs/guia-visado-prescriptores-457-2023.pdf';
  var CHUNK_MAX = 480;   // chars ≈ ~120 tokens por chunk
  var TOP_K     = 8;

  var _chunks = null;
  var _loading = null;

  // Spanish normalize: minus + sin tildes.
  function norm(s){
    return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  }

  // Tokens ≥3 letras tras normalizar.
  function tokens(s){
    var out = norm(s).match(/[a-z0-9]{3,}/g);
    return out || [];
  }

  function splitByPage(raw){
    // El extract mete "[pN] " al comienzo de cada página. Devolvemos pares {page, text}.
    var parts = [];
    var re = /\[p(\d+)\]\s+([\s\S]*?)(?=\[p\d+\]|$)/g;
    var m;
    while((m = re.exec(raw)) !== null){
      parts.push({ page: parseInt(m[1],10), text: m[2].trim() });
    }
    if(parts.length === 0) parts.push({ page: 1, text: raw });
    return parts;
  }

  function chunkByPage(pages){
    // Partimos cada página en trozos de ≤CHUNK_MAX respetando frases.
    var chunks = [];
    pages.forEach(function(p){
      var t = p.text.replace(/\s+/g,' ').trim();
      if(!t) return;
      if(t.length <= CHUNK_MAX){
        chunks.push({ page:p.page, text:t });
        return;
      }
      // Cortes por frase aproximados.
      var sentences = t.split(/(?<=[\.\;\!\?])\s+/);
      var cur = '';
      sentences.forEach(function(s){
        if((cur.length + s.length + 1) <= CHUNK_MAX){
          cur = cur ? cur + ' ' + s : s;
        } else {
          if(cur) chunks.push({ page:p.page, text:cur });
          cur = s;
        }
      });
      if(cur) chunks.push({ page:p.page, text:cur });
    });
    return chunks;
  }

  function load(){
    if(_chunks) return Promise.resolve(_chunks);
    if(_loading) return _loading;
    _loading = fetch(TXT_URL, { cache:'no-cache' })
      .then(function(r){
        if(!r.ok) throw new Error('HTTP '+r.status);
        return r.text();
      })
      .then(function(raw){
        _chunks = chunkByPage(splitByPage(raw));
        return _chunks;
      });
    return _loading;
  }

  // Bag-of-words + puntuación por coincidencias + boost por longitud del match.
  function retrieve(q, k){
    k = k || TOP_K;
    if(!_chunks) return [];
    var qTokens = tokens(q);
    if(qTokens.length === 0) return _chunks.slice(0, k);
    var scored = _chunks.map(function(c, i){
      var normText = norm(c.text);
      var score = 0;
      for(var j=0;j<qTokens.length;j++){
        var t = qTokens[j];
        // +1 por aparición + 0.5 por cada repetición hasta 4.
        var count = 0, pos = 0;
        while((pos = normText.indexOf(t, pos)) !== -1){ count++; pos += t.length; if(count>4) break; }
        if(count > 0) score += 1 + Math.min(count-1, 3) * 0.5;
      }
      return { i:i, score:score, chunk:c };
    });
    scored.sort(function(a,b){ return b.score - a.score || a.i - b.i; });
    return scored.filter(function(x){ return x.score > 0; }).slice(0, k).map(function(x){ return x.chunk; });
  }

  function buildContext(chunks){
    return chunks.map(function(c){ return '[pág '+c.page+'] '+c.text; }).join('\n\n');
  }

  var SYS_PROMPT =
    'Eres un asistente docente del Área II Cartagena que responde dudas sobre visados de medicación '+
    'basándote ÚNICAMENTE en la Guía de Visado para médicos prescriptores (Servicio Murciano de Salud, '+
    'documento 457-2023) cuyos extractos se proporcionan. Normas:\n'+
    '1) Si la respuesta no está en los extractos, dilo claramente: "No localizo eso en la guía, '+
    'consulta con Inspección o la guía completa".\n'+
    '2) Cita siempre la página entre paréntesis: "(pág 12)".\n'+
    '3) Respuestas claras, con viñetas cuando proceda. Máx 180 palabras.\n'+
    '4) No inventes dosis, indicaciones ni requisitos que no aparezcan en los extractos.\n'+
    '5) Contexto: atención primaria y urgencias hospitalarias del Área II Cartagena.';

  function ask(question){
    if(typeof global.askAi !== 'function'){
      return Promise.reject(new Error('Cliente IA no disponible (ai-client.js no cargado).'));
    }
    return load().then(function(){
      var chunks = retrieve(question, TOP_K);
      var ctx;
      if(chunks.length === 0){
        // Sin match: enviar los primeros chunks (índice) para que la IA diga si lo cubre.
        ctx = buildContext(_chunks.slice(0, TOP_K));
      } else {
        ctx = buildContext(chunks);
      }
      // Presupuesto: prompt ≤ 8000 chars (validación Cloud Function).
      var MAX_CTX = 6800;
      if(ctx.length > MAX_CTX) ctx = ctx.substring(0, MAX_CTX) + '\n[…truncado]';

      var prompt =
        'Extractos relevantes de la Guía de Visado (SMS 457-2023):\n'+
        '---\n'+ ctx +'\n---\n\n'+
        'PREGUNTA DEL PROFESIONAL: '+ question;

      return global.askAi({
        type: 'educational',
        systemPrompt: SYS_PROMPT,
        prompt: prompt
      });
    });
  }

  // API pública.
  global.visados = {
    load: load,
    retrieve: retrieve,
    ask: ask,
    buildContext: buildContext,
    // Para MegaCuaderno: devuelve contexto listo para inyectar si procede.
    getContextFor: function(q, k){
      if(!_chunks) return Promise.resolve('');
      var cs = retrieve(q, k||4);
      if(cs.length === 0) return Promise.resolve('');
      return Promise.resolve(buildContext(cs));
    },
    pdfUrl: PDF_URL
  };

})(typeof window !== 'undefined' ? window : globalThis);
