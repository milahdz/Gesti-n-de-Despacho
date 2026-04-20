// ╔══════════════════════════════════════════════════════════════╗
// ║              INSUMOS PRO — app.js (versión completa)        ║
// ╚══════════════════════════════════════════════════════════════╝

// ─── SUPABASE ────────────────────────────────────────────────────
const SUPABASE_URL     = 'https://inenjhpybhadvebglskr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluZW5qaHB5YmhhZHZlYmdsc2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDY5NzIsImV4cCI6MjA5MjAyMjk3Mn0.re4HRRhNG5s6QarV2h8_J71_TpVEbOKAGGR2B3kYjEc';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── ESTADO GLOBAL ───────────────────────────────────────────────
let currentUser    = null;   // { idusuario, nombre, correo, idrol, nombrerol, iddepartamento }
let currentSection = 'dashboard';

// ─── ROLES ───────────────────────────────────────────────────────
const ROLES = {
  ADMIN:    'Administrador',
  ALMACEN:  'Almacén',
  SOLICIT:  'Solicitante',
};
const isAdmin   = () => currentUser?.nombrerol === ROLES.ADMIN;
const isAlmacen = () => currentUser?.nombrerol === ROLES.ALMACEN;

// ══════════════════════════════════════════════════════════════════
//  UTILIDADES UI
// ══════════════════════════════════════════════════════════════════
function showLoader(show = true) {
  const loader  = document.getElementById('loaderWrapper');
  const content = document.getElementById('dynamicContent');
  if (loader)  loader.style.display      = show ? 'flex'    : 'none';
  if (content) content.style.visibility = show ? 'hidden'  : 'visible';
}

function showError(msg) {
  const el = document.getElementById('dynamicContent');
  if (!el) return;
  el.style.visibility = 'visible';
  el.innerHTML = `
    <div style="text-align:center;padding:60px 20px;color:#b91c1c">
      <i class="fas fa-exclamation-triangle" style="font-size:2.5rem;display:block;margin-bottom:16px"></i>
      <p style="font-size:1.1rem;font-weight:600">${msg}</p>
      <p style="color:#64748b;margin-top:8px">Revisa la consola del navegador.</p>
    </div>`;
}

