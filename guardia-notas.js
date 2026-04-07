/* ═══════════════════════════════════════════════════════════════
   NOTAS DE GUARDIA — Área II Cartagena
   guardia-notas.js
   
   Tabla personal de pacientes por guardia.
   localStorage-first + Firestore sync opcional.
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  var FS_COLLECTION = 'guardia_pacientes';
  var LS_PREFIX = 'guardia_pac_';
  var guardiaPacientes = [];
  var guardiaListener = null;
  var currentUid = null;

  function lsKey() { return LS_PREFIX + (currentUid || 'anon'); }
  function lsSave() { try { localStorage.setItem(lsKey(), JSON.stringify(guardiaPacientes)); } catch(e) {} }
  function lsLoad() { try { return JSON.parse(localStorage.getItem(lsKey()) || '[]'); } catch(e) { return []; } }

  window.openGuardiaNotas = function() {
    var user = firebase.auth().currentUser;
    if (!user) { alert('Inicia sesión para acceder a tus notas de guardia'); return; }
    currentUid = user.uid;

    var modal = document.getElementById('guardiaModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'guardiaModal';
      modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.75);z-index:10000;display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;';
      modal.innerHTML = buildModalHTML();
      document.body.appendChild(modal);
      modal.addEventListener('click', function(e) { if (e.target === modal) closeGuardia(); });
    }

    modal.style.display = 'flex';
    document.getElementById('guardiaUserName').textContent = user.displayName || user.email;
    document.getElementById('guardiaUserEmail').textContent = user.email;
    document.getElementById('guardiaDate').textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    guardiaPacientes = lsLoad();
    renderGuardiaTable();
    tryFirestoreSync(user.uid);
  };

  function buildModalHTML() {
    var th = function(t) { return '<th style="padding:10px 8px;text-align:left;font-weight:700;color:#0d9488;border-bottom:2px solid #0d9488;font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;">'+t+'</th>'; };
    return '<div style="background:var(--bg-card,#fff);border-radius:16px;max-width:950px;width:100%;max-height:90vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.4);">' +
      '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:20px 24px;border-radius:16px 16px 0 0;color:#fff;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<div><h2 style="font-size:1.15rem;margin:0 0 2px;">📋 Notas de Guardia</h2><div id="guardiaUserName" style="font-size:.85rem;color:#94a3b8;"></div><div id="guardiaUserEmail" style="font-size:.72rem;color:#64748b;"></div></div>' +
          '<div style="text-align:right;"><div id="guardiaDate" style="font-size:.78rem;color:#94a3b8;"></div><div id="guardiaPacCount" style="font-size:.72rem;color:#64748b;margin-top:2px;"></div></div>' +
        '</div></div>' +
      '<div style="padding:12px 20px;background:var(--bg-subtle,#f8fafc);border-bottom:1px solid var(--border,#e2e8f0);display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
        '<button onclick="addGuardiaPaciente()" style="padding:8px 16px;background:#0d9488;color:#fff;border:none;border-radius:8px;font-weight:600;font-size:.82rem;cursor:pointer;">+ Añadir paciente</button>' +
        '<button onclick="exportGuardiaCSV()" style="padding:8px 16px;background:none;border:1px solid var(--border,#ddd);border-radius:8px;font-size:.82rem;cursor:pointer;color:var(--text,#333);">📥 Exportar CSV</button>' +
        '<button onclick="exportGuardiaPrint()" style="padding:8px 16px;background:none;border:1px solid var(--border,#ddd);border-radius:8px;font-size:.82rem;cursor:pointer;color:var(--text,#333);">🖨️ Imprimir</button>' +
        '<div style="flex:1;"></div>' +
        '<button onclick="closeGuardia()" style="padding:8px 16px;background:none;border:1px solid var(--border,#ddd);border-radius:8px;font-size:.82rem;cursor:pointer;color:var(--text-muted,#888);">✕ Cerrar</button>' +
      '</div>' +
      '<div style="padding:16px 20px;overflow-x:auto;" id="guardiaTableWrap">' +
        '<table id="guardiaTable" style="width:100%;border-collapse:collapse;font-size:.82rem;"><thead><tr style="background:var(--bg-subtle,#f0fdfa);">' +
          th('Paciente')+th('N.H.C.')+th('Motivo / Sospecha')+th('Diagnóstico')+th('Pruebas pend.')+th('Tratamiento')+th('Pendiente') +
          '<th style="padding:10px 4px;text-align:center;font-weight:700;color:#94a3b8;border-bottom:2px solid #0d9488;font-size:.75rem;width:40px;"></th>' +
        '</tr></thead><tbody id="guardiaBody"></tbody></table>' +
        '<div id="guardiaEmpty" style="text-align:center;padding:40px;color:var(--text-muted,#94a3b8);display:none;">' +
          '<div style="font-size:2.5rem;margin-bottom:8px;">📋</div><div style="font-weight:600;">Sin pacientes en esta guardia</div><div style="font-size:.78rem;margin-top:4px;">Pulsa "+ Añadir paciente" para empezar</div>' +
        '</div></div>' +
      '<div style="padding:12px 20px;border-top:1px solid var(--border,#e2e8f0);font-size:.7rem;color:var(--text-muted,#94a3b8);text-align:center;">Datos privados · Solo visible para ti · Área II Cartagena</div></div>';
  }

  function tryFirestoreSync(uid) {
    try {
      var db = firebase.firestore();
      if (guardiaListener) guardiaListener();
      guardiaListener = db.collection('users').doc(uid).collection(FS_COLLECTION)
        .orderBy('created', 'desc')
        .onSnapshot(function(snap) {
          guardiaPacientes = [];
          snap.forEach(function(doc) { var d = doc.data(); d._id = doc.id; d._source = 'firestore'; guardiaPacientes.push(d); });
          lsSave();
          renderGuardiaTable();
        }, function(err) {
          console.warn('[Guardia] Firestore no disponible, usando localStorage:', err.code || err.message);
        });
    } catch(e) { console.warn('[Guardia] Firestore init error:', e); }
  }

  function renderGuardiaTable() {
    var body = document.getElementById('guardiaBody');
    var empty = document.getElementById('guardiaEmpty');
    var count = document.getElementById('guardiaPacCount');
    if (!body) return;
    if (count) count.textContent = guardiaPacientes.length + ' paciente' + (guardiaPacientes.length !== 1 ? 's' : '');
    if (guardiaPacientes.length === 0) { body.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    body.innerHTML = guardiaPacientes.map(function(p, i) {
      return '<tr style="border-bottom:1px solid var(--border,#e2e8f0);">' +
        cell(p.nombre,'nombre',i,true)+cell(p.nhc,'nhc',i)+cell(p.motivo,'motivo',i)+cell(p.diagnostico,'diagnostico',i)+cell(p.pruebas,'pruebas',i)+cell(p.tratamiento,'tratamiento',i)+cell(p.pendiente,'pendiente',i) +
        '<td style="padding:6px 4px;text-align:center;"><button onclick="deleteGuardiaPac('+i+')" style="background:none;border:none;cursor:pointer;font-size:1rem;opacity:.4;" title="Eliminar">🗑️</button></td></tr>';
    }).join('');
  }

  function cell(val, field, idx, bold) {
    var s = 'padding:8px;cursor:text;min-width:80px;' + (bold ? 'font-weight:700;' : '');
    return '<td contenteditable="true" style="'+s+'" data-field="'+field+'" data-idx="'+idx+'" onfocus="this.style.background=\'#f0fdfa\'" onblur="this.style.background=\'\';updateGuardiaCell(this);">'+(val||'')+'</td>';
  }

  // ─── ADD (localStorage-first, Firestore optional) ───
  window.addGuardiaPaciente = function() {
    var user = firebase.auth().currentUser;
    if (!user) { alert('Inicia sesión primero'); return; }
    var newPac = { _id:'local_'+Date.now(), nombre:'', nhc:'', motivo:'', diagnostico:'', pruebas:'', tratamiento:'', pendiente:'', created:new Date().toISOString(), uid:user.uid };
    guardiaPacientes.unshift(newPac);
    lsSave();
    renderGuardiaTable();
    setTimeout(function() { var c = document.querySelector('#guardiaBody tr:first-child td[contenteditable]'); if(c) c.focus(); }, 100);
    // Firestore (non-blocking)
    try {
      firebase.firestore().collection('users').doc(user.uid).collection(FS_COLLECTION)
        .add({ nombre:'',nhc:'',motivo:'',diagnostico:'',pruebas:'',tratamiento:'',pendiente:'', created:firebase.firestore.FieldValue.serverTimestamp(), uid:user.uid })
        .then(function(ref) { newPac._id = ref.id; newPac._source = 'firestore'; lsSave(); })
        .catch(function(e) { console.warn('[Guardia] Firestore add failed (saved locally):', e.code||e.message); });
    } catch(e) {}
  };

  // ─── UPDATE CELL ───
  window.updateGuardiaCell = function(td) {
    var idx = parseInt(td.dataset.idx), field = td.dataset.field, val = td.textContent.trim();
    var pac = guardiaPacientes[idx];
    if (!pac || pac[field] === val) return;
    pac[field] = val;
    lsSave();
    var user = firebase.auth().currentUser;
    if (!user || !pac._id || pac._id.startsWith('local_')) return;
    try { var u={}; u[field]=val; u.updated=firebase.firestore.FieldValue.serverTimestamp(); firebase.firestore().collection('users').doc(user.uid).collection(FS_COLLECTION).doc(pac._id).update(u).catch(function(){}); } catch(e){}
  };

  // ─── DELETE ───
  window.deleteGuardiaPac = function(idx) {
    var pac = guardiaPacientes[idx]; if (!pac) return;
    if (!confirm('¿Eliminar a ' + (pac.nombre||'este paciente') + ' de la guardia?')) return;
    guardiaPacientes.splice(idx, 1); lsSave(); renderGuardiaTable();
    var user = firebase.auth().currentUser;
    if (!user || !pac._id || pac._id.startsWith('local_')) return;
    try { firebase.firestore().collection('users').doc(user.uid).collection(FS_COLLECTION).doc(pac._id).delete().catch(function(){}); } catch(e){}
  };

  // ─── EXPORT CSV ───
  window.exportGuardiaCSV = function() {
    if (!guardiaPacientes.length) { alert('No hay pacientes para exportar'); return; }
    var h = ['Paciente','NHC','Motivo','Diagnóstico','Pruebas pendientes','Tratamiento','Pendiente'];
    var rows = guardiaPacientes.map(function(p) {
      return [p.nombre,p.nhc,p.motivo,p.diagnostico,p.pruebas,p.tratamiento,p.pendiente].map(function(v){return '"'+(v||'').replace(/"/g,'""')+'"';}).join(',');
    });
    var blob = new Blob(['\uFEFF'+h.join(',')+'\n'+rows.join('\n')],{type:'text/csv;charset=utf-8;'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='guardia_'+new Date().toISOString().slice(0,10)+'.csv'; a.click();
  };

  // ─── PRINT ───
  window.exportGuardiaPrint = function() {
    var user = firebase.auth().currentUser;
    var fecha = new Date().toLocaleDateString('es-ES',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    var trs = guardiaPacientes.map(function(p){return '<tr><td style="font-weight:700">'+(p.nombre||'')+'</td><td>'+(p.nhc||'')+'</td><td>'+(p.motivo||'')+'</td><td>'+(p.diagnostico||'')+'</td><td>'+(p.pruebas||'')+'</td><td>'+(p.tratamiento||'')+'</td><td>'+(p.pendiente||'')+'</td></tr>';}).join('');
    var w=window.open('','_blank');
    w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Guardia</title><style>body{font-family:-apple-system,system-ui,sans-serif;padding:20px;color:#1e293b}h1{font-size:1.2rem;margin:0 0 4px}.meta{font-size:.8rem;color:#64748b;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:.8rem}th{background:#f0fdfa;color:#0d9488;padding:8px;text-align:left;border-bottom:2px solid #0d9488;font-size:.72rem;text-transform:uppercase}td{padding:6px 8px;border-bottom:1px solid #e2e8f0}</style></head><body>');
    w.document.write('<h1>📋 Notas de Guardia</h1><div class="meta">'+(user?user.displayName||user.email:'')+' · '+fecha+'</div>');
    w.document.write('<table><thead><tr><th>Paciente</th><th>NHC</th><th>Motivo</th><th>Diagnóstico</th><th>Pruebas</th><th>Tratamiento</th><th>Pendiente</th></tr></thead><tbody>'+trs+'</tbody></table>');
    w.document.write('<div style="margin-top:20px;font-size:.7rem;color:#94a3b8;text-align:center;">Área II Cartagena · '+new Date().toLocaleString('es-ES')+'</div></body></html>');
    w.document.close(); w.print();
  };

  window.closeGuardia = function() {
    var modal = document.getElementById('guardiaModal');
    if (modal) modal.style.display = 'none';
    if (guardiaListener) { guardiaListener(); guardiaListener = null; }
  };
})();
