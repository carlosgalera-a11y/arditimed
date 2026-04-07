/* ═══════════════════════════════════════════════════════════════
   AREA II CARTAGENA — SUPABASE PROGRESSIVE SYNC MODULE
   supabase-plantillas.js v2
   
   Modo por defecto: localStorage (funciona offline, sin login)
   Si el usuario inicia sesión: sincroniza con Supabase (nube)
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  var SUPABASE_URL = 'https://ztigttazrdzkpxrzyast.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_-4fdzwv8Kv62RW9LUTaMEw_3uxZJ1-l';
  var TABLE = 'plantillas_pacientes';

  var sbClient = null;
  var sbUser = null;
  var sbReady = false;

  function sbInit() {
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.log('[Supabase] SDK not loaded — localStorage only');
      return false;
    }
    try {
      sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch(e) {
      console.warn('[Supabase] Init error:', e);
      return false;
    }

    sbClient.auth.onAuthStateChange(function(event, session) {
      sbUser = session ? session.user : null;
      sbReady = !!sbUser;
      sbUpdateAuthUI();
      if (sbUser) sbSyncFromCloud();
    });

    sbClient.auth.getSession().then(function(result) {
      var session = result.data.session;
      sbUser = session ? session.user : null;
      sbReady = !!sbUser;
      sbUpdateAuthUI();
      if (sbUser) sbSyncFromCloud();
    });

    return true;
  }

  function sbUpdateAuthUI() {
    var authPanel = document.getElementById('sbAuthPanel');
    var cloudBtn = document.getElementById('sbCloudBtn');
    var logoutBtn = document.getElementById('sbLogoutBtn');
    var userInfo = document.getElementById('sbUserInfo');

    if (sbUser) {
      if (authPanel) authPanel.style.display = 'none';
      if (cloudBtn) cloudBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = '';
      if (userInfo) userInfo.textContent = '☁️ ' + (sbUser.email || 'Sincronizado');
    } else {
      if (cloudBtn) cloudBtn.style.display = '';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (userInfo) userInfo.textContent = 'Datos guardados en este dispositivo';
    }
  }

  window.sbSignUp = async function() {
    if (!sbClient) { alert('Supabase no disponible'); return; }
    var email = document.getElementById('sbEmail').value.trim();
    var pass = document.getElementById('sbPass').value;
    if (!email || !pass) { alert('Introduce email y contraseña'); return; }
    if (pass.length < 6) { alert('Min. 6 caracteres'); return; }
    var btn = document.getElementById('sbSignUpBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Registrando...'; }
    var result = await sbClient.auth.signUp({ email: email, password: pass });
    if (btn) { btn.disabled = false; btn.textContent = 'Registrarse'; }
    if (result.error) alert('Error: ' + result.error.message);
    else if (result.data.user && !result.data.session) alert('Revisa tu email para confirmar.');
  };

  window.sbSignIn = async function() {
    if (!sbClient) { alert('Supabase no disponible'); return; }
    var email = document.getElementById('sbEmail').value.trim();
    var pass = document.getElementById('sbPass').value;
    if (!email || !pass) { alert('Introduce email y contraseña'); return; }
    var btn = document.getElementById('sbSignInBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Entrando...'; }
    var result = await sbClient.auth.signInWithPassword({ email: email, password: pass });
    if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
    if (result.error) alert('Error: ' + result.error.message);
  };

  window.sbSignInGoogle = async function() {
    if (!sbClient) { alert('Supabase no disponible'); return; }
    var result = await sbClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname }
    });
    if (result.error) alert('Error Google: ' + result.error.message);
  };

  window.sbSignOut = async function() {
    if (sbClient) await sbClient.auth.signOut();
    sbUser = null;
    sbReady = false;
    sbUpdateAuthUI();
    sbShowStatus('Sesión cerrada — datos locales conservados');
    setTimeout(function() { sbShowStatus(''); }, 2000);
  };

  async function sbSyncFromCloud() {
    if (!sbClient || !sbUser) return;
    sbShowStatus('Sincronizando...');
    try {
      var result = await sbClient.from(TABLE).select('*').order('created_at', { ascending: true });
      if (result.error) { sbShowStatus('Error: ' + result.error.message); return; }
      var cloudRows = result.data || [];
      if (cloudRows.length > 0) {
        var tbody = document.getElementById('tablaPacientesTbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        cloudRows.forEach(function(row) {
          var data = [row.nombre||'', row.nhc||'', row.motivo||'', row.pendiente||'', row.diagnostico||'', row.tto_casa||'', row.tto_hospital||'', row.resultado||''];
          if (typeof ptAddRow === 'function') ptAddRow(data, row.alerta || 'none', row.id);
        });
        sbShowStatus(cloudRows.length + ' pacientes sincronizados');
      } else {
        sbUploadLocalToCloud();
        sbShowStatus('Datos locales subidos a la nube');
      }
      setTimeout(function() { sbShowStatus(''); }, 3000);
    } catch(e) {
      console.error('[Supabase] Sync error:', e);
      sbShowStatus('Error de conexión — usando datos locales');
    }
  }

  async function sbUploadLocalToCloud() {
    if (!sbClient || !sbUser) return;
    var tbody = document.getElementById('tablaPacientesTbody');
    if (!tbody) return;
    var rows = tbody.querySelectorAll('tr');
    var fields = ['nombre','nhc','motivo','pendiente','diagnostico','tto_casa','tto_hospital','resultado'];
    for (var i = 0; i < rows.length; i++) {
      var tr = rows[i];
      var inputs = tr.querySelectorAll('textarea, input[type=text]');
      var rowData = { user_id: sbUser.id, alerta: tr.dataset.alerta || 'none' };
      var hasData = false;
      inputs.forEach(function(el, idx) {
        if (fields[idx]) { rowData[fields[idx]] = el.value || ''; if (el.value) hasData = true; }
      });
      if (hasData) {
        try { await sbClient.from(TABLE).insert(rowData); } catch(e) { console.warn('[Supabase] Upload error:', e); }
      }
    }
  }

  // Override sbAddPaciente: local first, cloud optional
  window.sbAddPaciente = function() {
    if (typeof ptInit === 'function') ptInit();
    if (typeof ptAddRow === 'function') ptAddRow();
    if (sbClient && sbUser) {
      sbClient.from(TABLE).insert({ user_id: sbUser.id, alerta: 'ok' }).then(function(){}).catch(function(e) { console.warn('[Supabase] Insert error:', e); });
    }
  };

  // Override sbClearAll
  window.sbClearAll = async function() {
    if (!confirm('¿Borrar TODOS los pacientes?')) return;
    var tbody = document.getElementById('tablaPacientesTbody');
    if (tbody) tbody.innerHTML = '';
    try { localStorage.removeItem('plantilla_pacientes_v1'); } catch(e) {}
    if (typeof ptAddRow === 'function') { ptAddRow(); ptAddRow(); ptAddRow(); }
    if (sbClient && sbUser) {
      try { await sbClient.from(TABLE).delete().eq('user_id', sbUser.id); } catch(e) {}
    }
    if (typeof ptUpdateCounts === 'function') ptUpdateCounts();
  };

  window.sbExportCSV = function() { if (typeof ptExportCSV === 'function') ptExportCSV(); };
  window.sbPrint = function() { if (typeof ptPrint === 'function') ptPrint(); };

  function sbShowStatus(msg) {
    var el = document.getElementById('sbStatus');
    if (el) el.textContent = msg;
  }

  function sbBootstrap() {
    if (typeof ptInit === 'function') ptInit();
    if (sbInit()) console.log('[Supabase] Cloud sync available');
    else console.log('[Supabase] localStorage mode');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sbBootstrap);
  else sbBootstrap();
})();