function showToast(msg, type = 'success') {
  document.getElementById('toast-msg')?.remove();
  const colors = { success:'#22c55e', error:'#ef4444', warning:'#f59e0b' };
  const icons  = { success:'fa-check-circle', error:'fa-times-circle', warning:'fa-exclamation-circle' };
  const t = document.createElement('div');
  t.id = 'toast-msg';
  t.innerHTML = `<i class="fas ${icons[type]}"></i> ${msg}`;
  Object.assign(t.style, {
    position:'fixed', bottom:'28px', right:'28px', zIndex:'9999',
    background:colors[type], color:'white', padding:'12px 20px',
    borderRadius:'12px', fontWeight:'600', fontSize:'0.9rem',
    display:'flex', alignItems:'center', gap:'8px',
    boxShadow:'0 8px 20px rgba(0,0,0,.15)', animation:'slideIn .3s ease'
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function showModal(title, message, onConfirm) {
  const modal = document.getElementById('modalConfirm');
  const ok    = document.getElementById('modalConfirmBtn');
  const cancel= document.getElementById('modalCancelBtn');
  const x     = document.querySelector('.close-modal');
  document.getElementById('modalTitle').innerText   = title;
  document.getElementById('modalMessage').innerText = message;
  modal.style.display = 'flex';
  const close = () => {
    modal.style.display = 'none';
    ok.removeEventListener('click', handler);
    cancel.removeEventListener('click', close);
    x.removeEventListener('click', close);
  };
  const handler = () => { onConfirm(); close(); };
  ok.addEventListener('click', handler);
  cancel.addEventListener('click', close);
  x.addEventListener('click', close);
}

// ── FORM MODAL ───────────────────────────────────────────────────
function openFormModal(title, bodyHTML, onSubmit, maxWidth = '580px') {
  document.getElementById('formModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'formModal';
  modal.style.cssText = `position:fixed;inset:0;z-index:2000;background:rgba(15,23,42,.55);
    display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease`;
  modal.innerHTML = `
    <div style="background:white;border-radius:24px;width:100%;max-width:${maxWidth};
      box-shadow:0 25px 50px rgba(0,0,0,.18);overflow:hidden;animation:slideUp .25s ease">
      <div style="padding:22px 28px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between">
        <h3 style="font-size:1.1rem;font-weight:700;color:#0f172a">${title}</h3>
        <button id="closeFormModal" style="background:none;border:none;font-size:1.5rem;color:#94a3b8;cursor:pointer;line-height:1">&times;</button>
      </div>
      <div id="formModalBody" style="padding:24px 28px;max-height:75vh;overflow-y:auto">${bodyHTML}</div>
      <div style="padding:16px 28px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:12px">
        <button id="cancelFormBtn" class="btn-secondary">Cancelar</button>
        <button id="submitFormBtn" class="btn-primary" style="min-width:130px">
          <i class="fas fa-save"></i> Guardar
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  const close = () => modal.remove();
  document.getElementById('closeFormModal').addEventListener('click', close);
  document.getElementById('cancelFormBtn').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.getElementById('submitFormBtn').addEventListener('click', async () => {
    const btn = document.getElementById('submitFormBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    try   { await onSubmit(); close(); }
    catch { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Guardar'; }
  });
}

// ── FORM HELPERS ─────────────────────────────────────────────────
const fIS = `width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;
  font-family:inherit;font-size:.9rem;color:#0f172a;outline:none;transition:border .2s;box-sizing:border-box;`;
const fLS = `display:block;font-size:.78rem;font-weight:600;color:#475569;margin-bottom:5px;text-transform:uppercase;letter-spacing:.04em;`;
const fGS = `margin-bottom:18px;`;

const fi  = (id,lbl,type='text',ph='',req=true,val='') =>
  `<div style="${fGS}"><label for="${id}" style="${fLS}">${lbl}${req?'<span style="color:#ef4444">*</span>':''}</label>
   <input id="${id}" type="${type}" placeholder="${ph}" value="${val}" style="${fIS}" ${req?'required':''}></div>`;

const fta = (id,lbl,ph='',req=false,val='') =>
  `<div style="${fGS}"><label for="${id}" style="${fLS}">${lbl}${req?'<span style="color:#ef4444">*</span>':''}</label>
   <textarea id="${id}" placeholder="${ph}" rows="3" style="${fIS}resize:vertical">${val}</textarea></div>`;

const getVal   = id => document.getElementById(id)?.value?.trim() || '';
const getInt   = id => parseInt(document.getElementById(id)?.value) || 0;
const getCheck = id => document.getElementById(id)?.checked ?? false;

function req(...fields) {
  for (const [id, lbl] of fields)
    if (!getVal(id)) { showToast(`"${lbl}" es obligatorio`, 'warning'); return false; }
  return true;
}

// ══════════════════════════════════════════════════════════════════
//  AUTENTICACIÓN
// ══════════════════════════════════════════════════════════════════

/** Muestra / oculta la pantalla de login dentro del contenedor principal */
function renderLogin() {
  // Ocultar sidebar y mostrar sólo el login
  document.querySelector('.sidebar').style.display   = 'none';
  document.querySelector('.main-content').style.marginLeft = '0';

  const content = document.getElementById('dynamicContent');
  document.getElementById('loaderWrapper').style.display = 'none';
  content.style.visibility = 'visible';
  content.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)">
      <div style="background:white;border-radius:28px;padding:40px 44px;width:100%;max-width:420px;
        box-shadow:0 32px 64px rgba(0,0,0,.25);animation:slideUp .3s ease">
        <div style="text-align:center;margin-bottom:32px">
          <div style="width:60px;height:60px;background:#3b82f6;border-radius:16px;
            display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px;
            box-shadow:0 8px 20px rgba(59,130,246,.35)">
            <i class="fas fa-boxes" style="font-size:1.6rem;color:white"></i>
          </div>
          <h1 style="font-size:1.6rem;font-weight:700;color:#0f172a;margin-bottom:4px">InsumosPro</h1>
          <p style="color:#64748b;font-size:.9rem">Gestión de Despachos — Iniciar sesión</p>
        </div>

        <div id="loginError" style="display:none;background:#fef2f2;border:1px solid #fecaca;
          border-radius:10px;padding:10px 14px;color:#b91c1c;font-size:.85rem;margin-bottom:16px;
          display:flex;align-items:center;gap:8px">
          <i class="fas fa-exclamation-circle"></i><span id="loginErrorMsg"></span>
        </div>

        <div style="${fGS}">
          <label style="${fLS}">Correo electrónico</label>
          <input id="login-email" type="email" placeholder="usuario@empresa.com"
            style="${fIS}" autocomplete="username">
        </div>
        <div style="${fGS}">
          <label style="${fLS}">Contraseña</label>
          <div style="position:relative">
            <input id="login-pass" type="password" placeholder="••••••••"
              style="${fIS}padding-right:44px" autocomplete="current-password">
            <button id="togglePass" type="button" style="position:absolute;right:12px;top:50%;
              transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#94a3b8">
              <i class="fas fa-eye" id="eyeIcon"></i>
            </button>
          </div>
        </div>

        <button id="loginBtn" style="width:100%;padding:12px;background:#3b82f6;color:white;
          border:none;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer;
          transition:background .2s;box-shadow:0 4px 12px rgba(59,130,246,.3)">
          <i class="fas fa-sign-in-alt"></i> Ingresar
        </button>
        <p style="text-align:center;color:#94a3b8;font-size:.8rem;margin-top:20px">
          ¿Problemas de acceso? Contacta al administrador del sistema.
        </p>
      </div>
    </div>`;

  // Eventos login
  document.getElementById('togglePass').addEventListener('click', () => {
    const inp = document.getElementById('login-pass');
    const ico = document.getElementById('eyeIcon');
    if (inp.type === 'password') { inp.type = 'text';     ico.className = 'fas fa-eye-slash'; }
    else                         { inp.type = 'password'; ico.className = 'fas fa-eye'; }
  });

  const doLogin = () => handleLogin();
  document.getElementById('loginBtn').addEventListener('click', doLogin);
  document.getElementById('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('login-email').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('login-pass').focus(); });
}

async function handleLogin() {
  const email = getVal('login-email');
  const pass  = getVal('login-pass');
  const btn   = document.getElementById('loginBtn');
  const errBox= document.getElementById('loginError');
  const errMsg= document.getElementById('loginErrorMsg');

  if (!email || !pass) { showLoginError('Completa todos los campos.'); return; }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';

  // Buscar usuario por correo
  const { data: usuarios, error } = await db
    .from('usuarios')
    .select('*, roles(nombrerol), departamentos(nombre)')
    .eq('correo', email)
    .eq('activo', true)
    .limit(1);

  if (error || !usuarios?.length) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingresar';
    showLoginError('Correo o contraseña incorrectos.');
    return;
  }

  const u = usuarios[0];

  // Comparación de contraseña (texto plano — en producción usa bcrypt en un Edge Function)
  if (u.passwordhash !== pass) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingresar';
    showLoginError('Correo o contraseña incorrectos.');
    return;
  }

  // Sesión exitosa
  currentUser = {
    idusuario:       u.idusuario,
    nombre:          u.nombre,
    correo:          u.correo,
    idrol:           u.idrol,
    nombrerol:       u.roles?.nombrerol ?? '',
    iddepartamento:  u.iddepartamento,
    departamento:    u.departamentos?.nombre ?? '',
  };
  sessionStorage.setItem('insumos_user', JSON.stringify(currentUser));
  initApp();
}

function showLoginError(msg) {
  const box = document.getElementById('loginError');
  const txt = document.getElementById('loginErrorMsg');
  if (!box || !txt) return;
  txt.textContent = msg;
  box.style.display = 'flex';
}

function handleLogout() {
  showModal('Cerrar sesión', '¿Estás seguro que deseas salir?', () => {
    sessionStorage.removeItem('insumos_user');
    currentUser = null;
    renderLogin();
  });
}

// ══════════════════════════════════════════════════════════════════
//  INICIALIZACIÓN Y NAVEGACIÓN
// ══════════════════════════════════════════════════════════════════
function initApp() {
  // Restaurar UI
  document.querySelector('.sidebar').style.display   = '';
  document.querySelector('.main-content').style.marginLeft = '';

  // Actualizar info de usuario en sidebar
  document.getElementById('userNameSidebar').textContent = currentUser.nombre;
  document.getElementById('userRoleSidebar').textContent = currentUser.nombrerol;

  // Control de acceso en nav: ocultar secciones según rol
  applyNavPermissions();

  // Ir al dashboard
  loadSection('dashboard');
}

function applyNavPermissions() {
  const admin   = isAdmin();
  const almacen = isAlmacen();
  // Almacén: ve TODAS las secciones excepto Usuarios, pero en modo solo lectura
  const permisos = {
    dashboard:   true,
    solicitudes: true,
    inventario:  admin || almacen,
    despacho:    admin || almacen,
    usuarios:    admin,           // solo Admin gestiona usuarios
  };
  document.querySelectorAll('.nav-item').forEach(item => {
    const sec = item.dataset.section;
    item.style.display = permisos[sec] !== false ? '' : 'none';
  });
}

// Helper: Almacén puede VER pero no MODIFICAR
const canEdit = () => isAdmin();

function loadSection(sectionId) {
  currentSection = sectionId;
  const titles = {
    dashboard:'Dashboard', solicitudes:'Solicitudes',
    inventario:'Inventario', despacho:'Despacho', usuarios:'Usuarios'
  };
  document.getElementById('currentSectionTitle').innerText = titles[sectionId] ?? sectionId;
  document.querySelectorAll('.nav-item').forEach(i =>
    i.classList.toggle('active', i.dataset.section === sectionId));
  const map = {
    dashboard:renderDashboard, solicitudes:renderSolicitudes,
    inventario:renderInventario, despacho:renderDespacho, usuarios:renderUsuarios
  };
  (map[sectionId] ?? renderDashboard)();
}

// ══════════════════════════════════════════════════════════════════
//  CONSULTAS SUPABASE
// ══════════════════════════════════════════════════════════════════
async function fetchDashboardStats() {
  // ⚠️ El query builder de Supabase NO es reutilizable — cada consulta debe construirse por separado
  const mkQuery = (estado) => {
    let q = db.from('solicitudes')
      .select('*', { count:'exact', head:true })
      .eq('estado', estado);
    if (!isAdmin()) q = q.eq('idusuario', currentUser.idusuario);
    return q;
  };

  const [r1,r2,r3,r4] = await Promise.all([
    mkQuery('Pendiente'),
    mkQuery('Aprobada'),
    mkQuery('Rechazada'),
    mkQuery('Despachada'),
  ]);
  return { pendientes:r1.count??0, aprobadas:r2.count??0, rechazadas:r3.count??0, despachadas:r4.count??0 };
}

async function fetchAlertasInventario() {
  const { data } = await db.from('productos').select('nombre,stockactual,stockminimo').eq('activo',true);
  return (data??[]).filter(p => p.stockactual < p.stockminimo);
}

async function fetchSolicitudes(filtro = null) {
  let q = db.from('solicitudes')
    .select('idsolicitud, prioridad, fechasolicitud, estado, comentarios, idusuario')
    .order('fechasolicitud', { ascending:false });
  if (!isAdmin()) q = q.eq('idusuario', currentUser.idusuario);
  if (filtro && filtro !== 'Todos') q = q.eq('estado', filtro);
  const { data, error } = await q;
  if (error) { console.error('fetchSolicitudes:', error); return []; }
  if (!data?.length) return [];

  // Fetch users separately to avoid FK ambiguity
  const userIds = [...new Set(data.map(s => s.idusuario))];
  const { data: usuarios } = await db.from('usuarios')
    .select('idusuario, nombre, iddepartamento, departamentos(nombre)')
    .in('idusuario', userIds);

  const usrMap = {};
  (usuarios ?? []).forEach(u => { usrMap[u.idusuario] = u; });

  return data.map(s => ({
    ...s,
    usuarios: usrMap[s.idusuario] ?? null
  }));
}

async function fetchInventario() {
  const { data } = await db.from('productos').select('*').order('nombre');
  return data ?? [];
}

async function fetchProductosActivos() {
  const { data } = await db.from('productos').select('idproducto,nombre,stockactual').eq('activo',true).order('nombre');
  return data ?? [];
}

async function fetchSolicitudesParaDespachar() {
  const { data, error } = await db.from('solicitudes')
    .select('idsolicitud, prioridad, fechasolicitud, estado, comentarios, idusuario')
    .eq('estado','Aprobada')
    .order('fechasolicitud', { ascending: false });
  if (error) { console.error('fetchSolicitudesParaDespachar:', error); return []; }
  if (!data?.length) return [];

  // Fetch user info separately to avoid FK join issues
  const userIds = [...new Set(data.map(s => s.idusuario))];
  const { data: usuarios } = await db.from('usuarios')
    .select('idusuario, nombre, iddepartamento, departamentos(nombre)')
    .in('idusuario', userIds);

  const usrMap = {};
  (usuarios ?? []).forEach(u => { usrMap[u.idusuario] = u; });

  return data.map(s => ({
    ...s,
    usuarios: usrMap[s.idusuario] ?? null
  }));
}

async function fetchUsuarios() {
  const { data } = await db.from('usuarios')
    .select('*, roles(nombrerol), departamentos(nombre)')
    .order('nombre');
  return data ?? [];
}
async function fetchRoles()        { const { data } = await db.from('roles').select('*').order('nombrerol');            return data??[]; }
async function fetchDepartamentos(){ const { data } = await db.from('departamentos').select('*').order('nombre');      return data??[]; }

async function registrarDespacho(solicitudId, itemsDespachados) {
  const { data: desp, error: e1 } = await db.from('despachos')
    .insert({ idsolicitud:solicitudId, idusuariodespacha:currentUser.idusuario,
              fechadespacho:new Date().toISOString(), estado:'Completado' }).select();
  if (e1) throw e1;
  const did = desp[0].iddespacho;
  for (const it of itemsDespachados) {
    await db.from('despachodetalle').insert({ iddespacho:did, idproducto:it.idproducto, cantidaddespachada:it.cantidad });
    // Si tienes la RPC actualizar_stock, descomenta la siguiente línea:
    // await db.rpc('actualizar_stock', { p_producto_id: it.idproducto, p_cantidad: it.cantidad });
  }
  await db.from('solicitudes').update({ estado:'Despachada' }).eq('idsolicitud', solicitudId);
  return { iddespacho: did, idsolicitud: solicitudId };
}

// ══════════════════════════════════════════════════════════════════
//  SECCIÓN: DASHBOARD
// ══════════════════════════════════════════════════════════════════
async function renderDashboard() {
  showLoader(true);
  try {
    const [stats, alertas] = await Promise.all([fetchDashboardStats(), fetchAlertasInventario()]);
    const statCards = [
      { label:'Pendientes',  val:stats.pendientes,  icon:'fa-clock',         color:'#f59e0b', bg:'#fffbeb' },
      { label:'Aprobadas',   val:stats.aprobadas,   icon:'fa-check-circle',  color:'#22c55e', bg:'#f0fdf4' },
      { label:'Rechazadas',  val:stats.rechazadas,  icon:'fa-times-circle',  color:'#ef4444', bg:'#fef2f2' },
      { label:'Despachadas', val:stats.despachadas, icon:'fa-truck',         color:'#3b82f6', bg:'#eff6ff' },
    ].map(c => `
      <div class="stat-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <h3>${c.label}</h3>
            <div class="stat-number" style="color:${c.color}">${c.val}</div>
          </div>
          <div style="width:44px;height:44px;border-radius:12px;background:${c.bg};
            display:flex;align-items:center;justify-content:center">
            <i class="fas ${c.icon}" style="color:${c.color};font-size:1.2rem"></i>
          </div>
        </div>
      </div>`).join('');

    const alertasHTML = alertas.length
      ? alertas.map(a => {
          const pct = Math.min(100, Math.round((a.stockactual / a.stockminimo) * 100));
          const cr  = a.stockactual === 0;
          return `<div style="padding:12px 16px;border-radius:12px;border:1px solid ${cr?'#fecaca':'#fed7aa'};
            background:${cr?'#fef2f2':'#fff7ed'};margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <strong style="font-size:.9rem">${a.nombre}</strong>
              <span style="font-size:.75rem;font-weight:700;padding:2px 8px;border-radius:20px;
                background:${cr?'#ef4444':'#f97316'};color:white">${cr?'Agotado':'Bajo'}</span>
            </div>
            <div style="height:6px;background:#e2e8f0;border-radius:4px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${cr?'#ef4444':'#f97316'};border-radius:4px;transition:.3s"></div>
            </div>
            <div style="font-size:.75rem;color:#64748b;margin-top:4px">Stock: ${a.stockactual} / Mín: ${a.stockminimo}</div>
          </div>`;}).join('')
      : '<p style="color:#64748b;font-size:.9rem">✅ Sin alertas de inventario</p>';

    document.getElementById('dynamicContent').innerHTML = `
      <div class="stats-grid">${statCards}</div>
      ${isAdmin() || isAlmacen() ? `
      <div style="background:white;border-radius:20px;padding:24px;margin-top:16px;box-shadow:0 1px 3px rgba(0,0,0,.05)">
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:16px">
          <i class="fas fa-exclamation-triangle" style="color:#f97316;margin-right:8px"></i>
          Alertas de Inventario
        </h3>
        ${alertasHTML}
      </div>` : ''}
      <div style="background:white;border-radius:20px;padding:24px;margin-top:16px;box-shadow:0 1px 3px rgba(0,0,0,.05)">
        <p style="color:#64748b;font-size:.9rem">
          Bienvenido, <strong>${currentUser.nombre}</strong> — 
          Rol: <span style="color:#3b82f6;font-weight:600">${currentUser.nombrerol}</span>
          ${currentUser.departamento ? `· Depto: <strong>${currentUser.departamento}</strong>` : ''}
        </p>
      </div>`;
  } catch(e) { console.error(e); showError('No se pudo cargar el dashboard.'); }
  finally    { showLoader(false); }
}

// ══════════════════════════════════════════════════════════════════
//  SECCIÓN: SOLICITUDES
// ══════════════════════════════════════════════════════════════════
function badgeClass(estado) {
  return { Pendiente:'badge-pendiente', Aprobada:'badge-aprobado',
           Rechazada:'badge-rechazado', Despachada:'badge-despachado' }[estado] ?? '';
}

function renderFilas(solicitudes) {
  showLoader(false);
  let rows = '';
  for (const s of solicitudes) {
    const u = s.usuarios ?? {};
    const d = u.departamentos ?? {};
    const pColores = { Alta:['#fef2f2','#b91c1c'], Media:['#fffbeb','#b45309'], Baja:['#f0fdf4','#15803d'] };
    const [pBg, pCl] = pColores[s.prioridad] ?? ['#f1f5f9','#475569'];
    rows += `<tr>
      <td style="font-weight:600;color:#475569">#${s.idsolicitud}</td>
      <td>
        <div style="font-weight:600;font-size:.88rem">${u.nombre ?? 'N/A'}</div>
        <div style="font-size:.73rem;color:#94a3b8">${d.nombre ?? ''}</div>
      </td>
      <td>${new Date(s.fechasolicitud).toLocaleDateString('es-DO')}</td>
      <td><span style="font-weight:700;font-size:.75rem;padding:3px 10px;border-radius:20px;
        background:${pBg};color:${pCl}">${s.prioridad}</span></td>
      <td><span class="badge ${badgeClass(s.estado)}">${s.estado}</span></td>
      <td style="display:flex;gap:6px;align-items:center">
        <button class="btn-secondary detalle-sol" data-id="${s.idsolicitud}"
          style="padding:5px 10px;font-size:.8rem;color:#6366f1" title="Ver detalle y productos">
          <i class="fas fa-list-ul"></i></button>
        ${isAdmin() ? `
          <button class="btn-secondary eliminar-sol" data-id="${s.idsolicitud}"
            style="padding:5px 10px;font-size:.8rem;color:#ef4444" title="Eliminar">
            <i class="fas fa-trash"></i></button>
        ` : ''}
      </td></tr>`;
  }
  const tbody = document.querySelector('.sol-table tbody');
  if (tbody) tbody.innerHTML = rows || '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:32px">Sin resultados</td></tr>';
  bindSolicitudesEvents();
}

function bindSolicitudesEvents() {
  document.querySelectorAll('.editar-sol').forEach(btn =>
    btn.addEventListener('click', async () => {
      const { data } = await db.from('solicitudes').select('*').eq('idsolicitud', btn.dataset.id).single();
      if (data) abrirFormSolicitud(data);
    }));

  document.querySelectorAll('.aprobar-sol').forEach(btn =>
    btn.addEventListener('click', () => abrirModalCambioEstado(btn.dataset.id)));

  document.querySelectorAll('.eliminar-sol').forEach(btn =>
    btn.addEventListener('click', () =>
      showModal('Eliminar solicitud', `¿Eliminar solicitud #${btn.dataset.id}?`, async () => {
        await db.from('solicituddetalle').delete().eq('idsolicitud', btn.dataset.id);
        const { error } = await db.from('solicitudes').delete().eq('idsolicitud', btn.dataset.id);
        if (error) showToast('Error al eliminar','error');
        else { showToast('Eliminada','warning'); renderSolicitudes(); }
      })));

  document.querySelectorAll('.detalle-sol').forEach(btn =>
    btn.addEventListener('click', () => verDetalleSolicitud(btn.dataset.id)));
}

