/* ══════════════════════════════════════════════════════════════════
   ANALYTICS-CONFIG.JS · Telemetría centralizada Cartagenaeste
   ══════════════════════════════════════════════════════════════════
   ÚNICO PUNTO DE CONFIGURACIÓN DE GA4.

   → Para activar en producción con tu ID real:
     1. Sustituye GA_ID abajo por tu Measurement ID (G-XXXXXXXXXX).
     2. Incluye <script src="analytics-config.js"></script> en cada
        página en la que quieras medir.

   Expone window.cartTrack(event, params) con anonimización básica
   (rol de usuario, centroId, sin contenido de prompts/pacientes).

   Eventos clínicos instrumentados (ver sección inferior):
     seccion_abierta · informe_ia_generado · triaje_completado
     calculadora_usada · busqueda_farmaco · protocolo_consultado
     sesion_clinica_abierta · ficha_consulta_abierta · recurso_llamada
     prescripcion_social_generada · scan_imagen_analizada
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  // ───── CONFIG ───── Cambia GA_ID por tu Measurement ID real.
  // Formato: "G-XXXXXXXXXX". Si se queda en el placeholder, la
  // librería simplemente no carga (modo no-op, seguro en prod).
  var GA_ID = 'G-JW29V64END';

  var isValid = /^G-[A-Z0-9]{6,}$/.test(GA_ID);

  // Modo no-op: si no hay ID válido, expone cartTrack pero no envía.
  if(!isValid){
    window.cartTrack = function(ev, params){
      try{ if(window._cartTraceLog) console.debug('[cartTrack:noop]', ev, params); }catch(e){}
    };
    window.cartAnalyticsConfigured = false;
    return;
  }

  // Cargar gtag.js si aún no está cargado
  if(!window.__cartGaLoaded){
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.__cartGaLoaded = true;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', GA_ID, {
    page_title: document.title || 'Cartagenaeste',
    cookie_flags: 'SameSite=None;Secure',
    anonymize_ip: true
  });
  window.cartAnalyticsConfigured = true;

  // ───── Enriquecimiento automático de eventos ─────
  // Añade rol de usuario (detectado del email) y centroId activo.
  function enrich(params){
    var p = Object.assign({}, params || {});
    try{
      if(!p.centro_id && window.Centros && window.Centros.getCurrentId){
        p.centro_id = window.Centros.getCurrentId();
      }
    }catch(e){}
    try{
      if(!p.rol && typeof firebase !== 'undefined' && firebase.auth){
        var u = firebase.auth().currentUser;
        if(u){
          var email = (u.email || '').toLowerCase();
          // Rol anonimizado (nunca el email literal)
          p.rol = email.indexOf('gmail.com') >= 0 ? 'autenticado' : 'institucional';
        } else {
          p.rol = 'anon';
        }
      }
    }catch(e){}
    return p;
  }

  // ───── Inferencia de especialidad desde nombre de sección ─────
  // Permite filtrar en dashboard por área clínica sin tocar cada call site.
  var ESP_MAP = {
    cardio: /cardio|ecg|arritmi|fibrilaci|infarto|hipertensi|presi[oó]n|insuficiencia card|valvul/i,
    respiratorio: /respirator|torax|pulmon|asma|epoc|neumon|broncoespasmo|tos cr[oó]nica|gold|gema/i,
    neuro: /neurolog|ictus|cefalea|epilep|crisis convuls|tce|parkinson|demenc/i,
    digestivo: /digestiv|abdomen|gastro|hepat|pancre|colon|di[aá]rrea|vomit|hemorragia digest/i,
    endocrino: /endocrin|diabet|tiroid|hipoglu|obesid|suprarren/i,
    nefro: /nefro|ri[nñ][oó]|renal|hematuria|proteinuria|insuficiencia renal/i,
    infeccioso: /infeccio|sepsis|fiebre|antibi[oó]tic|proa|covid|tuberculos|gripe|itu/i,
    dermatolog: /derma|piel|lesi[oó]n cut|acne|quemadura|melanoma/i,
    psiquiatr: /psiqui|depresi|ansied|suicid|psicosis/i,
    pediatr: /pedia|ni[nñ]o|lactante|infant|vacuna|reci[eé]n nacido/i,
    ginec: /ginec|obstet|embarazo|parto|aborto|anticoncepci|menstrua/i,
    traumat: /traumat|fractura|luxaci|esguince|mur a|rx [oó]sea|art(r[oó]|ros)/i,
    urg: /urgencias?|triaje|shock|rcp|acls|atls/i,
    docencia: /docencia|sesi[oó]n cl[ií]nica|caso cl[ií]nico|mir|residente|formacion|vademe/i
  };
  function inferEspecialidad(text){
    try{
      var s = String(text||'').toLowerCase();
      for(var k in ESP_MAP){ if(ESP_MAP[k].test(s)) return k; }
    }catch(e){}
    return 'general';
  }
  window.inferEspecialidad = inferEspecialidad;

  // ───── API pública cartTrack ─────
  window.cartTrack = function(ev, params){
    if(!ev) return;
    try{ gtag('event', ev, enrich(params)); }catch(e){}
    try{ if(window._cartTraceLog) console.debug('[cartTrack]', ev, params); }catch(e){}
  };

  // Helpers específicos (ergonomía + parámetros consistentes)
  window.cartEvents = {
    seccionAbierta: function(nombre, especialidad){
      window.cartTrack('seccion_abierta', {
        nombre_seccion: String(nombre||'').substring(0,40),
        especialidad: String(especialidad||inferEspecialidad(nombre)||'general').substring(0,30)
      });
    },
    informeIaGenerado: function(tipo, modelo, latenciaMs, ok){
      window.cartTrack('informe_ia_generado', {
        tipo_informe: String(tipo||''),
        modelo_usado: String(modelo||'').substring(0,60),
        tiempo_respuesta_ms: Number(latenciaMs)|0,
        ok: ok !== false
      });
    },
    triajeCompletado: function(gravedad){
      window.cartTrack('triaje_completado', { gravedad_sugerida: String(gravedad||'').substring(0,20) });
    },
    calculadoraUsada: function(nombre, especialidad){
      window.cartTrack('calculadora_usada', {
        nombre_calculadora: String(nombre||'').substring(0,40),
        especialidad: String(especialidad||'').substring(0,30)
      });
    },
    busquedaFarmaco: function(query, ok){
      // Nunca logueamos la query literal (puede llevar datos clínicos):
      // solo un hash corto para medir demanda y huecos.
      var hash = 0, s = String(query||'');
      for(var i=0;i<s.length;i++){ hash = (hash*31 + s.charCodeAt(i))|0; }
      window.cartTrack('busqueda_farmaco', { query_hash: (hash>>>0).toString(16), resultado_ok: ok !== false });
    },
    protocoloConsultado: function(id, duracionS){
      window.cartTrack('protocolo_consultado', {
        id_protocolo: String(id||'').substring(0,40),
        duracion_visualizacion_s: Number(duracionS)|0
      });
    },
    sesionClinicaAbierta: function(id, duracionS){
      window.cartTrack('sesion_clinica_abierta', {
        id_sesion: String(id||'').substring(0,40),
        duracion_s: Number(duracionS)|0
      });
    },
    fichaConsultaAbierta: function(id){
      window.cartTrack('ficha_consulta_abierta', { id_ficha: String(id||'').substring(0,40) });
    },
    recursoLlamada: function(recurso){
      window.cartTrack('recurso_llamada', { recurso_id: String(recurso||'').substring(0,40) });
    },
    prescripcionSocialGenerada: function(recurso, categoria){
      window.cartTrack('prescripcion_social_generada', {
        recurso_id: String(recurso||'').substring(0,40),
        categoria: String(categoria||'').substring(0,30)
      });
    },
    scanImagenAnalizada: function(tipo, modelo, ok){
      window.cartTrack('scan_imagen_analizada', {
        tipo_scan: String(tipo||''),
        modelo_usado: String(modelo||'').substring(0,60),
        ok: ok !== false
      });
    }
  };

  // Compatibilidad retro con window.gaTrack (ya usado en panel-medico)
  if(!window.gaTrack) window.gaTrack = window.cartTrack;
})();
