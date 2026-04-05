// ══════════════════════════════════════════════════════════════════════
// api-config.js — Configuración centralizada de APIs
// ⚠️ NO poner API keys aquí. Las keys van en el proxy del NAS.
// Este archivo solo define endpoints y lógica de enrutamiento.
// ══════════════════════════════════════════════════════════════════════

var API_CONFIG = {
  // NAS proxy (UGREEN DXP2800) — rutas todas las peticiones IA por aquí
  nasProxy: {
    base: 'http://REDACTED_INTERNAL_IP:3100',
    deepseek: '/api/deepseek',
    openrouter: '/api/openrouter',
    anthropic: '/api/anthropic',
    vision: '/api/vision'
  },

  // Fallback público (modelos gratuitos, sin key)
  publicFallback: {
    pollinations: 'https://text.pollinations.ai/openai',
    openrouterFree: 'https://openrouter.ai/api/v1/chat/completions'
  },

  // Modelos por prioridad
  models: {
    chat: [
      'deepseek/deepseek-chat-v3-0324:free',
      'google/gemma-3-27b-it:free',
      'meta-llama/llama-3.3-8b-instruct:free'
    ],
    vision: [
      'qwen/qwen2.5-vl-72b-instruct:free',
      'google/gemma-3-27b-it:free'
    ]
  },

  // ¿Estamos en la red local del hospital?
  isLocalNetwork: function() {
    try {
      // Detectar red local por hostname o IP
      var h = window.location.hostname;
      return h === 'localhost' || h === '127.0.0.1' || 
             h.startsWith('192.168.') || h.startsWith('10.') ||
             h.endsWith('.local');
    } catch(e) { return false; }
  },

  // Obtener endpoint correcto según contexto
  getEndpoint: function(service) {
    if (this.isLocalNetwork()) {
      return this.nasProxy.base + (this.nasProxy[service] || '/api/' + service);
    }
    // Fuera de red local → modelos gratuitos sin key
    return this.publicFallback.openrouterFree;
  },

  // Headers para petición (key solo si va por proxy)
  getHeaders: function(service) {
    var headers = { 'Content-Type': 'application/json' };
    if (this.isLocalNetwork()) {
      // El proxy del NAS inyecta las keys automáticamente
      headers['X-Proxy-Service'] = service || 'openrouter';
    }
    // Fuera de red local: sin Authorization header (modelos :free no lo necesitan)
    return headers;
  },

  // Helper para hacer peticiones IA
  fetchAI: function(opts) {
    var service = opts.service || 'openrouter';
    var url = this.getEndpoint(service);
    var headers = this.getHeaders(service);
    var body = {
      model: opts.model || this.models.chat[0],
      messages: opts.messages || [],
      max_tokens: opts.maxTokens || 1200,
      temperature: opts.temperature || 0.3
    };

    return fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    }).then(function(r) {
      if (!r.ok) throw new Error('API ' + r.status);
      return r.json();
    });
  }
};

// ══════════════════════════════════════════════════════════════════════
// MIGRACIÓN: Funciones legacy para compatibilidad
// Las funciones _dk(), _KP etc. se mantienen temporalmente.
// Objetivo: migrar todas las llamadas a API_CONFIG.fetchAI()
// ══════════════════════════════════════════════════════════════════════
console.log('[API Config] Loaded. Local network:', API_CONFIG.isLocalNetwork());