// ── Modal de detalle de productos de una solicitud ────────────────
async function verDetalleSolicitud(solicitudId) {
  // Traer cabecera de solicitud
  const { data: sol } = await db.from('solicitudes')
    .select('idsolicitud, estado, prioridad, fechasolicitud, comentarios, idusuario')
    .eq('idsolicitud', solicitudId)
    .single();

  // Traer usuario/departamento
  let solicitante = 'N/A', departamento = 'N/A';
  if (sol?.idusuario) {
    const { data: usr } = await db.from('usuarios')
      .select('nombre, iddepartamento, departamentos(nombre)')
      .eq('idusuario', sol.idusuario)
      .single();
    solicitante  = usr?.nombre ?? 'N/A';
    // departamentos puede venir como join o no
    departamento = usr?.departamentos?.nombre ?? 'N/A';
    if (departamento === 'N/A' && usr?.iddepartamento) {
      const { data: dep } = await db.from('departamentos')
        .select('nombre').eq('iddepartamento', usr.iddepartamento).single();
      departamento = dep?.nombre ?? 'N/A';
    }
  }

  // Traer detalle de productos
  const { data: items } = await db.from('solicituddetalle')
    .select('cantidad, idproducto')
    .eq('idsolicitud', solicitudId);

  let productosHTML = '';
  if (items?.length) {
    // Traer nombres de productos
    const ids = items.map(i => i.idproducto);
    const { data: prods } = await db.from('productos')
      .select('idproducto, nombre, descripcion, stockactual')
      .in('idproducto', ids);
    const prodMap = {};
    (prods ?? []).forEach(p => { prodMap[p.idproducto] = p; });

    const totalItems = items.reduce((acc, i) => acc + (i.cantidad ?? 0), 0);

    productosHTML = `
      <div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:.78rem;font-weight:700;color:#64748b;text-transform:uppercase;
          letter-spacing:.05em">${items.length} producto${items.length!==1?'s':''} · ${totalItems} unidades totales</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${items.map((it, idx) => {
          const p  = prodMap[it.idproducto] ?? {};
          const cr = (p.stockactual ?? 0) < (it.cantidad ?? 0);
          return `
            <div style="display:grid;grid-template-columns:28px 1fr auto;gap:10px;align-items:center;
              padding:12px 14px;border-radius:12px;background:#f8fafc;border:1.5px solid #e2e8f0">
              <div style="width:28px;height:28px;border-radius:8px;background:#e0e7ff;
                display:flex;align-items:center;justify-content:center;
                font-size:.75rem;font-weight:700;color:#4f46e5">${idx+1}</div>
              <div>
                <div style="font-weight:600;font-size:.9rem;color:#0f172a">${p.nombre ?? 'Producto #'+it.idproducto}</div>
                ${p.descripcion ? `<div style="font-size:.73rem;color:#94a3b8;margin-top:1px">${p.descripcion}</div>` : ''}
                <div style="font-size:.72rem;margin-top:3px;color:${cr?'#ef4444':'#64748b'}">
                  <i class="fas fa-boxes" style="margin-right:3px"></i>
                  Stock disponible: <strong>${p.stockactual ?? 'N/A'}</strong>
                  ${cr ? ' <span style="color:#ef4444;font-weight:700">⚠ Insuficiente</span>' : ''}
                </div>
              </div>
              <div style="text-align:center;min-width:60px">
                <div style="font-size:1.3rem;font-weight:800;color:#0f172a">${it.cantidad}</div>
                <div style="font-size:.68rem;color:#94a3b8">unidades</div>
              </div>
            </div>`;
        }).join('')}
      </div>
      ${sol?.comentarios ? `
        <div style="margin-top:14px;padding:10px 14px;background:#fffbeb;border-radius:10px;
          border:1px solid #fde68a;font-size:.83rem;color:#92400e">
          <i class="fas fa-comment-alt" style="margin-right:6px"></i>
          <strong>Comentario:</strong> ${sol.comentarios}
        </div>` : ''}`;
  } else {
    productosHTML = `<p style="color:#94a3b8;text-align:center;padding:24px 0;font-size:.9rem">
      Sin productos registrados en esta solicitud.</p>`;
  }

  // Colores de estado y prioridad
  const estColores = {
    Pendiente:  ['#fffbeb','#b45309','#fef3c7'],
    Aprobada:   ['#f0fdf4','#15803d','#dcfce7'],
    Rechazada:  ['#fef2f2','#b91c1c','#fee2e2'],
    Despachada: ['#eff6ff','#1d4ed8','#dbeafe'],
  };
  const [eBg, eCl] = estColores[sol?.estado] ?? ['#f1f5f9','#475569'];
  const pColores = { Alta:['#fef2f2','#b91c1c'], Media:['#fffbeb','#b45309'], Baja:['#f0fdf4','#15803d'] };
  const [pBg, pCl] = pColores[sol?.prioridad] ?? ['#f1f5f9','#475569'];

  // Construir y abrir modal
  document.getElementById('formModal')?.remove();
  const m = document.createElement('div');
  m.id = 'formModal';
  m.style.cssText = `position:fixed;inset:0;z-index:2000;background:rgba(15,23,42,.55);
    display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease`;
  m.innerHTML = `
    <div style="background:white;border-radius:24px;width:100%;max-width:560px;
      box-shadow:0 25px 50px rgba(0,0,0,.18);animation:slideUp .25s ease;overflow:hidden">

      <!-- Cabecera del modal -->
      <div style="padding:20px 24px;border-bottom:1px solid #f1f5f9;
        display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:40px;height:40px;border-radius:12px;background:#e0e7ff;
            display:flex;align-items:center;justify-content:center">
            <i class="fas fa-file-alt" style="color:#4f46e5;font-size:1rem"></i>
          </div>
          <div>
            <h3 style="font-size:1rem;font-weight:700;color:#0f172a">Solicitud #${solicitudId}</h3>
            <p style="font-size:.75rem;color:#94a3b8;margin-top:1px">
              ${new Date(sol?.fechasolicitud).toLocaleDateString('es-DO', {day:'2-digit',month:'long',year:'numeric'})}
            </p>
          </div>
        </div>
        <button id="closeDetalle" style="background:none;border:none;font-size:1.4rem;
          color:#94a3b8;cursor:pointer;line-height:1">&times;</button>
      </div>

      <!-- Info solicitante -->
      <div style="padding:16px 24px;background:#f8fafc;border-bottom:1px solid #f1f5f9;
        display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
        <div>
          <div style="font-size:.68rem;color:#94a3b8;font-weight:600;text-transform:uppercase;
            letter-spacing:.05em;margin-bottom:3px">Solicitante</div>
          <div style="font-weight:600;font-size:.85rem;color:#0f172a">${solicitante}</div>
        </div>
        <div>
          <div style="font-size:.68rem;color:#94a3b8;font-weight:600;text-transform:uppercase;
            letter-spacing:.05em;margin-bottom:3px">Departamento</div>
          <div style="font-weight:600;font-size:.85rem;color:#0f172a">${departamento}</div>
        </div>
        <div>
          <div style="font-size:.68rem;color:#94a3b8;font-weight:600;text-transform:uppercase;
            letter-spacing:.05em;margin-bottom:3px">Prioridad</div>
          <span style="font-size:.78rem;font-weight:700;padding:3px 10px;border-radius:20px;
            background:${pBg};color:${pCl}">${sol?.prioridad ?? '—'}</span>
        </div>
      </div>

      <!-- Estado -->
      <div style="padding:12px 24px;border-bottom:1px solid #f1f5f9;
        display:flex;align-items:center;gap:10px">
        <span style="font-size:.78rem;color:#64748b;font-weight:500">Estado actual:</span>
        <span style="font-size:.82rem;font-weight:700;padding:4px 12px;border-radius:20px;
          background:${eBg};color:${eCl}">${sol?.estado ?? '—'}</span>
        ${isAdmin() ? `<button class="aprobar-sol" data-id="${solicitudId}"
          style="margin-left:auto;padding:5px 12px;font-size:.78rem;border:1.5px solid #3b82f6;
          border-radius:20px;background:white;color:#3b82f6;cursor:pointer;font-weight:600">
          <i class="fas fa-tasks" style="margin-right:4px"></i>Cambiar estado</button>` : ''}
      </div>

      <!-- Lista de productos -->
      <div style="padding:20px 24px;max-height:50vh;overflow-y:auto">
        <div style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;
          letter-spacing:.05em;margin-bottom:12px">
          <i class="fas fa-boxes" style="margin-right:6px;color:#6366f1"></i>Productos solicitados
        </div>
        ${productosHTML}
      </div>

      <!-- Footer -->
      <div style="padding:14px 24px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:10px">
        ${isAdmin() ? `
          <button class="aprobar-sol" data-id="${solicitudId}"
            style="padding:8px 18px;background:#3b82f6;color:white;border:none;
            border-radius:10px;cursor:pointer;font-weight:600;font-size:.85rem">
            <i class="fas fa-tasks" style="margin-right:6px"></i>Cambiar Estado
          </button>` : ''}
        <button id="cerrarDetalle" style="padding:8px 18px;background:#f1f5f9;color:#475569;
          border:none;border-radius:10px;cursor:pointer;font-weight:600;font-size:.85rem">
          Cerrar
        </button>
      </div>
    </div>`;

  document.body.appendChild(m);
  document.getElementById('closeDetalle').addEventListener('click', () => m.remove());
  document.getElementById('cerrarDetalle').addEventListener('click', () => m.remove());
  m.addEventListener('click', e => { if (e.target === m) m.remove(); });

  // Botones "Cambiar estado" dentro del modal de detalle
  m.querySelectorAll('.aprobar-sol').forEach(btn =>
    btn.addEventListener('click', () => {
      m.remove();
      abrirModalCambioEstado(solicitudId);
    }));
}

// ── Mini-modal de cambio de estado (reutilizable) ─────────────────
function abrirModalCambioEstado(solicitudId) {
  document.getElementById('formModal')?.remove();
  const cm = document.createElement('div');
  cm.id = 'formModal';
  cm.style.cssText = `position:fixed;inset:0;z-index:2000;background:rgba(15,23,42,.55);
    display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease`;
  cm.innerHTML = `
    <div style="background:white;border-radius:20px;padding:28px;width:100%;max-width:360px;
      box-shadow:0 20px 40px rgba(0,0,0,.15);animation:slideUp .2s ease">
      <h3 style="margin-bottom:6px;font-size:1rem;font-weight:700;color:#0f172a">
        Cambiar estado
      </h3>
      <p style="font-size:.8rem;color:#94a3b8;margin-bottom:18px">Solicitud #${solicitudId}</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${['Pendiente','Aprobada','Rechazada','Despachada'].map(e => {
          const colores = {
            Pendiente:  ['#fffbeb','#b45309','#fef3c7'],
            Aprobada:   ['#f0fdf4','#15803d','#dcfce7'],
            Rechazada:  ['#fef2f2','#b91c1c','#fee2e2'],
            Despachada: ['#eff6ff','#1d4ed8','#dbeafe'],
          };
          const [bg, cl, border] = colores[e] ?? ['#f8fafc','#475569','#e2e8f0'];
          return `<button class="cambiar-estado-btn" data-estado="${e}"
            style="padding:12px 16px;border-radius:12px;border:2px solid ${border};
            background:${bg};cursor:pointer;font-weight:600;font-size:.9rem;
            display:flex;align-items:center;gap:10px;transition:.15s;color:${cl}">
            <span style="width:8px;height:8px;border-radius:50%;background:${cl};flex-shrink:0"></span>
            ${e}
          </button>`;
        }).join('')}
      </div>
      <button id="closeCambioEstado" style="width:100%;margin-top:14px;padding:10px;border:none;
        border-radius:10px;background:#f1f5f9;cursor:pointer;font-weight:500;color:#475569">
        Cancelar
      </button>
    </div>`;
  document.body.appendChild(cm);

  document.getElementById('closeCambioEstado').addEventListener('click', () => cm.remove());
  cm.addEventListener('click', e => { if (e.target === cm) cm.remove(); });

  cm.querySelectorAll('.cambiar-estado-btn').forEach(b => {
    b.addEventListener('mouseenter', () => b.style.transform = 'translateX(4px)');
    b.addEventListener('mouseleave', () => b.style.transform = '');
    b.addEventListener('click', async () => {
      b.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
      b.disabled = true;
      const { error } = await db.from('solicitudes')
        .update({ estado: b.dataset.estado })
        .eq('idsolicitud', solicitudId);
      cm.remove();
      if (error) showToast('Error al actualizar estado', 'error');
      else { showToast(`Estado cambiado a "${b.dataset.estado}"`); renderSolicitudes(); }
    });
  });
}

