/* ═══════════════════════════════════════════════════════════════
   AREA II CARTAGENA — SUPABASE INTEGRATION MODULE
   supabase-plantillas.js
   
   Conecta las Plantillas de Pacientes con Supabase para:
   - Login con Email/Contraseña o Google
   - Datos privados por usuario (RLS)
   - Sincronización en tiempo real entre dispositivos
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ─── CONFIG ───
  var SUPABASE_URL = 'https://ztigttazrdzkpxrzyast.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_-4fdzwv8Kv62RW9LUTaMEw_3uxZJ1-l';
  var TABLE = 'plantillas_pacientes';

  // ─── STATE ───
  var sbClient = null;
  var sbUser = null;
  var sbReady = false;
  var sbSyncing = false;

  // ─── INIT SUPABASE CLIENT ───
  function sbInit() {
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.warn('[Supabase] SDK not loaded yet');
      return false;
    }
    sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Listen for auth changes
    sbClient.auth.onAuthStateChange(function(event, session) {
      sbUser = session ? session.user : null;
      sbReady = !!sbUser;
      sbUpdateAuthUI();
      if (sbUser) {
        sbLoadPacientes();
      }
    });

    // Check existing session
    sbClient.auth.getSession().then(function(result) {
      var session = result.data.session;
      sbUser = session ? session.user : null;
      sbReady = !!sbUser;
      sbUpdateAuthUI();
      if (sbUser) {
        sbLoadPacientes();
      }
    });

    return true;
  }

  // ─── AUTH UI ───
  function sbUpdateAuthUI() {
    var authPanel = document.getElementById('sbAuthPanel');
    var dataPanel = document.getElementById('sbDataPanel');
    var userInfo = document.getElementById('sbUserInfo');

    if (!authPanel || !dataPanel) return;

    if (sbUser) {
      authPanel.style.display = 'none';
      dataPanel.style.display = 'block';
      if (userInfo) {
        userInfo.textContent = sbUser.email || 'Usuario autenticado';
      }
    } else {
      authPanel.style.display = 'block';
      dataPanel.style.display = 'none';
    }
  }

  // ─── AUTH: EMAIL/PASSWORD ───
  window.sbSignUp = async function() {
    var email = document.getElementById('sbEmail').value.trim();
    var pass = document.getElementById('sbPass').value;
    if (!email || !pass) { alert('Introduce email y contraseña'); return; }
    if (pass.length < 6) { alert('La contraseña debe tener al menos 6 caracteres'); return; }

    var btn = document.getElementById('sbSignUpBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Registrando...'; }

    var result = await sbClient.auth.signUp({ email: email, password: pass });
    
    if (btn) { btn.disabled = false; btn.textContent = 'Registrarse'; }

    if (result.error) {
      alert('Error: ' + result.error.message);
    } else if (result.data.user && !result.data.session) {
      alert('Revisa tu email para confirmar la cuenta.');
    }
  };

  window.sbSignIn = async function() {
    var email = document.getElementById('sbEmail').value.trim();
    var pass = document.getElementById('sbPass').value;
    if (!email || !pass) { alert('Introduce email y contraseña'); return; }

    var btn = document.getElementById('sbSignInBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Entrando...'; }

    var result = await sbClient.auth.signInWithPassword({ email: email, password: pass });

    if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }

    if (result.error) {
      alert('Error: ' + result.error.message);
    }
  };

  // ─── AUTH: GOOGLE ───
  window.sbSignInGoogle = async function() {
    var result = await sbClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    });
    if (result.error) {
      alert('Error Google: ' + result.error.message);
    }
  };

  // ─── LOGOUT ───
  window.sbSignOut = async function() {
    await sbClient.auth.signOut();
    sbUser = null;
    sbReady = false;
    sbUpdateAuthUI();
    // Clear table
    var tbody = document.getElementById('tablaPacientes');
    if (tbody) tbody.innerHTML = '';
    if (typeof ptUpdateCounts === 'function') ptUpdateCounts();
  };

  // ─── LOAD PACIENTES FROM SUPABASE ───
  async function sbLoadPacientes() {
    if (!sbClient || !sbUser) return;
    sbSyncing = true;
    sbShowStatus('Cargando pacientes...');

    var result = await sbClient
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: true });

    sbSyncing = false;

    if (result.error) {
      sbShowStatus('Error: ' + result.error.message);
      return;
    }

    var rows = result.data || [];
    var tbody = document.getElementById('tablaPacientes');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (rows.length === 0) {
      // Add 3 empty rows
      sbAddPaciente();
      sbAddPaciente();
      sbAddPaciente();
    } else {
      rows.forEach(function(row) {
        sbRenderRow(row);
      });
    }

    sbShowStatus(rows.length + ' pacientes cargados');
    setTimeout(function() { sbShowStatus(''); }, 2000);
    if (typeof ptUpdateCounts === 'function') ptUpdateCounts();
  }

  // ─── RENDER A ROW ───
  function sbRenderRow(row) {
    var tbody = document.getElementById('tablaPacientes');
    if (!tbody) return;

    var tr = document.createElement('tr');
    tr.dataset.sbId = row.id;
    tr.dataset.alerta = row.alerta || 'ok';
    if (row.alerta === 'alta') tr.className = 'alerta-alta';
    else if (row.alerta === 'media') tr.className = 'alerta-media';

    // Alerta cell
    var tdAlerta = document.createElement('td');
    tdAlerta.className = 'pt-col-alerta';
    var alertaHTML = '';
    alertaHTML += '<button class="pt-alerta-btn pt-alerta-alta' + (row.alerta === 'alta' ? ' active' : '') + '" title="Alerta alta" onclick="sbSetAlerta(this,\'alta\')">&#x1F534;</button>';
    alertaHTML += '<button class="pt-alerta-btn pt-alerta-media' + (row.alerta === 'media' ? ' active' : '') + '" title="Alerta media" onclick="sbSetAlerta(this,\'media\')">&#x1F7E1;</button>';
    alertaHTML += '<button class="pt-alerta-btn pt-alerta-ok' + (row.alerta === 'ok' ? ' active' : '') + '" title="Sin alerta" onclick="sbSetAlerta(this,\'ok\')">&#x1F7E2;</button>';
    tdAlerta.innerHTML = alertaHTML;
    tr.appendChild(tdAlerta);

    // Data cells
    var fields = ['nombre', 'nhc', 'motivo', 'pendiente', 'diagnostico', 'tto_casa', 'tto_hospital', 'resultado'];
    var placeholders = ['Apellidos, Nombre', 'N.H.C.', 'Motivo / Sospecha', 'Pendiente', 'Posible diagnóstico', 'Tto. en casa', 'Tto. en hospital', 'Resultado pruebas'];
    var isTextarea = [true, false, true, true, true, true, true, true];

    fields.forEach(function(field, i) {
      var td = document.createElement('td');
      var el;
      if (isTextarea[i]) {
        el = document.createElement('textarea');
        el.rows = 2;
      } else {
        el = document.createElement('input');
        el.type = 'text';
      }
      el.className = 'pt-input';
      el.placeholder = placeholders[i];
      el.value = row[field] || '';
      el.dataset.field = field;
      el.addEventListener('change', function() { sbUpdateField(tr, field, this.value); });
      td.appendChild(el);
      tr.appendChild(td);
    });

    // Delete cell
    var tdDel = document.createElement('td');
    tdDel.style.textAlign = 'center';
    var delBtn = document.createElement('button');
    delBtn.innerHTML = '&#x2715;';
    delBtn.title = 'Eliminar fila';
    delBtn.style.cssText = 'background:none;border:none;color:#ef4444;cursor:pointer;font-size:1rem;padding:4px 6px;border-radius:5px;';
    delBtn.addEventListener('mouseover', function() { this.style.background = '#fee2e2'; });
    delBtn.addEventListener('mouseout', function() { this.style.background = 'none'; });
    delBtn.addEventListener('click', function() { sbDeleteRow(tr); });
    tdDel.appendChild(delBtn);
    tr.appendChild(tdDel);

    tbody.appendChild(tr);
  }

  // ─── ADD NEW PACIENTE ───
  window.sbAddPaciente = async function() {
    if (!sbClient || !sbUser) { alert('Inicia sesión primero'); return; }

    var result = await sbClient.from(TABLE).insert({
      user_id: sbUser.id,
      alerta: 'ok'
    }).select().single();

    if (result.error) {
      console.error('Insert error:', result.error);
      alert('Error al añadir paciente: ' + result.error.message);
      return;
    }

    sbRenderRow(result.data);
    if (typeof ptUpdateCounts === 'function') ptUpdateCounts();
  };

  // ─── UPDATE A FIELD ───
  async function sbUpdateField(tr, field, value) {
    var id = tr.dataset.sbId;
    if (!id || !sbClient) return;

    var update = {};
    update[field] = value;

    var result = await sbClient.from(TABLE).update(update).eq('id', id);
    if (result.error) {
      console.error('Update error:', result.error);
    }
  }

  // ─── SET ALERTA ───
  window.sbSetAlerta = async function(btn, nivel) {
    var tr = btn.closest('tr');
    if (!tr) return;
    var id = tr.dataset.sbId;
    var current = tr.dataset.alerta;

    // Toggle: if same, set to 'ok'
    var newAlerta = (current === nivel) ? 'ok' : nivel;
    tr.dataset.alerta = newAlerta;
    tr.className = newAlerta === 'alta' ? 'alerta-alta' : newAlerta === 'media' ? 'alerta-media' : '';

    // Update button active states
    var buttons = tr.querySelectorAll('.pt-alerta-btn');
    buttons.forEach(function(b) { b.classList.remove('active'); });
    if (newAlerta !== 'ok') {
      var activeBtn = tr.querySelector('.pt-alerta-' + newAlerta);
      if (activeBtn) activeBtn.classList.add('active');
    } else {
      var okBtn = tr.querySelector('.pt-alerta-ok');
      if (okBtn) okBtn.classList.add('active');
    }

    // Save to Supabase
    if (sbClient && id) {
      await sbClient.from(TABLE).update({ alerta: newAlerta }).eq('id', id);
    }
    if (typeof ptUpdateCounts === 'function') ptUpdateCounts();
  };

  // ─── DELETE ROW ───
  async function sbDeleteRow(tr) {
    var id = tr.dataset.sbId;
    if (!confirm('¿Eliminar este paciente?')) return;

    if (sbClient && id) {
      var result = await sbClient.from(TABLE).delete().eq('id', id);
      if (result.error) {
        alert('Error: ' + result.error.message);
        return;
      }
    }
    tr.remove();
    if (typeof ptUpdateCounts === 'function') ptUpdateCounts();
  }

  // ─── CLEAR ALL ───
  window.sbClearAll = async function() {
    if (!confirm('¿Borrar TODOS los pacientes de esta guardia?')) return;
    if (!sbClient || !sbUser) return;

    await sbClient.from(TABLE).delete().eq('user_id', sbUser.id);
    var tbody = document.getElementById('tablaPacientes');
    if (tbody) tbody.innerHTML = '';
    sbAddPaciente();
    sbAddPaciente();
    sbAddPaciente();
    if (typeof ptUpdateCounts === 'function') ptUpdateCounts();
  };

  // ─── EXPORT CSV ───
  window.sbExportCSV = function() {
    var tbody = document.getElementById('tablaPacientes');
    if (!tbody) return;
    var rows = tbody.querySelectorAll('tr');
    var csv = 'Alerta,Paciente,N.H.C.,Motivo,Pendiente,Diagnóstico,Tto Casa,Tto Hospital,Resultado\n';
    rows.forEach(function(tr) {
      var alerta = tr.dataset.alerta || 'ok';
      var cells = tr.querySelectorAll('.pt-input');
      var vals = [alerta];
      cells.forEach(function(c) { vals.push('"' + (c.value || '').replace(/"/g, '""') + '"'); });
      csv += vals.join(',') + '\n';
    });
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pacientes_guardia_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ─── PRINT ───
  window.sbPrint = function() {
    var tbody = document.getElementById('tablaPacientes');
    if (!tbody) return;
    var w = window.open('', '_blank');
    w.document.write('<html><head><title>Plantilla Pacientes</title>');
    w.document.write('<style>body{font-family:Segoe UI,Arial,sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;font-size:10pt;}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;}th{background:#0a1628;color:#fff;}.alerta-alta td{background:#fff0f0;}.alerta-media td{background:#fffbeb;}</style>');
    w.document.write('</head><body>');
    w.document.write('<h2>Plantilla Pacientes — ' + new Date().toLocaleDateString('es-ES') + '</h2>');
    w.document.write('<table><tr><th>Alerta</th><th>Paciente</th><th>N.H.C.</th><th>Motivo</th><th>Pendiente</th><th>Diagnóstico</th><th>Tto Casa</th><th>Tto Hospital</th><th>Resultado</th></tr>');
    tbody.querySelectorAll('tr').forEach(function(tr) {
      var alerta = tr.dataset.alerta || 'ok';
      var cls = alerta === 'alta' ? ' class="alerta-alta"' : alerta === 'media' ? ' class="alerta-media"' : '';
      var alertaIcon = alerta === 'alta' ? '🔴' : alerta === 'media' ? '🟡' : '🟢';
      w.document.write('<tr' + cls + '><td>' + alertaIcon + '</td>');
      tr.querySelectorAll('.pt-input').forEach(function(inp) {
        w.document.write('<td>' + (inp.value || '').replace(/</g, '&lt;') + '</td>');
      });
      w.document.write('</tr>');
    });
    w.document.write('</table>');
    w.document.write('<p style="font-size:8pt;color:#888;margin-top:20px;">Centro de Salud Virgen de la Caridad · Área II Cartagena · Generado: ' + new Date().toLocaleString('es-ES') + '</p>');
    w.document.write('</body></html>');
    w.document.close();
    setTimeout(function() { w.print(); }, 500);
  };

  // ─── STATUS INDICATOR ───
  function sbShowStatus(msg) {
    var el = document.getElementById('sbStatus');
    if (el) el.textContent = msg;
  }

  // ─── INITIALIZE ON DOM READY ───
  function sbBootstrap() {
    if (sbInit()) {
      console.log('[Supabase] Initialized for Area II Cartagena');
    } else {
      // SDK not loaded yet, retry
      setTimeout(sbBootstrap, 500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sbBootstrap);
  } else {
    sbBootstrap();
  }

})();
