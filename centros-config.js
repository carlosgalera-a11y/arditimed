/* ══════════════════════════════════════════════════════════════════
   CENTROS-CONFIG.JS · Multi-tenancy Cartagenaeste (Fase 1)
   ══════════════════════════════════════════════════════════════════
   Gestiona el centro/tenant activo. Por defecto "area2-cartagena" (HGU
   Santa Lucía). Permite, a superadmins, cambiar a otro centro y leer
   la configuración (logo, colores, nombre) desde Firestore.

   API pública (window):
     window.Centros.getCurrentId()      → id del centro activo (string)
     window.Centros.setCurrentId(id)    → marca centro activo (localStorage)
     window.Centros.getCurrentConfig()  → Promise<{id,nombre,logo,color,...}>
     window.Centros.list()              → Promise<Array<{id,nombre,...}>>
     window.Centros.onChange(fn)        → suscribir a cambios de tenant

   Esta fase NO reescribe colecciones existentes: todos los datos sin
   centroId se consideran pertenecientes al centro por defecto. Los
   desarrollos futuros irán incorporando centroId progresivamente.
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var DEFAULT_ID = 'area2-cartagena';
  var LS_KEY = 'cart_centro_id_v1';
  var listeners = [];
  var cachedConfig = null;

  function currentId(){
    try{
      var v = localStorage.getItem(LS_KEY);
      return (v && /^[a-z0-9-]{1,40}$/i.test(v)) ? v : DEFAULT_ID;
    }catch(e){ return DEFAULT_ID; }
  }

  function setCurrentId(id){
    if(!id || !/^[a-z0-9-]{1,40}$/i.test(id)) return false;
    try{ localStorage.setItem(LS_KEY, id); }catch(e){}
    cachedConfig = null;
    listeners.forEach(function(fn){ try{ fn(id); }catch(e){} });
    return true;
  }

  function onChange(fn){ if(typeof fn === 'function') listeners.push(fn); }

  // Catálogo fallback mientras no hay Firestore disponible. Se
  // sincroniza con la colección 'centros' cuando esté cargada.
  var FALLBACK = {
    'area2-cartagena': {
      id: 'area2-cartagena',
      nombre: 'Área II Cartagena',
      hospital: 'H.G.U. Santa Lucía',
      ccaa: 'Región de Murcia · SMS',
      logo: '🏥',
      color: '#0f6b4a',
      colorDark: '#0a4d35',
      dominio: 'area2cartagena.es',
      telefonoUrgencias: '968128600',
      esDefault: true
    }
  };

  function getFromFirestore(id){
    try{
      if(typeof firebase === 'undefined' || !firebase.firestore) return Promise.resolve(null);
      return firebase.firestore().collection('centros').doc(id).get()
        .then(function(snap){ return snap.exists ? Object.assign({id:id}, snap.data()) : null; })
        .catch(function(){ return null; });
    }catch(e){ return Promise.resolve(null); }
  }

  function getCurrentConfig(){
    var id = currentId();
    if(cachedConfig && cachedConfig.id === id) return Promise.resolve(cachedConfig);
    return getFromFirestore(id).then(function(remote){
      cachedConfig = remote || FALLBACK[id] || FALLBACK[DEFAULT_ID];
      return cachedConfig;
    });
  }

  function list(){
    try{
      if(typeof firebase === 'undefined' || !firebase.firestore){
        return Promise.resolve(Object.values(FALLBACK));
      }
      return firebase.firestore().collection('centros').get()
        .then(function(snap){
          if(snap.empty) return Object.values(FALLBACK);
          var out = [];
          snap.forEach(function(d){ out.push(Object.assign({id:d.id}, d.data())); });
          return out;
        })
        .catch(function(){ return Object.values(FALLBACK); });
    }catch(e){ return Promise.resolve(Object.values(FALLBACK)); }
  }

  // Ayudante: inyecta un selector de centro en cualquier contenedor.
  // Solo útil para superadmins; el llamador decide si pintar o no.
  function renderSelector(container, opts){
    if(!container) return;
    opts = opts || {};
    list().then(function(centros){
      if(!centros.length) return;
      var active = currentId();
      var html = '<div style="display:flex;flex-direction:column;gap:6px">'
        + (opts.label !== false ? '<label style="font-size:.78rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;font-weight:700">🏥 Centro activo</label>' : '')
        + '<select id="cartCentroSel" style="padding:8px 12px;background:#1e293b;color:#fff;border:1px solid #334155;border-radius:8px;font-family:inherit;font-size:.9rem">'
        + centros.map(function(c){
            var sel = c.id === active ? ' selected' : '';
            return '<option value="'+c.id+'"'+sel+'>'+(c.nombre || c.id)+' ('+c.id+')</option>';
          }).join('')
        + '</select>'
        + '<div style="font-size:.74rem;color:#64748b">El cambio es local a este navegador. Recarga la página tras cambiar.</div>'
        + '</div>';
      container.innerHTML = html;
      var sel = document.getElementById('cartCentroSel');
      if(sel) sel.addEventListener('change', function(){
        if(setCurrentId(sel.value)){
          if(opts.reload !== false) location.reload();
        }
      });
    });
  }

  // ── stamp(): añade centroId a cualquier payload de escritura ──
  // Uso: db.collection('informes_ia').add(Centros.stamp({ titulo:'…', … }))
  // Retrocompatible: si alguien pasa undefined/null, devuelve {}.
  // Si ya hay centroId, no lo sobreescribe.
  function stamp(data){
    var d = Object.assign({}, data || {});
    if(!d.centroId) d.centroId = currentId();
    return d;
  }

  // ── where(): filtro de lectura por centro activo ──
  // Uso: Centros.where(db.collection('informes_ia')).get()
  // Si la colección no tiene todavía el campo centroId en todos los docs,
  // pasa {strict:false} y devuelve la query sin filtrar (modo gradual).
  function where(query, opts){
    opts = opts || {};
    if(opts.strict === false) return query;
    try{ return query.where('centroId', '==', currentId()); }
    catch(e){ return query; }
  }

  window.Centros = {
    getCurrentId: currentId,
    setCurrentId: setCurrentId,
    getCurrentConfig: getCurrentConfig,
    list: list,
    onChange: onChange,
    renderSelector: renderSelector,
    stamp: stamp,
    where: where,
    DEFAULT_ID: DEFAULT_ID,
    FALLBACK: FALLBACK
  };
})();