async function renderSolicitudes() {
  showLoader(true);
  try {
    const [solicitudes, stats] = await Promise.all([
      fetchSolicitudes(),
      fetchDashboardStats()
    ]);

    const miniStats = [
      { label:'Pendiente',  val:stats.pendientes,  color:'#f59e0b', bg:'#fffbeb', icon:'fa-clock' },
      { label:'Aprobada',   val:stats.aprobadas,   color:'#22c55e', bg:'#f0fdf4', icon:'fa-check' },
      { label:'Rechazada',  val:stats.rechazadas,  color:'#ef4444', bg:'#fef2f2', icon:'fa-times' },
      { label:'Despachada', val:stats.despachadas, color:'#3b82f6', bg:'#eff6ff', icon:'fa-truck' },
    ].map(c => `
      <div style="background:white;border-radius:16px;padding:16px 20px;display:flex;align-items:center;
        gap:14px;box-shadow:0 1px 3px rgba(0,0,0,.05);border:1px solid #f1f5f9;cursor:pointer"
        class="mini-stat-filtro" data-val="${c.label}">
        <div style="width:40px;height:40px;border-radius:10px;background:${c.bg};flex-shrink:0;
          display:flex;align-items:center;justify-content:center">
          <i class="fas ${c.icon}" style="color:${c.color}"></i>
        </div>
        <div>
          <div style="font-size:1.4rem;font-weight:700;color:${c.color};line-height:1">${c.val}</div>
          <div style="font-size:.72rem;color:#94a3b8;margin-top:2px">${c.label}</div>
        </div>
      </div>`).join('');

    document.getElementById('dynamicContent').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font-size:1.5rem;font-weight:700;color:#0f172a">Solicitudes de Insumos</h2>
          <p style="color:#64748b;font-size:.85rem;margin-top:2px">Gestiona todas las solicitudes de materiales</p>
        </div>
        <div style="display:flex;gap:10px">
          <button id="exportarSolBtn" class="btn-secondary" style="padding:10px 18px">
            <i class="fas fa-file-excel"></i> Exportar Excel
          </button>
          ${!isAlmacen() ? `<button id="nuevaSolBtn" class="btn-primary" style="padding:10px 20px">
            <i class="fas fa-plus"></i> Nueva Solicitud</button>` : ''}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
        ${miniStats}
      </div>

      <div style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.05)">
        <div style="padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <i class="fas fa-filter" style="color:#94a3b8;font-size:.85rem"></i>
          <span style="font-size:.82rem;color:#64748b;font-weight:500">Filtrar:</span>
          ${['Todos','Pendiente','Aprobada','Rechazada','Despachada'].map((e,i) =>
            `<button class="filtro-sol" data-val="${e}"
              style="padding:5px 14px;font-size:.8rem;border-radius:40px;border:1.5px solid;
              cursor:pointer;font-weight:600;transition:.15s;
              ${i===0
                ? 'background:#3b82f6;color:white;border-color:#3b82f6'
                : 'background:white;color:#475569;border-color:#e2e8f0'}">${e}</button>`).join('')}
        </div>
        <table class="data-table sol-table" style="margin:0">
          <thead><tr>
            <th>ID</th><th>Solicitante</th><th>Fecha</th>
            <th>Prioridad</th><th>Estado</th><th>Acciones</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>`;

    renderFilas(solicitudes);

    document.getElementById('exportarSolBtn')?.addEventListener('click', () => exportarSolicitudes());
    document.getElementById('nuevaSolBtn')?.addEventListener('click', () => abrirFormSolicitud());

    // Mini stats como filtros clickeables
    document.querySelectorAll('.mini-stat-filtro').forEach(card => {
      card.addEventListener('click', async () => {
        document.querySelectorAll('.filtro-sol').forEach(b => {
          b.style.background='white'; b.style.color='#475569'; b.style.borderColor='#e2e8f0';
        });
        const btn = [...document.querySelectorAll('.filtro-sol')].find(b=>b.dataset.val===card.dataset.val);
        if (btn) { btn.style.background='#3b82f6'; btn.style.color='white'; btn.style.borderColor='#3b82f6'; }
        showLoader(true);
        try { renderFilas(await fetchSolicitudes(card.dataset.val)); } finally { showLoader(false); }
      });
    });

    document.querySelectorAll('.filtro-sol').forEach(btn =>
      btn.addEventListener('click', async () => {
        document.querySelectorAll('.filtro-sol').forEach(b => {
          b.style.background='white'; b.style.color='#475569'; b.style.borderColor='#e2e8f0';
        });
        btn.style.background='#3b82f6'; btn.style.color='white'; btn.style.borderColor='#3b82f6';
        showLoader(true);
        try { renderFilas(await fetchSolicitudes(btn.dataset.val)); } finally { showLoader(false); }
      }));
  } catch(e) { console.error(e); showError('Error cargando solicitudes.'); }
  finally    { showLoader(false); }
}

// ─── FORMULARIO SOLICITUD ────────────────────────────────────────
async function abrirFormSolicitud(s = null) {
  const productos   = await fetchProductosActivos();
  const esEdicion   = !!s;
  let itemsSel      = [];   // { uid, idproducto, nombre, stockactual, cantidad }

  const body = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">
      <div style="${fGS}">
        <label style="${fLS}">Prioridad <span style="color:#ef4444">*</span></label>
        <div style="display:flex;gap:8px">
          ${[['Alta','#ef4444','#fef2f2'],['Media','#d97706','#fffbeb'],['Baja','#16a34a','#f0fdf4']].map(([v,cl,bg])=>`
            <label style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;
              padding:8px 6px;border:2px solid ${s?.prioridad===v?cl:'#e2e8f0'};border-radius:10px;
              cursor:pointer;background:${s?.prioridad===v?bg:'white'};font-weight:600;font-size:.82rem;
              transition:.15s" class="prio-label">
              <input type="radio" name="prio" value="${v}" ${s?.prioridad===v?'checked':''}
                style="accent-color:${cl};width:14px;height:14px"> ${v}
            </label>`).join('')}
        </div>
        <input type="hidden" id="f_prioridad" value="${s?.prioridad??''}">
      </div>
      ${esEdicion && isAdmin() ? `
        <div style="${fGS}">
          <label style="${fLS}">Estado <span style="color:#ef4444">*</span></label>
          <select id="f_estado" style="${fIS}background:white">
            ${['Pendiente','Aprobada','Rechazada','Despachada'].map(e=>
              `<option value="${e}" ${s?.estado===e?'selected':''}>${e}</option>`).join('')}
          </select>
        </div>` : '<div></div>'}
      <div style="grid-column:1/-1">${fta('f_comentarios','Comentarios (opcional)','Observaciones...',false,s?.comentarios??'')}</div>
    </div>

    ${!esEdicion ? `
    <hr style="border:none;border-top:1px solid #f1f5f9;margin:4px 0 18px">
    <div style="${fGS}">
      <label style="${fLS}">Buscar productos <span style="color:#ef4444">*</span></label>
      <div style="position:relative">
        <i class="fas fa-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#94a3b8;pointer-events:none"></i>
        <input id="prod-search" type="text" placeholder="Escribe para buscar en el inventario..."
          autocomplete="off" style="${fIS}padding-left:36px">
      </div>
      <div id="prod-dropdown" style="display:none;border:1.5px solid #e2e8f0;border-radius:12px;
        background:white;margin-top:4px;max-height:190px;overflow-y:auto;
        box-shadow:0 8px 16px rgba(0,0,0,.08);position:relative;z-index:10"></div>
    </div>
    <div id="items-sel" style="display:flex;flex-direction:column;gap:8px"></div>
    ` : ''}`;

  openFormModal(esEdicion ? 'Editar Solicitud' : 'Nueva Solicitud', body, async () => {
    if (!getVal('f_prioridad')) { showToast('Selecciona una prioridad','warning'); throw new Error(); }

    if (esEdicion) {
      const payload = { prioridad:getVal('f_prioridad'), comentarios:getVal('f_comentarios') };
      if (isAdmin() && document.getElementById('f_estado')) payload.estado = getVal('f_estado');
      const { error } = await db.from('solicitudes').update(payload).eq('idsolicitud', s.idsolicitud);
      if (error) { showToast('Error: '+error.message,'error'); throw error; }
      showToast('Solicitud actualizada');
    } else {
      if (!itemsSel.length) { showToast('Agrega al menos un producto','warning'); throw new Error(); }
      for (const it of itemsSel) {
        if (it.cantidad < 1)              { showToast(`Cantidad inválida en "${it.nombre}"`, 'warning'); throw new Error(); }
        if (it.cantidad > it.stockactual) { showToast(`Stock insuficiente: "${it.nombre}" (${it.stockactual} disponibles)`, 'warning'); throw new Error(); }
      }
      const { data:sol, error:e1 } = await db.from('solicitudes').insert({
        idusuario:currentUser.idusuario, fechasolicitud:new Date().toISOString(),
        estado:'Pendiente', prioridad:getVal('f_prioridad'), comentarios:getVal('f_comentarios')
      }).select();
      if (e1) { showToast('Error: '+e1.message,'error'); throw e1; }
      const { error:e2 } = await db.from('solicituddetalle').insert(
        itemsSel.map(it => ({ idsolicitud:sol[0].idsolicitud, idproducto:it.idproducto, cantidad:it.cantidad }))
      );
      if (e2) showToast('Advertencia en detalle: '+e2.message,'warning');
      else showToast('Solicitud creada correctamente');
    }
    renderSolicitudes();
  }, '620px');

  // ── interactividad post-render ────────────────────────────────
  setTimeout(() => {
    // Prioridad radios
    document.querySelectorAll('[name="prio"]').forEach(r => {
      if (r.checked) document.getElementById('f_prioridad').value = r.value;
      r.addEventListener('change', () => {
        document.getElementById('f_prioridad').value = r.value;
        const colorMap = { Alta:['#ef4444','#fef2f2'], Media:['#d97706','#fffbeb'], Baja:['#16a34a','#f0fdf4'] };
        document.querySelectorAll('.prio-label').forEach(lbl => {
          const inp = lbl.querySelector('input');
          const [cl,bg] = colorMap[inp.value];
          lbl.style.borderColor = inp.checked ? cl : '#e2e8f0';
          lbl.style.background  = inp.checked ? bg : 'white';
        });
      });
    });

    if (esEdicion) return;

    // Render lista de ítems seleccionados
    const renderItems = () => {
      const c = document.getElementById('items-sel');
      if (!c) return;
      if (!itemsSel.length) {
        c.innerHTML = `<div style="text-align:center;padding:20px;color:#94a3b8;font-size:.85rem;
          border:2px dashed #e2e8f0;border-radius:12px">
          <i class="fas fa-box-open" style="font-size:1.5rem;display:block;margin-bottom:6px"></i>
          Sin productos agregados — usa el buscador arriba</div>`;
        return;
      }
      c.innerHTML = itemsSel.map(it => `
        <div style="display:grid;grid-template-columns:1fr 120px 36px;gap:8px;align-items:center;
          padding:10px 14px;background:#f8fafc;border-radius:12px;border:1.5px solid #e2e8f0">
          <div>
            <div style="font-weight:600;font-size:.88rem;color:#1e293b">${it.nombre}</div>
            <div style="font-size:.73rem;color:#64748b">Disponible: <strong>${it.stockactual}</strong></div>
          </div>
          <div style="display:flex;align-items:center;gap:4px">
            <button onclick="window._chgQty(${it.uid},-1)"
              style="width:26px;height:26px;border:1.5px solid #e2e8f0;border-radius:6px;
              background:white;cursor:pointer;font-weight:700;font-size:.9rem">−</button>
            <input type="number" min="1" max="${it.stockactual}" value="${it.cantidad}"
              onchange="window._setQty(${it.uid},this.value)"
              style="width:42px;text-align:center;border:1.5px solid #e2e8f0;border-radius:6px;
              padding:3px;font-size:.85rem;font-weight:600">
            <button onclick="window._chgQty(${it.uid},1)"
              style="width:26px;height:26px;border:1.5px solid #e2e8f0;border-radius:6px;
              background:white;cursor:pointer;font-weight:700;font-size:.9rem">+</button>
          </div>
          <button onclick="window._rmItem(${it.uid})"
            style="width:32px;height:32px;border:none;border-radius:8px;
            background:#fee2e2;cursor:pointer;color:#b91c1c">
            <i class="fas fa-trash" style="font-size:.8rem"></i>
          </button>
        </div>`).join('');
    };

    window._chgQty = (uid, d) => {
      const it = itemsSel.find(i=>i.uid===uid);
      if (it) { it.cantidad = Math.max(1, Math.min(it.stockactual, it.cantidad+d)); renderItems(); }
    };
    window._setQty = (uid, v) => {
      const it = itemsSel.find(i=>i.uid===uid);
      if (it) { it.cantidad = Math.max(1, Math.min(it.stockactual, parseInt(v)||1)); renderItems(); }
    };
    window._rmItem = uid => { itemsSel = itemsSel.filter(i=>i.uid!==uid); renderItems(); };

    renderItems();

    // Buscador con dropdown
    const inp = document.getElementById('prod-search');
    const dd  = document.getElementById('prod-dropdown');

    const showDD = (q) => {
      const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(q.toLowerCase().trim()) &&
        !itemsSel.find(i=>i.idproducto===p.idproducto));
      if (!filtrados.length || !q.trim()) { dd.style.display='none'; return; }
      dd.style.display = 'block';
      dd.innerHTML = filtrados.map(p => `
        <div class="dd-opt" data-id="${p.idproducto}"
          style="padding:10px 14px;cursor:pointer;display:flex;justify-content:space-between;
          align-items:center;border-bottom:1px solid #f1f5f9;transition:background .1s">
          <div>
            <div style="font-weight:600;font-size:.88rem">${p.nombre}</div>
            <div style="font-size:.73rem;color:#64748b">Stock: ${p.stockactual} unidades</div>
          </div>
          <span style="font-size:.72rem;font-weight:700;padding:2px 8px;border-radius:16px;
            background:${p.stockactual>0?'#dcfce7':'#fee2e2'};color:${p.stockactual>0?'#15803d':'#b91c1c'}">
            ${p.stockactual>0?'Disponible':'Agotado'}</span>
        </div>`).join('');
      dd.querySelectorAll('.dd-opt').forEach(opt => {
        opt.addEventListener('mouseenter', () => opt.style.background='#f8fafc');
        opt.addEventListener('mouseleave', () => opt.style.background='');
        opt.addEventListener('mousedown', e => { e.preventDefault();
          const p = productos.find(x=>x.idproducto==opt.dataset.id);
          if (!p || p.stockactual<1) { showToast('Sin stock disponible','warning'); return; }
          itemsSel.push({ uid:Date.now(), idproducto:p.idproducto, nombre:p.nombre, stockactual:p.stockactual, cantidad:1 });
          inp.value=''; dd.style.display='none'; renderItems();
        });
      });
    };

    inp.addEventListener('input',  e => showDD(e.target.value));
    inp.addEventListener('focus',  e => { if (e.target.value) showDD(e.target.value); });
    document.addEventListener('click', e => { if (!dd.contains(e.target)&&e.target!==inp) dd.style.display='none'; });
  }, 60);
}

