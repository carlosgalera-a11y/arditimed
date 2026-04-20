// ══════════════════════════════════════════════════════════════════════
// api-config.js — DEPRECATED
// ══════════════════════════════════════════════════════════════════════
// El frontend ya no habla con proveedores IA directamente. Todas las
// llamadas pasan por la Cloud Function askAi (europe-west1), vía
// window.askAi() definido en ai-client.js.
//
// Este archivo se conserva como shim para no romper imports legacy.
// Eliminar completamente en PR #8 tras verificar que ningún HTML lo
// referencia ya (excepto por el <script src> que también se retira).
// ══════════════════════════════════════════════════════════════════════

var API_CONFIG = {
  // Legacy: fetchAI delega a window.askAi si está disponible.
  fetchAI: function(opts) {
    if (typeof window.askAi !== 'function') {
      return Promise.reject(new Error('Cliente IA no cargado (ai-client.js)'));
    }
    var msgs = (opts && opts.messages) || [];
    var sysMsg = '';
    var userMsg = '';
    for (var i = 0; i < msgs.length; i++) {
      if (msgs[i].role === 'system') sysMsg = msgs[i].content || '';
      else if (msgs[i].role === 'user') userMsg = msgs[i].content || '';
    }
    return window.askAi({ type: 'educational', prompt: userMsg, systemPrompt: sysMsg })
      .then(function (res) {
        // Shape OpenAI-compat para callers legacy:
        return { choices: [{ message: { content: res.text } }] };
      });
  },

  isLocalNetwork: function() { return false; },
  getEndpoint: function() { return ''; },
  getHeaders: function() { return { 'Content-Type': 'application/json' }; },
};