// ══════════════════════════════════════════════════════════════════
//  SECCIÓN: INVENTARIO
// ══════════════════════════════════════════════════════════════════
async function renderInventario() {
  if (!isAdmin() && !isAlmacen()) { showError('Sin permiso para acceder a esta sección.'); return; }
  showLoader(true);
  try {
    const productos = await fetchInventario();
    const total     = productos.length;
    const conAlerta = productos.filter(p => p.stockactual < p.stockminimo).length;
    const criticos  = productos.filter(p => p.stockactual === 0).length;
    const soloAdmin = isAdmin();

    // Mini stats de inventario
    const invStats = [
      { label:'Total Productos', val:total,     color:'#3b82f6', bg:'#eff6ff', icon:'fa-boxes' },
      { label:'Con Alerta',      val:conAlerta, color:'#f59e0b', bg:'#fffbeb', icon:'fa-exclamation-triangle' },
      { label:'Críticos',        val:criticos,  color:'#ef4444', bg:'#fef2f2', icon:'fa-times-circle' },
    ].map(c => `
      <div class="stat-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div><h3>${c.label}</h3><div class="stat-number" style="color:${c.color}">${c.val}</div></div>
          <div style="width:44px;height:44px;border-radius:12px;background:${c.bg};
            display:flex;align-items:center;justify-content:center">
            <i class="fas ${c.icon}" style="color:${c.color};font-size:1.1rem"></i>
          </div>
        </div>
      </div>`).join('');

    let rows = '';
    productos.forEach(p => {
      const cr  = p.stockactual < p.stockminimo;
      const pct = p.stockminimo > 0 ? Math.min(100, Math.round((p.stockactual/p.stockminimo)*100)) : 100;
      rows += `<tr>
        <td>
          <div style="font-weight:600;font-size:.9rem">${p.nombre}</div>
          ${p.descripcion ? `<div style="font-size:.73rem;color:#94a3b8;margin-top:2px">${p.descripcion}</div>` : ''}
        </td>
        <td>
          <div style="font-weight:700;font-size:.95rem;color:${cr?'#ef4444':'#0f172a'}">${p.stockactual}</div>
          <div style="height:4px;background:#e2e8f0;border-radius:4px;width:60px;margin-top:4px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${cr?'#ef4444':pct<60?'#f97316':'#22c55e'};border-radius:4px"></div>
          </div>
        </td>
        <td style="color:#64748b">${p.stockminimo}</td>
        <td><span class="badge ${cr?'badge-rechazado':'badge-aprobado'}">${cr?'Crítico':'Normal'}</span></td>
        <td><span class="badge ${p.activo?'badge-aprobado':'badge-pendiente'}">${p.activo?'Activo':'Inactivo'}</span></td>
        <td style="display:flex;gap:6px">
          ${soloAdmin ? `
            <button class="btn-secondary editar-prod" data-id="${p.idproducto}"
              style="padding:5px 10px;font-size:.8rem" title="Editar">
              <i class="fas fa-edit"></i></button>
            <button class="btn-secondary eliminar-prod" data-id="${p.idproducto}"
              style="padding:5px 10px;font-size:.8rem;color:#ef4444" title="Eliminar">
              <i class="fas fa-trash"></i></button>
          ` : `<span style="font-size:.75rem;color:#94a3b8;font-style:italic">Solo lectura</span>`}
        </td></tr>`;
    });

    document.getElementById('dynamicContent').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font-size:1.5rem;font-weight:700;color:#0f172a">Gestión de Inventario</h2>
          <p style="color:#64748b;font-size:.85rem;margin-top:2px">Control y seguimiento de productos en almacén</p>
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          <button id="exportarInvBtn" class="btn-secondary" style="padding:10px 18px">
            <i class="fas fa-file-excel"></i> Exportar Excel
          </button>
          ${soloAdmin ? `<button id="nuevoProductoBtn" class="btn-primary" style="padding:10px 20px">
            <i class="fas fa-plus"></i> Agregar Producto</button>` : `
            <span style="background:#f1f5f9;color:#64748b;padding:8px 16px;border-radius:40px;
              font-size:.82rem;font-weight:600"><i class="fas fa-eye" style="margin-right:6px"></i>Modo visualización</span>`}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px">${invStats}</div>
      <div style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.05)">
        <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px">
          <input id="buscar-prod" type="text" placeholder="Buscar producto..."
            style="padding:7px 12px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:.85rem;
            font-family:inherit;outline:none;width:220px;transition:.2s">
          <span style="font-size:.8rem;color:#94a3b8">${total} producto${total!==1?'s':''}</span>
        </div>
        <table class="data-table">
          <thead><tr><th>Producto</th><th>Stock Actual</th><th>Stock Mínimo</th>
            <th>Estado</th><th>Activo</th><th>Acciones</th></tr></thead>
          <tbody id="inv-tbody">${rows||'<tr><td colspan="6" style="text-align:center;color:#64748b;padding:32px">Sin productos</td></tr>'}</tbody>
        </table>
      </div>`;

    document.getElementById('exportarInvBtn')?.addEventListener('click', () => exportarInventario());

    // Buscador en tiempo real
    document.getElementById('buscar-prod')?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#inv-tbody tr').forEach(tr => {
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });

    if (soloAdmin) {
      document.getElementById('nuevoProductoBtn').addEventListener('click', () => abrirFormProducto());
      document.querySelectorAll('.editar-prod').forEach(btn => btn.addEventListener('click', async () => {
        const { data } = await db.from('productos').select('*').eq('idproducto', btn.dataset.id).single();
        if (data) abrirFormProducto(data);
      }));
      document.querySelectorAll('.eliminar-prod').forEach(btn => btn.addEventListener('click', () =>
        showModal('Eliminar producto','¿Eliminar este producto del inventario?', async () => {
          const { error } = await db.from('productos').delete().eq('idproducto', btn.dataset.id);
          if (error) showToast('Error: '+error.message,'error');
          else { showToast('Producto eliminado','warning'); renderInventario(); }
        })));
    }
  } catch(e) { console.error(e); showError('Error cargando inventario.'); }
  finally    { showLoader(false); }
}

async function abrirFormProducto(p = null) {
  const es = !!p;
  const body = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">
      <div style="grid-column:1/-1">${fi('f_nombre','Nombre del producto','text','Ej: Papel A4 75g',true,p?.nombre??'')}</div>
      <div style="grid-column:1/-1">${fta('f_desc','Descripción','Descripción breve...',false,p?.descripcion??'')}</div>
      ${fi('f_stock','Stock actual','number','0',true,p?.stockactual??'')}
      ${fi('f_stockmin','Stock mínimo','number','0',true,p?.stockminimo??'')}
    </div>
    <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#f8fafc;border-radius:10px">
      <input type="checkbox" id="f_activo" ${p?.activo!==false?'checked':''} style="width:18px;height:18px;accent-color:#3b82f6">
      <label for="f_activo" style="font-size:.9rem;font-weight:500;cursor:pointer">Producto activo</label>
    </div>`;
  openFormModal(es?'Editar Producto':'Agregar Producto', body, async () => {
    if (!req(['f_nombre','Nombre'],['f_stock','Stock actual'],['f_stockmin','Stock mínimo'])) throw new Error();
    const sa = getInt('f_stock'), sm = getInt('f_stockmin');
    if (sa<0||sm<0) { showToast('El stock no puede ser negativo','warning'); throw new Error(); }
    const payload = { nombre:getVal('f_nombre'), descripcion:getVal('f_desc'), stockactual:sa, stockminimo:sm, activo:getCheck('f_activo') };
    const { error } = es
      ? await db.from('productos').update(payload).eq('idproducto', p.idproducto)
      : await db.from('productos').insert(payload);
    if (error) { showToast('Error: '+error.message,'error'); throw error; }
    showToast(es?'Producto actualizado':'Producto agregado');
    renderInventario();
  });
}

// ══════════════════════════════════════════════════════════════════
//  SECCIÓN: DESPACHO
// ══════════════════════════════════════════════════════════════════
async function renderDespacho() {
  if (!isAdmin() && !isAlmacen()) { showError('Sin permiso.'); return; }
  showLoader(true);
  try {
    const [pendientes, despachadas] = await Promise.all([
      fetchSolicitudesParaDespachar(),
      (async () => {
        const today = new Date(); today.setHours(0,0,0,0);
        const { data } = await db.from('despachos')
          .select('iddespacho')
          .gte('fechadespacho', today.toISOString());
        return data?.length ?? 0;
      })(),
    ]);

    const totalDesp = await (async () => {
      const { count } = await db.from('despachos').select('*', {count:'exact', head:true});
      return count ?? 0;
    })();

    const soloAdmin = isAdmin();

    const despachoStats = [
      { label:'Pendientes de Despacho', val:pendientes.length, color:'#f59e0b', bg:'#fffbeb', icon:'fa-clock' },
      { label:'Despachados Hoy',        val:despachadas,       color:'#22c55e', bg:'#f0fdf4', icon:'fa-check' },
      { label:'Total Despachados',      val:totalDesp,         color:'#3b82f6', bg:'#eff6ff', icon:'fa-truck' },
    ].map(c => `
      <div class="stat-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div><h3>${c.label}</h3><div class="stat-number" style="color:${c.color}">${c.val}</div></div>
          <div style="width:44px;height:44px;border-radius:12px;background:${c.bg};
            display:flex;align-items:center;justify-content:center">
            <i class="fas ${c.icon}" style="color:${c.color};font-size:1.1rem"></i>
          </div>
        </div>
      </div>`).join('');

    let cards = '';
    pendientes.forEach(s => {
      const usr  = s.usuarios?.nombre ?? 'N/A';
      const dept = s.usuarios?.departamentos?.nombre ?? 'N/A';
      cards += `
        <div style="background:white;border-radius:16px;padding:20px;border:1.5px solid #e2e8f0;
          transition:.2s;cursor:pointer" class="desp-card"
          onmouseenter="this.style.borderColor='#3b82f6';this.style.boxShadow='0 4px 12px rgba(59,130,246,.1)'"
          onmouseleave="this.style.borderColor='#e2e8f0';this.style.boxShadow=''">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div>
              <div style="font-weight:700;font-size:.95rem;color:#0f172a">Solicitud #${s.idsolicitud}</div>
              <div style="font-size:.75rem;color:#94a3b8;margin-top:2px">${new Date(s.fechasolicitud).toLocaleDateString('es-DO')}</div>
            </div>
            <span class="badge badge-aprobado">Aprobada</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;
            padding:10px;background:#f8fafc;border-radius:10px">
            <div style="font-size:.78rem">
              <div style="color:#94a3b8;margin-bottom:2px"><i class="fas fa-user" style="margin-right:4px"></i>Solicitante</div>
              <div style="font-weight:600;color:#1e293b">${usr}</div>
            </div>
            <div style="font-size:.78rem">
              <div style="color:#94a3b8;margin-bottom:2px"><i class="fas fa-building" style="margin-right:4px"></i>Departamento</div>
              <div style="font-weight:600;color:#1e293b">${dept}</div>
            </div>
          </div>
          ${soloAdmin ? `
            <button class="btn-primary despachar-btn" data-id="${s.idsolicitud}"
              style="width:100%;padding:10px">
              <i class="fas fa-truck"></i> Confirmar Despacho
            </button>` : isAlmacen() ? `
            <button class="btn-secondary imprimir-sol-btn" data-id="${s.idsolicitud}"
              style="width:100%;padding:9px;font-size:.85rem">
              <i class="fas fa-print"></i> Ver Comprobante
            </button>` : `
            <div style="text-align:center;padding:8px;background:#f1f5f9;border-radius:8px;
              font-size:.8rem;color:#64748b;font-weight:500">
              <i class="fas fa-eye" style="margin-right:6px"></i>Pendiente de despacho por Administrador
            </div>`}
        </div>`;
    });

    document.getElementById('dynamicContent').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font-size:1.5rem;font-weight:700;color:#0f172a">Módulo de Despacho</h2>
          <p style="color:#64748b;font-size:.85rem;margin-top:2px">Gestiona las entregas de insumos aprobados</p>
        </div>
        ${!soloAdmin ? `<span style="background:#f1f5f9;color:#64748b;padding:8px 16px;border-radius:40px;
          font-size:.82rem;font-weight:600"><i class="fas fa-eye" style="margin-right:6px"></i>Modo visualización</span>` : ''}
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px">${despachoStats}</div>
      <div>
        <h3 style="font-size:.95rem;font-weight:700;color:#475569;margin-bottom:12px;
          text-transform:uppercase;letter-spacing:.05em">
          Solicitudes listas para despachar
        </h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">
          ${cards || `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#94a3b8;
            background:white;border-radius:16px;border:2px dashed #e2e8f0">
            <i class="fas fa-truck" style="font-size:2rem;display:block;margin-bottom:10px"></i>
            No hay solicitudes aprobadas pendientes de despacho
          </div>`}
        </div>
      </div>`;

    // Botón comprobante para Almacén (solo lectura)
    document.querySelectorAll('.imprimir-sol-btn').forEach(btn =>
      btn.addEventListener('click', () => imprimirComprobanteSolicitud(btn.dataset.id)));

    if (soloAdmin) {
      document.querySelectorAll('.despachar-btn').forEach(btn =>
        btn.addEventListener('click', () =>
          showModal('Confirmar Despacho', `¿Registrar despacho para solicitud #${btn.dataset.id}?`, async () => {
            showLoader(true);
            try {
              const resultado = await registrarDespacho(btn.dataset.id, []);
              showToast('Despacho registrado correctamente');
              renderDespacho();
              // Ofrecer imprimir comprobante
              setTimeout(() => {
                const sid = btn.dataset.id;
                showModal(
                  '¿Imprimir comprobante?',
                  `El despacho #${resultado?.iddespacho ?? '—'} fue registrado. ¿Deseas imprimir el comprobante?`,
                  () => imprimirComprobanteDespacho(resultado?.iddespacho, sid)
                );
              }, 400);
            } catch(e) { showToast('Error al despachar','error'); }
            finally    { showLoader(false); }
          })));
    }
  } catch(e) { console.error(e); showError('Error cargando despacho.'); }
  finally    { showLoader(false); }
}

// ══════════════════════════════════════════════════════════════════
//  SECCIÓN: USUARIOS
// ══════════════════════════════════════════════════════════════════
async function renderUsuarios() {
  if (!isAdmin()) { showError('Solo los administradores pueden gestionar usuarios.'); return; }
  showLoader(true);
  try {
    const [usuarios, roles] = await Promise.all([fetchUsuarios(), fetchRoles()]);

    // Stats por rol
    const roleColors = {
      'Administrador': ['#8b5cf6','#f5f3ff'],
      'Solicitante':   ['#3b82f6','#eff6ff'],
      'Almacén':       ['#22c55e','#f0fdf4'],
    };
    const rolCounts = {};
    usuarios.forEach(u => {
      const r = u.roles?.nombrerol ?? 'Sin rol';
      rolCounts[r] = (rolCounts[r]??0) + 1;
    });

    const rolStats = `
      <div class="stat-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div><h3>Total Usuarios</h3><div class="stat-number">${usuarios.length}</div></div>
          <div style="width:44px;height:44px;border-radius:12px;background:#eff6ff;
            display:flex;align-items:center;justify-content:center">
            <i class="fas fa-users" style="color:#3b82f6;font-size:1.1rem"></i>
          </div>
        </div>
      </div>
      ${Object.entries(rolCounts).map(([rol,cnt]) => {
        const [cl,bg] = roleColors[rol] ?? ['#64748b','#f8fafc'];
        return `<div class="stat-card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div><h3>${rol}</h3><div class="stat-number" style="color:${cl}">${cnt}</div></div>
            <div style="width:44px;height:44px;border-radius:12px;background:${bg};
              display:flex;align-items:center;justify-content:center">
              <i class="fas fa-user-shield" style="color:${cl};font-size:1.1rem"></i>
            </div>
          </div>
        </div>`;}).join('')}`;

    // Filtros por rol
    const rolesUnicos = ['Todos', ...new Set(usuarios.map(u => u.roles?.nombrerol ?? 'Sin rol'))];
    const filtrosRol = rolesUnicos.map((r,i) =>
      `<button class="filtro-usr" data-rol="${r}"
        style="padding:5px 14px;font-size:.8rem;border-radius:40px;border:1.5px solid;
        cursor:pointer;font-weight:600;transition:.15s;
        ${i===0?'background:#3b82f6;color:white;border-color:#3b82f6':'background:white;color:#475569;border-color:#e2e8f0'}">
        ${r}</button>`).join('');

    const buildRows = (lista) => lista.map(u => {
      const [cl,bg] = roleColors[u.roles?.nombrerol] ?? ['#64748b','#f8fafc'];
      const initials = u.nombre.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
      return `<tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;border-radius:50%;background:#3b82f6;flex-shrink:0;
              display:flex;align-items:center;justify-content:center;color:white;
              font-weight:700;font-size:.8rem">${initials}</div>
            <div>
              <div style="font-weight:600;font-size:.9rem">${u.nombre}</div>
              <div style="font-size:.73rem;color:#94a3b8">ID: ${u.idusuario}</div>
            </div>
          </div>
        </td>
        <td style="color:#64748b;font-size:.85rem">${u.correo}</td>
        <td><span style="font-size:.75rem;font-weight:700;padding:3px 10px;border-radius:20px;
          background:${bg};color:${cl}">${u.roles?.nombrerol??'—'}</span></td>
        <td style="font-size:.85rem">${u.departamentos?.nombre??'—'}</td>
        <td><span class="badge ${u.activo?'badge-aprobado':'badge-rechazado'}">${u.activo?'Activo':'Inactivo'}</span></td>
        <td style="display:flex;gap:6px">
          <button class="btn-secondary editar-usr" data-id="${u.idusuario}"
            style="padding:5px 10px;font-size:.8rem" title="Editar">
            <i class="fas fa-edit"></i></button>
          <button class="btn-secondary eliminar-usr" data-id="${u.idusuario}"
            style="padding:5px 10px;font-size:.8rem;color:#ef4444" title="Eliminar">
            <i class="fas fa-trash"></i></button>
        </td></tr>`;}).join('');

    document.getElementById('dynamicContent').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font-size:1.5rem;font-weight:700;color:#0f172a">Gestión de Usuarios</h2>
          <p style="color:#64748b;font-size:.85rem;margin-top:2px">Administra usuarios y permisos del sistema</p>
        </div>
        <div style="display:flex;gap:10px">
          <button id="exportarUsrBtn" class="btn-secondary" style="padding:10px 18px">
            <i class="fas fa-file-excel"></i> Exportar Excel
          </button>
          <button id="nuevoUsrBtn" class="btn-primary" style="padding:10px 20px">
            <i class="fas fa-user-plus"></i> Nuevo Usuario</button>
        </div>
      </div>
      <div class="stats-grid" style="margin-bottom:20px">${rolStats}</div>
      <div style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.05)">
        <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span style="font-size:.82rem;color:#64748b;font-weight:500">Filtrar por rol:</span>
          ${filtrosRol}
        </div>
        <table class="data-table">
          <thead><tr><th>Usuario</th><th>Contacto</th><th>Rol</th><th>Departamento</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody id="usr-tbody">${buildRows(usuarios)}</tbody>
        </table>
      </div>`;

    document.getElementById('nuevoUsrBtn').addEventListener('click', () => abrirFormUsuario());

    // Filtro por rol
    document.querySelectorAll('.filtro-usr').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filtro-usr').forEach(b => {
          b.style.background='white'; b.style.color='#475569'; b.style.borderColor='#e2e8f0';
        });
        btn.style.background='#3b82f6'; btn.style.color='white'; btn.style.borderColor='#3b82f6';
        const filtrado = btn.dataset.rol==='Todos' ? usuarios : usuarios.filter(u=>u.roles?.nombrerol===btn.dataset.rol);
        document.getElementById('usr-tbody').innerHTML = buildRows(filtrado) ||
          '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:32px">Sin usuarios con este rol</td></tr>';
        bindUsrEvents();
      });
    });

    document.getElementById('exportarUsrBtn')?.addEventListener('click', () => exportarUsuarios());
    document.getElementById('nuevoUsrBtn').addEventListener('click', () => abrirFormUsuario());
    bindUsrEvents();
  } catch(e) { console.error(e); showError('Error cargando usuarios.'); }
  finally    { showLoader(false); }
}

function bindUsrEvents() {
  document.querySelectorAll('.editar-usr').forEach(btn => btn.addEventListener('click', async () => {
    const { data } = await db.from('usuarios').select('*').eq('idusuario', btn.dataset.id).single();
    if (data) abrirFormUsuario(data);
  }));
  document.querySelectorAll('.eliminar-usr').forEach(btn => btn.addEventListener('click', () =>
    showModal('Eliminar usuario','¿Eliminar este usuario del sistema?', async () => {
      const { error } = await db.from('usuarios').delete().eq('idusuario', btn.dataset.id);
      if (error) showToast('Error: '+error.message,'error');
      else { showToast('Usuario eliminado','warning'); renderUsuarios(); }
    })));
}

// ─── FORMULARIO USUARIO ──────────────────────────────────────────
async function abrirFormUsuario(u = null) {
  const [roles, deptos] = await Promise.all([fetchRoles(), fetchDepartamentos()]);
  const es = !!u;

  const rolCards = roles.map(r => `
    <label class="rol-card" style="display:flex;align-items:center;gap:8px;padding:9px 12px;
      border:2px solid ${u?.idrol==r.idrol?'#3b82f6':'#e2e8f0'};border-radius:10px;cursor:pointer;
      background:${u?.idrol==r.idrol?'#eff6ff':'white'};transition:.15s;flex:1;min-width:110px">
      <input type="radio" name="f_rol_r" value="${r.idrol}" ${u?.idrol==r.idrol?'checked':''}
        style="accent-color:#3b82f6;width:15px;height:15px">
      <span style="font-weight:600;font-size:.82rem;color:#1e293b">${r.nombrerol}</span>
    </label>`).join('');

  const deptoCards = deptos.map(d => `
    <label class="depto-card" style="display:flex;align-items:center;gap:7px;padding:7px 11px;
      border:2px solid ${u?.iddepartamento==d.iddepartamento?'#3b82f6':'#e2e8f0'};border-radius:9px;
      cursor:pointer;background:${u?.iddepartamento==d.iddepartamento?'#eff6ff':'white'};transition:.15s">
      <input type="radio" name="f_dep_r" value="${d.iddepartamento}" ${u?.iddepartamento==d.iddepartamento?'checked':''}
        style="accent-color:#3b82f6;width:14px;height:14px">
      <span style="font-size:.8rem;font-weight:500;color:#374151">${d.nombre}</span>
    </label>`).join('');

  const body = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">
      <div style="grid-column:1/-1">${fi('f_nombre','Nombre completo','text','Ej: Ana Martínez',true,u?.nombre??'')}</div>
      ${fi('f_correo','Correo electrónico','email','usuario@empresa.com',true,u?.correo??'')}
      <div style="${fGS}">
        <label style="${fLS}">${es?'Nueva contraseña (opcional)':'Contraseña'} ${!es?'<span style="color:#ef4444">*</span>':''}</label>
        <input id="f_pass" type="password" placeholder="${es?'Dejar vacío para no cambiar':'Mínimo 6 caracteres'}"
          style="${fIS}" ${!es?'required':''}>
      </div>
    </div>

    <div style="${fGS}">
      <label style="${fLS}">Rol <span style="color:#ef4444">*</span></label>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${rolCards}</div>
      <input type="hidden" id="f_rol" value="${u?.idrol??''}">
    </div>

    <div style="${fGS}">
      <label style="${fLS}">Departamento <span style="color:#ef4444">*</span></label>
      <input id="depto-search" type="text" placeholder="Filtrar departamentos..."
        style="${fIS}margin-bottom:8px" autocomplete="off">
      <div id="depto-cards" style="display:flex;flex-wrap:wrap;gap:7px;max-height:130px;overflow-y:auto;padding:2px">${deptoCards}</div>
      <input type="hidden" id="f_depto" value="${u?.iddepartamento??''}">
    </div>

    <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#f8fafc;border-radius:10px">
      <input type="checkbox" id="f_activo" ${u?.activo!==false?'checked':''} style="width:18px;height:18px;accent-color:#3b82f6">
      <label for="f_activo" style="font-size:.9rem;font-weight:500;cursor:pointer">Usuario activo</label>
    </div>`;

  openFormModal(es?'Editar Usuario':'Nuevo Usuario', body, async () => {
    if (!req(['f_nombre','Nombre'],['f_correo','Correo'])) throw new Error();
    if (!es && !getVal('f_pass')) { showToast('La contraseña es obligatoria','warning'); throw new Error(); }
    if (!getVal('f_rol'))   { showToast('Selecciona un rol','warning'); throw new Error(); }
    if (!getVal('f_depto')) { showToast('Selecciona un departamento','warning'); throw new Error(); }

    const payload = {
      nombre:getVal('f_nombre'), correo:getVal('f_correo'),
      idrol:getInt('f_rol'), iddepartamento:getInt('f_depto'), activo:getCheck('f_activo')
    };
    const pass = getVal('f_pass');
    if (pass) payload.passwordhash = pass; // ⚠️ En prod: usar Edge Function con bcrypt

    const { error } = es
      ? await db.from('usuarios').update(payload).eq('idusuario', u.idusuario)
      : await db.from('usuarios').insert(payload);
    if (error) { showToast('Error: '+error.message,'error'); throw error; }
    showToast(es?'Usuario actualizado':'Usuario creado correctamente');
    renderUsuarios();
  });

  setTimeout(() => {
    // Rol cards
    document.querySelectorAll('.rol-card').forEach(lbl => {
      lbl.addEventListener('click', () => {
        document.querySelectorAll('.rol-card').forEach(l => { l.style.borderColor='#e2e8f0'; l.style.background='white'; });
        lbl.style.borderColor='#3b82f6'; lbl.style.background='#eff6ff';
        document.getElementById('f_rol').value = lbl.querySelector('input').value;
      });
    });
    if (u?.idrol) document.getElementById('f_rol').value = u.idrol;

    // Depto cards
    document.querySelectorAll('.depto-card').forEach(lbl => {
      lbl.addEventListener('click', () => {
        document.querySelectorAll('.depto-card').forEach(l => { l.style.borderColor='#e2e8f0'; l.style.background='white'; });
        lbl.style.borderColor='#3b82f6'; lbl.style.background='#eff6ff';
        document.getElementById('f_depto').value = lbl.querySelector('input').value;
      });
    });
    if (u?.iddepartamento) document.getElementById('f_depto').value = u.iddepartamento;

    // Filtro depto
    document.getElementById('depto-search')?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.depto-card').forEach(lbl => {
        lbl.style.display = lbl.querySelector('span').textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }, 50);
}


// ══════════════════════════════════════════════════════════════════
//  EXPORTACIÓN Y COMPROBANTE
// ══════════════════════════════════════════════════════════════════

// ── Exportar tabla a CSV ─────────────────────────────────────────
// ── Carga de SheetJS (versión que soporta estilos via sheetjs-style) ──
function cargarSheetJS() {
  return new Promise((resolve, reject) => {
    if (window.XLSX) { resolve(window.XLSX); return; }
    // Usamos xlsx-style que soporta la propiedad .s para estilos
    const s = document.createElement('script');
    s.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
    s.onload  = () => {
      if (window.XLSX) resolve(window.XLSX);
      else reject(new Error('XLSX no disponible tras carga'));
    };
    s.onerror = () => {
      // Fallback al CDN de cloudflare si el primero falla
      const s2 = document.createElement('script');
      s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s2.onload  = () => resolve(window.XLSX);
      s2.onerror = () => reject(new Error('No se pudo cargar SheetJS'));
      document.head.appendChild(s2);
    };
    document.head.appendChild(s);
  });
}

// ── Exportar a Excel (.xlsx) ──────────────────────────────────────
// Nota: los estilos (.s) solo funcionan con xlsx-style o xlsx >= 0.20
// Si no están disponibles, el archivo igual se genera sin estilos.
async function exportarExcel(datos, nombreArchivo, titulo = '') {
  if (!datos.length) { showToast('No hay datos para exportar', 'warning'); return; }

  let XLSX;
  try {
    XLSX = await cargarSheetJS();
  } catch(e) {
    showToast('Error cargando librería de Excel: ' + e.message, 'error');
    console.error(e);
    return;
  }

  try {
    const encabezados = Object.keys(datos[0]);
    const filas       = datos.map(fila => encabezados.map(k => {
      const v = fila[k];
      // Mantener números como números para que Excel los reconozca
      if (typeof v === 'number') return v;
      return String(v ?? '');
    }));

    // Estructura: fila título, fila vacía, encabezados, datos
    const wsData = [
      [titulo || nombreArchivo.toUpperCase()],
      [],
      encabezados,
      ...filas
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Anchos de columna automáticos
    ws['!cols'] = encabezados.map((h, ci) => ({
      wch: Math.min(50, Math.max(
        h.length + 2,
        ...filas.map(f => String(f[ci] ?? '').length)
      ) + 3)
    }));

    // Merge del título en fila 1
    ws['!merges'] = [{ s:{ r:0, c:0 }, e:{ r:0, c: encabezados.length - 1 } }];

    // Altura de filas: título más alto
    ws['!rows'] = [{ hpt:28 }, { hpt:6 }, { hpt:20 }];

    // Aplicar estilos solo si la versión de XLSX lo soporta
    const aplicarEstilo = (cellAddr, estilo) => {
      if (ws[cellAddr]) ws[cellAddr].s = estilo;
    };

    // Estilo título
    aplicarEstilo(XLSX.utils.encode_cell({ r:0, c:0 }), {
      font:      { bold:true, sz:13, color:{ rgb:'FFFFFF' } },
      fill:      { patternType:'solid', fgColor:{ rgb:'1E3A5F' } },
      alignment: { horizontal:'center', vertical:'center', wrapText:true },
    });

    // Estilo encabezados (fila índice 2)
    encabezados.forEach((_, ci) => {
      aplicarEstilo(XLSX.utils.encode_cell({ r:2, c:ci }), {
        font:      { bold:true, color:{ rgb:'FFFFFF' } },
        fill:      { patternType:'solid', fgColor:{ rgb:'2563EB' } },
        alignment: { horizontal:'center', vertical:'center' },
        border: {
          top:    { style:'thin', color:{ rgb:'1D4ED8' } },
          bottom: { style:'medium', color:{ rgb:'1D4ED8' } },
          left:   { style:'thin', color:{ rgb:'1D4ED8' } },
          right:  { style:'thin', color:{ rgb:'1D4ED8' } },
        }
      });
    });

    // Estilo filas de datos (alternadas)
    filas.forEach((_, ri) => {
      const bgColor = ri % 2 === 0 ? 'F1F5F9' : 'FFFFFF';
      encabezados.forEach((_, ci) => {
        aplicarEstilo(XLSX.utils.encode_cell({ r: ri + 3, c: ci }), {
          fill:      { patternType:'solid', fgColor:{ rgb: bgColor } },
          alignment: { vertical:'center' },
          border: {
            bottom: { style:'thin', color:{ rgb:'E2E8F0' } },
            right:  { style:'thin', color:{ rgb:'E2E8F0' } },
            left:   { style:'thin', color:{ rgb:'E2E8F0' } },
          }
        });
      });
    });

    // Crear libro
    const wb       = XLSX.utils.book_new();
    const hojaNom  = titulo.substring(0, 31) || 'Datos'; // Excel limita a 31 chars
    XLSX.utils.book_append_sheet(wb, ws, hojaNom);

    // Hoja de metadatos
    const metaData = [
      ['Campo',        'Valor'],
      ['Exportado por', currentUser.nombre],
      ['Rol',           currentUser.nombrerol],
      ['Fecha',         new Date().toLocaleString('es-DO')],
      ['Filtros',       titulo],
      ['Sistema',       'InsumosPro — Gestión de Despachos'],
    ];
    const wsMeta = XLSX.utils.aoa_to_sheet(metaData);
    wsMeta['!cols'] = [{ wch:18 }, { wch:50 }];
    // Estilo encabezado de metadatos
    ['A1','B1'].forEach(c => {
      if (wsMeta[c]) wsMeta[c].s = {
        font: { bold:true, color:{ rgb:'FFFFFF' } },
        fill: { patternType:'solid', fgColor:{ rgb:'475569' } },
      };
    });
    XLSX.utils.book_append_sheet(wb, wsMeta, 'Info');

    const fecha    = new Date().toISOString().slice(0, 10);
    const fileName = `${nombreArchivo}_${fecha}.xlsx`;

    XLSX.writeFile(wb, fileName);
    showToast(`✅ Excel exportado: ${fileName}`);

  } catch(e) {
    console.error('Error generando Excel:', e);
    showToast('Error al generar el Excel: ' + e.message, 'error');
  }
}

// ── Exportar solicitudes (con modal de filtros) ──────────────────
async function exportarSolicitudes() {
  // Cargar departamentos para el filtro
  const deptos = await fetchDepartamentos();

  // Calcular rango de fechas por defecto (mes actual)
  const hoy     = new Date();
  const primerD = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0,10);
  const hoyStr  = hoy.toISOString().slice(0,10);

  const deptosOpts = deptos.map(d =>
    `<option value="${d.iddepartamento}">${d.nombre}</option>`).join('');

  // Abrir modal de filtros
  document.getElementById('formModal')?.remove();
  const m = document.createElement('div');
  m.id = 'formModal';
  m.style.cssText = `position:fixed;inset:0;z-index:2000;background:rgba(15,23,42,.55);
    display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease`;
  m.innerHTML = `
    <div style="background:white;border-radius:24px;width:100%;max-width:480px;
      box-shadow:0 25px 50px rgba(0,0,0,.18);overflow:hidden;animation:slideUp .25s ease">
      <div style="padding:22px 28px;border-bottom:1px solid #f1f5f9;
        display:flex;align-items:center;justify-content:space-between">
        <div>
          <h3 style="font-size:1.05rem;font-weight:700;color:#0f172a">
            <i class="fas fa-file-excel" style="color:#16a34a;margin-right:8px"></i>
            Exportar Solicitudes
          </h3>
          <p style="font-size:.78rem;color:#94a3b8;margin-top:3px">Configura los filtros del reporte</p>
        </div>
        <button id="closeExpModal" style="background:none;border:none;font-size:1.4rem;
          color:#94a3b8;cursor:pointer">&times;</button>
      </div>
      <div style="padding:24px 28px;display:flex;flex-direction:column;gap:18px">

        <div>
          <label style="display:block;font-size:.75rem;font-weight:700;color:#475569;
            text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">
            Rango de Fechas
          </label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div>
              <label style="font-size:.78rem;color:#94a3b8;display:block;margin-bottom:4px">Desde</label>
              <input type="date" id="exp-fecha-ini" value="${primerD}"
                style="width:100%;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:10px;
                font-family:inherit;font-size:.88rem;outline:none">
            </div>
            <div>
              <label style="font-size:.78rem;color:#94a3b8;display:block;margin-bottom:4px">Hasta</label>
              <input type="date" id="exp-fecha-fin" value="${hoyStr}"
                style="width:100%;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:10px;
                font-family:inherit;font-size:.88rem;outline:none">
            </div>
          </div>
        </div>

        <div>
          <label style="display:block;font-size:.75rem;font-weight:700;color:#475569;
            text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">
            Departamento
          </label>
          <select id="exp-depto"
            style="width:100%;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:10px;
            font-family:inherit;font-size:.88rem;background:white;outline:none">
            <option value="">Todos los departamentos</option>
            ${deptosOpts}
          </select>
        </div>

        <div>
          <label style="display:block;font-size:.75rem;font-weight:700;color:#475569;
            text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">
            Estado
          </label>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${['Todos','Pendiente','Aprobada','Rechazada','Despachada'].map(e => `
              <label style="display:flex;align-items:center;gap:6px;padding:6px 12px;
                border:1.5px solid #e2e8f0;border-radius:20px;cursor:pointer;font-size:.82rem;
                font-weight:500;transition:.15s" class="exp-estado-lbl">
                <input type="radio" name="exp_estado" value="${e}" ${e==='Todos'?'checked':''}
                  style="accent-color:#3b82f6"> ${e}
              </label>`).join('')}
          </div>
        </div>

      </div>
      <div style="padding:16px 28px;border-top:1px solid #f1f5f9;
        display:flex;justify-content:flex-end;gap:10px">
        <button id="cancelExpBtn" class="btn-secondary">Cancelar</button>
        <button id="confirmarExpBtn" class="btn-primary" style="min-width:140px">
          <i class="fas fa-file-excel"></i> Generar Excel
        </button>
      </div>
    </div>`;

  document.body.appendChild(m);

  // Highlight radio labels
  m.querySelectorAll('.exp-estado-lbl').forEach(lbl => {
    const inp = lbl.querySelector('input');
    if (inp.checked) { lbl.style.borderColor='#3b82f6'; lbl.style.background='#eff6ff'; }
    lbl.addEventListener('click', () => {
      m.querySelectorAll('.exp-estado-lbl').forEach(l => {
        l.style.borderColor='#e2e8f0'; l.style.background='white';
      });
      lbl.style.borderColor='#3b82f6'; lbl.style.background='#eff6ff';
    });
  });

  const close = () => m.remove();
  document.getElementById('closeExpModal').addEventListener('click', close);
  document.getElementById('cancelExpBtn').addEventListener('click', close);
  m.addEventListener('click', e => { if (e.target === m) close(); });

  document.getElementById('confirmarExpBtn').addEventListener('click', async () => {
    const btn     = document.getElementById('confirmarExpBtn');
    btn.disabled  = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';

    const fechaIni  = document.getElementById('exp-fecha-ini').value;
    const fechaFin  = document.getElementById('exp-fecha-fin').value;
    const deptoId   = document.getElementById('exp-depto').value;
    const estadoSel = m.querySelector('[name="exp_estado"]:checked')?.value ?? 'Todos';

    // Validar fechas
    if (fechaIni && fechaFin && fechaIni > fechaFin) {
      showToast('La fecha inicial no puede ser mayor a la final', 'warning');
      btn.disabled  = false;
      btn.innerHTML = '<i class="fas fa-file-excel"></i> Generar Excel';
      return;
    }

    // Construir query con filtros
    let q = db.from('solicitudes')
      .select('idsolicitud,prioridad,fechasolicitud,estado,comentarios,idusuario')
      .order('fechasolicitud', { ascending: false });

    if (!isAdmin()) q = q.eq('idusuario', currentUser.idusuario);
    if (estadoSel !== 'Todos') q = q.eq('estado', estadoSel);
    if (fechaIni) q = q.gte('fechasolicitud', `${fechaIni}T00:00:00`);
    if (fechaFin) q = q.lte('fechasolicitud', `${fechaFin}T23:59:59`);

    const { data: rawSols, error } = await q;
    if (error || !rawSols?.length) {
      showToast('No hay solicitudes con esos filtros', 'warning');
      btn.disabled  = false;
      btn.innerHTML = '<i class="fas fa-file-excel"></i> Generar Excel';
      return;
    }

    // Fetch usuarios con departamentos
    const userIds = [...new Set(rawSols.map(s => s.idusuario))];
    const { data: usrs } = await db.from('usuarios')
      .select('idusuario, nombre, iddepartamento, departamentos(nombre)')
      .in('idusuario', userIds);
    const usrMap = {};
    (usrs ?? []).forEach(u => { usrMap[u.idusuario] = u; });

    // Filtrar por departamento si se seleccionó uno
    let solicitudes = rawSols.map(s => ({ ...s, usuarios: usrMap[s.idusuario] ?? null }));
    if (deptoId) {
      solicitudes = solicitudes.filter(s => String(s.usuarios?.iddepartamento) === String(deptoId));
    }

    if (!solicitudes.length) {
      showToast('No hay solicitudes con esos filtros', 'warning');
      btn.disabled  = false;
      btn.innerHTML = '<i class="fas fa-file-excel"></i> Generar Excel';
      return;
    }

    const depto     = deptos.find(d => String(d.iddepartamento) === String(deptoId));
    const dNombre   = depto?.nombre ?? 'Todos';
    const titulo    = `Solicitudes — ${dNombre} — ${fechaIni||'inicio'} al ${fechaFin||'hoy'}`;

    const datos = solicitudes.map(s => ({
      'ID':           `#${s.idsolicitud}`,
      'Solicitante':  s.usuarios?.nombre ?? 'N/A',
      'Departamento': s.usuarios?.departamentos?.nombre ?? 'N/A',
      'Fecha':        new Date(s.fechasolicitud).toLocaleDateString('es-DO'),
      'Prioridad':    s.prioridad ?? '',
      'Estado':       s.estado ?? '',
      'Comentarios':  s.comentarios ?? '',
    }));

    await exportarExcel(datos, 'solicitudes', titulo);
    close();
  });
}

// ── Exportar inventario ──────────────────────────────────────────
async function exportarInventario() {
  showToast('Preparando Excel...', 'warning');
  try {
    // fetchInventario hace .select('*') sin joins — directo y seguro
    const { data: productos, error } = await db
      .from('productos')
      .select('idproducto, nombre, descripcion, stockactual, stockminimo, activo')
      .order('nombre');

    if (error) throw error;
    if (!productos?.length) { showToast('No hay productos para exportar', 'warning'); return; }

    const datos = productos.map(p => ({
      'ID':            p.idproducto,
      'Nombre':        p.nombre ?? '',
      'Descripción':   p.descripcion ?? '',
      'Stock Actual':  p.stockactual ?? 0,
      'Stock Mínimo':  p.stockminimo ?? 0,
      'Estado Stock':  (p.stockactual ?? 0) < (p.stockminimo ?? 0) ? 'Crítico' : 'Normal',
      'Activo':        p.activo ? 'Sí' : 'No',
    }));
    await exportarExcel(datos, 'inventario', 'Reporte de Inventario de Productos');
  } catch(e) {
    console.error('exportarInventario:', e);
    showToast('Error al exportar inventario: ' + e.message, 'error');
  }
}

// ── Exportar usuarios ────────────────────────────────────────────
async function exportarUsuarios() {
  showToast('Preparando Excel...', 'warning');
  try {
    // Fetch directo sin join anidado para evitar problemas
    const { data: usuarios, error: e1 } = await db
      .from('usuarios')
      .select('idusuario, nombre, correo, activo, idrol, iddepartamento')
      .order('nombre');
    if (e1) throw e1;
    if (!usuarios?.length) { showToast('No hay usuarios para exportar', 'warning'); return; }

    const userIds  = usuarios.map(u => u.idrol).filter(Boolean);
    const depIds   = usuarios.map(u => u.iddepartamento).filter(Boolean);

    const [{ data: roles }, { data: deptos }] = await Promise.all([
      db.from('roles').select('idrol, nombrerol').in('idrol', [...new Set(userIds)]),
      db.from('departamentos').select('iddepartamento, nombre').in('iddepartamento', [...new Set(depIds)]),
    ]);

    const rolMap  = {}; (roles  ?? []).forEach(r => { rolMap[r.idrol]              = r.nombrerol; });
    const depMap  = {}; (deptos ?? []).forEach(d => { depMap[d.iddepartamento]      = d.nombre;    });

    const datos = usuarios.map(u => ({
      'ID':            u.idusuario,
      'Nombre':        u.nombre ?? '',
      'Correo':        u.correo ?? '',
      'Rol':           rolMap[u.idrol]             ?? '—',
      'Departamento':  depMap[u.iddepartamento]    ?? '—',
      'Activo':        u.activo ? 'Sí' : 'No',
    }));
    await exportarExcel(datos, 'usuarios', 'Reporte de Usuarios del Sistema');
  } catch(e) {
    console.error('exportarUsuarios:', e);
    showToast('Error al exportar usuarios: ' + e.message, 'error');
  }
}

// ── Comprobante de Despacho (ventana de impresión) ───────────────
async function imprimirComprobanteDespacho(despachoId, solicitudId) {
  showToast('Generando comprobante...', 'warning');

  // Obtener datos del despacho
  const { data: despacho } = await db.from('despachos')
    .select('*, usuarios(nombre, correo)')
    .eq('iddespacho', despachoId)
    .single();

  // Obtener datos de la solicitud con detalle de productos
  const { data: solicitud } = await db.from('solicitudes')
    .select('*, usuarios(nombre, departamentos(nombre))')
    .eq('idsolicitud', solicitudId)
    .single();

  const { data: detalle } = await db.from('despachodetalle')
    .select('cantidaddespachada, productos(nombre, descripcion)')
    .eq('iddespacho', despachoId);

  // Si no hay detalle, usar el detalle de la solicitud
  let itemsHTML = '';
  if (detalle?.length) {
    itemsHTML = detalle.map((d, i) => `
      <tr style="border-bottom:1px solid #e2e8f0">
        <td style="padding:10px 12px;color:#374151">${i+1}</td>
        <td style="padding:10px 12px;font-weight:600">${d.productos?.nombre ?? 'Producto'}</td>
        <td style="padding:10px 12px;color:#64748b">${d.productos?.descripcion ?? '—'}</td>
        <td style="padding:10px 12px;text-align:center;font-weight:700;color:#0f172a">${d.cantidaddespachada}</td>
      </tr>`).join('');
  } else {
    // Fallback: detalle de la solicitud original
    const { data: solDetalle } = await db.from('solicituddetalle')
      .select('cantidad, productos(nombre, descripcion)')
      .eq('idsolicitud', solicitudId);
    itemsHTML = (solDetalle ?? []).map((d, i) => `
      <tr style="border-bottom:1px solid #e2e8f0">
        <td style="padding:10px 12px;color:#374151">${i+1}</td>
        <td style="padding:10px 12px;font-weight:600">${d.productos?.nombre ?? 'Producto'}</td>
        <td style="padding:10px 12px;color:#64748b">${d.productos?.descripcion ?? '—'}</td>
        <td style="padding:10px 12px;text-align:center;font-weight:700;color:#0f172a">${d.cantidad}</td>
      </tr>`).join('');
  }

  const fecha        = despacho?.fechadespacho ? new Date(despacho.fechadespacho).toLocaleString('es-DO') : new Date().toLocaleString('es-DO');
  const solicitante  = solicitud?.usuarios?.nombre ?? 'N/A';
  const departamento = solicitud?.usuarios?.departamentos?.nombre ?? 'N/A';
  const despachador  = despacho?.usuarios?.nombre ?? currentUser.nombre;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante de Despacho #${despachoId}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color:#0f172a; background:white; padding:32px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:24px; border-bottom:3px solid #3b82f6; }
    .logo-area h1 { font-size:1.6rem; font-weight:800; color:#0f172a; }
    .logo-area p  { color:#64748b; font-size:.85rem; margin-top:4px; }
    .doc-info { text-align:right; }
    .doc-info .doc-num { font-size:1.3rem; font-weight:700; color:#3b82f6; }
    .doc-info .doc-fecha { font-size:.82rem; color:#64748b; margin-top:4px; }
    .badge-completado { display:inline-block; background:#dcfce7; color:#15803d; font-size:.75rem; font-weight:700; padding:3px 10px; border-radius:20px; margin-top:6px; }
    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:28px; }
    .info-box { background:#f8fafc; border-radius:12px; padding:16px 20px; border:1px solid #e2e8f0; }
    .info-box h4 { font-size:.72rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; margin-bottom:10px; }
    .info-row { display:flex; justify-content:space-between; margin-bottom:6px; font-size:.88rem; }
    .info-row .lbl { color:#64748b; }
    .info-row .val { font-weight:600; color:#0f172a; }
    table { width:100%; border-collapse:collapse; background:white; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; margin-bottom:28px; }
    thead tr { background:#0f172a; }
    thead th { padding:12px 14px; color:white; font-size:.8rem; font-weight:600; text-align:left; text-transform:uppercase; letter-spacing:.04em; }
    tbody tr:last-child { border-bottom:none !important; }
    .firma-grid { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:20px; }
    .firma-box { text-align:center; }
    .firma-line { border-top:2px solid #0f172a; margin-bottom:8px; }
    .firma-label { font-size:.78rem; color:#64748b; }
    .firma-name  { font-size:.88rem; font-weight:600; color:#0f172a; margin-top:4px; }
    .footer { margin-top:32px; padding-top:16px; border-top:1px solid #e2e8f0; text-align:center; color:#94a3b8; font-size:.75rem; }
    @media print {
      body { padding:20px; }
      .no-print { display:none !important; }
      @page { margin:15mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-area">
      <h1>📦 InsumosPro</h1>
      <p>Sistema de Gestión de Despachos</p>
    </div>
    <div class="doc-info">
      <div class="doc-num">Despacho #${despachoId}</div>
      <div class="doc-fecha">${fecha}</div>
      <div class="badge-completado">✓ Completado</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="info-box">
      <h4>Información del Solicitante</h4>
      <div class="info-row"><span class="lbl">Nombre</span><span class="val">${solicitante}</span></div>
      <div class="info-row"><span class="lbl">Departamento</span><span class="val">${departamento}</span></div>
      <div class="info-row"><span class="lbl">Solicitud N°</span><span class="val">#${solicitudId}</span></div>
    </div>
    <div class="info-box">
      <h4>Información del Despacho</h4>
      <div class="info-row"><span class="lbl">Despachado por</span><span class="val">${despachador}</span></div>
      <div class="info-row"><span class="lbl">Fecha y hora</span><span class="val">${fecha}</span></div>
      <div class="info-row"><span class="lbl">Estado</span><span class="val" style="color:#15803d">Completado</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:40px">#</th>
        <th>Producto</th>
        <th>Descripción</th>
        <th style="text-align:center;width:100px">Cantidad</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML || '<tr><td colspan="4" style="padding:20px;text-align:center;color:#94a3b8">Sin detalle de productos</td></tr>'}
    </tbody>
  </table>

  <div class="firma-grid">
    <div class="firma-box">
      <div style="height:50px"></div>
      <div class="firma-line"></div>
      <div class="firma-name">${solicitante}</div>
      <div class="firma-label">Recibido por (Solicitante)</div>
    </div>
    <div class="firma-box">
      <div style="height:50px"></div>
      <div class="firma-line"></div>
      <div class="firma-name">${despachador}</div>
      <div class="firma-label">Despachado por (Almacén)</div>
    </div>
  </div>

  <div class="footer">
    Documento generado automáticamente por InsumosPro · ${new Date().toLocaleString('es-DO')} ·
    Usuario: ${currentUser.nombre} (${currentUser.nombrerol})
  </div>

  <div class="no-print" style="position:fixed;bottom:24px;right:24px;display:flex;gap:10px">
    <button onclick="window.print()"
      style="background:#3b82f6;color:white;border:none;padding:12px 24px;border-radius:12px;
      font-size:.95rem;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(59,130,246,.3)">
      🖨️ Imprimir
    </button>
    <button onclick="window.close()"
      style="background:#f1f5f9;color:#475569;border:none;padding:12px 24px;border-radius:12px;
      font-size:.95rem;font-weight:600;cursor:pointer">
      ✕ Cerrar
    </button>
  </div>
</body>
</html>`;

  const ventana = window.open('', '_blank', 'width=900,height=700');
  ventana.document.write(html);
  ventana.document.close();
}

// ── Comprobante rápido (post-despacho, sin idDespacho aún) ───────
async function imprimirComprobanteSolicitud(solicitudId) {
  // Buscar el despacho más reciente para esta solicitud
  const { data: despachos } = await db.from('despachos')
    .select('iddespacho')
    .eq('idsolicitud', solicitudId)
    .order('fechadespacho', { ascending: false })
    .limit(1);

  const did = despachos?.[0]?.iddespacho;
  if (did) {
    await imprimirComprobanteDespacho(did, solicitudId);
  } else {
    // Fallback sin ID de despacho formal
    await imprimirComprobanteDespacho(null, solicitudId);
  }
}

// ══════════════════════════════════════════════════════════════════
//  CSS DINÁMICO
// ══════════════════════════════════════════════════════════════════
const _style = document.createElement('style');
_style.textContent = `
  @keyframes fadeIn  { from{opacity:0}         to{opacity:1} }
  @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes slideIn { from{transform:translateX(20px);opacity:0} to{transform:translateX(0);opacity:1} }
  #formModal input:focus, #formModal select:focus, #formModal textarea:focus {
    border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.1);
  }
  .dd-opt:hover { background:#f8fafc !important; }
`;
document.head.appendChild(_style);

// ══════════════════════════════════════════════════════════════════
//  ARRANQUE
// ══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Eventos de navegación
  document.querySelectorAll('.nav-item').forEach(item =>
    item.addEventListener('click', () => loadSection(item.dataset.section)));

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

  // Restaurar sesión desde sessionStorage
  const saved = sessionStorage.getItem('insumos_user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      initApp();
    } catch { renderLogin(); }
  } else {
    renderLogin();
  }
});