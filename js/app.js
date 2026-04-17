// ======================= CONFIGURACIÓN DE SUPABASE =======================
const SUPABASE_URL = 'https://inenjhpybhadvebglskr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluZW5qaHB5YmhhZHZlYmdsc2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDY5NzIsImV4cCI6MjA5MjAyMjk3Mn0.re4HRRhNG5s6QarV2h8_J71_TpVEbOKAGGR2B3kYjEc';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ======================= VARIABLES GLOBALES =======================
let currentSection = 'dashboard';
let currentUser = { id: 1, nombre: 'Juan Pérez', rol: 'Administrador' };

// ======================= UTILIDADES CORE =======================
function showLoader(show = true) {
  const loader  = document.getElementById('loaderWrapper');
  const content = document.getElementById('dynamicContent');
  if (loader)  loader.style.display = show ? 'flex' : 'none';
  if (content) content.style.visibility = show ? 'hidden' : 'visible';
}

function showError(mensaje) {
  const content = document.getElementById('dynamicContent');
  if (!content) return;
  content.style.visibility = 'visible';
  content.innerHTML = `
    <div style="text-align:center;padding:60px 20px;color:#b91c1c">
      <i class="fas fa-exclamation-triangle" style="font-size:2.5rem;margin-bottom:16px;display:block"></i>
      <p style="font-size:1.1rem;font-weight:600">${mensaje}</p>
      <p style="color:#64748b;margin-top:8px">Revisa la consola del navegador para más detalles.</p>
    </div>`;
}

function showToast(mensaje, tipo = 'success') {
  const existing = document.getElementById('toast-msg');
  if (existing) existing.remove();
  const colors = { success: '#22c55e', error: '#ef4444', warning: '#f59e0b' };
  const icons  = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-circle' };
  const toast = document.createElement('div');
  toast.id = 'toast-msg';
  toast.innerHTML = `<i class="fas ${icons[tipo]}"></i> ${mensaje}`;
  Object.assign(toast.style, {
    position:'fixed', bottom:'28px', right:'28px', zIndex:'9999',
    background: colors[tipo], color:'white', padding:'12px 20px',
    borderRadius:'12px', fontWeight:'600', fontSize:'0.9rem',
    display:'flex', alignItems:'center', gap:'8px',
    boxShadow:'0 8px 20px rgba(0,0,0,0.15)',
    animation:'slideIn 0.3s ease'
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function showModal(title, message, onConfirm) {
  const modal      = document.getElementById('modalConfirm');
  const confirmBtn = document.getElementById('modalConfirmBtn');
  const cancelBtn  = document.getElementById('modalCancelBtn');
  const closeSpan  = document.querySelector('.close-modal');
  document.getElementById('modalTitle').innerText   = title;
  document.getElementById('modalMessage').innerText = message;
  modal.style.display = 'flex';
  const cleanUp = () => {
    modal.style.display = 'none';
    confirmBtn.removeEventListener('click', handler);
    cancelBtn.removeEventListener('click', cleanUp);
    closeSpan.removeEventListener('click', cleanUp);
  };
  const handler = () => { onConfirm(); cleanUp(); };
  confirmBtn.addEventListener('click', handler);
  cancelBtn.addEventListener('click', cleanUp);
  closeSpan.addEventListener('click', cleanUp);
}

// ======================= MODAL DE FORMULARIO GENÉRICO =======================
function openFormModal(title, bodyHTML, onSubmit) {
  // Elimina modal anterior si existe
  const existing = document.getElementById('formModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'formModal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:2000;background:rgba(15,23,42,0.55);
    display:flex;align-items:center;justify-content:center;padding:20px;
    animation:fadeIn 0.2s ease;
  `;
  modal.innerHTML = `
    <div style="background:white;border-radius:24px;width:100%;max-width:560px;
      box-shadow:0 25px 50px rgba(0,0,0,0.18);overflow:hidden;animation:slideUp 0.25s ease;">
      <div style="padding:24px 28px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;">
        <h3 style="font-size:1.15rem;font-weight:700;color:#0f172a">${title}</h3>
        <button id="closeFormModal" style="background:none;border:none;font-size:1.4rem;color:#94a3b8;cursor:pointer;line-height:1">&times;</button>
      </div>
      <div style="padding:24px 28px;max-height:70vh;overflow-y:auto">
        ${bodyHTML}
      </div>
      <div style="padding:16px 28px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:12px">
        <button id="cancelFormBtn" class="btn-secondary">Cancelar</button>
        <button id="submitFormBtn" class="btn-primary" style="min-width:120px">Guardar</button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  const close = () => modal.remove();
  document.getElementById('closeFormModal').addEventListener('click', close);
  document.getElementById('cancelFormBtn').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  document.getElementById('submitFormBtn').addEventListener('click', async () => {
    const btn = document.getElementById('submitFormBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    try {
      await onSubmit();
      close();
    } catch(err) {
      btn.disabled = false;
      btn.innerHTML = 'Guardar';
    }
  });
}

// CSS helper para inputs de formulario
const formInputStyle = `width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;
  font-family:inherit;font-size:0.9rem;color:#0f172a;outline:none;transition:border 0.2s;
  box-sizing:border-box;`;
const formLabelStyle = `display:block;font-size:0.8rem;font-weight:600;color:#475569;margin-bottom:6px;`;
const formGroupStyle = `margin-bottom:18px;`;

function formInput(id, label, type='text', placeholder='', required=true, value='') {
  return `<div style="${formGroupStyle}">
    <label for="${id}" style="${formLabelStyle}">${label}${required ? ' <span style="color:#ef4444">*</span>' : ''}</label>
    <input id="${id}" type="${type}" placeholder="${placeholder}" value="${value}"
      style="${formInputStyle}" ${required ? 'required' : ''}>
  </div>`;
}

function formSelect(id, label, options, required=true, selected='') {
  const opts = options.map(o =>
    `<option value="${o.value}" ${o.value == selected ? 'selected' : ''}>${o.label}</option>`
  ).join('');
  return `<div style="${formGroupStyle}">
    <label for="${id}" style="${formLabelStyle}">${label}${required ? ' <span style="color:#ef4444">*</span>' : ''}</label>
    <select id="${id}" style="${formInputStyle}background:white;" ${required ? 'required' : ''}>
      <option value="">-- Seleccionar --</option>${opts}
    </select>
  </div>`;
}

function formTextarea(id, label, placeholder='', required=false, value='') {
  return `<div style="${formGroupStyle}">
    <label for="${id}" style="${formLabelStyle}">${label}${required ? ' <span style="color:#ef4444">*</span>' : ''}</label>
    <textarea id="${id}" placeholder="${placeholder}" rows="3"
      style="${formInputStyle}resize:vertical;" ${required ? 'required' : ''}>${value}</textarea>
  </div>`;
}

function getVal(id) { return document.getElementById(id)?.value?.trim() || ''; }
function getInt(id) { return parseInt(document.getElementById(id)?.value) || 0; }
function getCheck(id) { return document.getElementById(id)?.checked ?? false; }

function validateRequired(fields) {
  for (const [id, label] of fields) {
    if (!getVal(id)) { showToast(`El campo "${label}" es obligatorio`, 'warning'); return false; }
  }
  return true;
}

// ======================= CONSULTAS SUPABASE =======================
async function fetchDashboardStats() {
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
  const [r1, r2, r3, r4] = await Promise.all([
    db.from('solicitudes').select('*', { count:'exact', head:true }).eq('estado','Pendiente'),
    db.from('solicitudes').select('*', { count:'exact', head:true }).eq('estado','Aprobada').gte('fechaaprobacion', startOfMonth.toISOString()),
    db.from('solicitudes').select('*', { count:'exact', head:true }).eq('estado','Rechazada'),
    db.from('solicitudes').select('*', { count:'exact', head:true }).eq('estado','Despachada'),
  ]);
  return { pendientes: r1.count??0, aprobadasMes: r2.count??0, rechazadas: r3.count??0, despachadas: r4.count??0 };
}

async function fetchAlertasInventario() {
  const { data, error } = await db.from('productos').select('Nombre, stockactual, stockminimo');
  if (error) { console.error(error); return []; }
  return (data??[]).filter(p => p.stockactual < p.stockminimo);
}

async function fetchSolicitudes(filtroEstado = null) {
  let query = db.from('solicitudes').select(`
    idsolicitud, Prioridad, fechasolicitud, Estado, Comentarios,
    Usuarios (Nombre, Departamentos (Nombre))
  `).order('fechasolicitud', { ascending: false });
  if (filtroEstado && filtroEstado !== 'Todos') query = query.eq('estado', filtroEstado);
  const { data, error } = await query;
  if (error) { console.error(error); return []; }
  return data ?? [];
}

async function fetchInventario() {
  const { data, error } = await db.from('productos').select('*').order('nombre');
  if (error) { console.error(error); return []; }
  return data ?? [];
}

async function fetchSolicitudesParaDespachar() {
  const { data, error } = await db.from('solicitudes')
    .select('*, Usuarios(Nombre, Departamentos(Nombre))')
    .eq('estado','Aprobada');
  if (error) { console.error(error); return []; }
  return data ?? [];
}

async function fetchUsuarios() {
  const { data, error } = await db.from('usuarios')
    .select('*, Roles(nombrerol), Departamentos(Nombre)');
  if (error) { console.error(error); return []; }
  return data ?? [];
}

async function fetchRoles() {
  const { data } = await db.from('roles').select('*');
  return data ?? [];
}

async function fetchDepartamentos() {
  const { data } = await db.from('departamentos').select('*');
  return data ?? [];
}

async function fetchProductos() {
  const { data } = await db.from('productos').select('idproducto, Nombre, stockactual').eq('activo', true).order('nombre');
  return data ?? [];
}

async function registrarDespacho(solicitudId, usuarioDespachaId, itemsDespachados) {
  const { data: despacho, error: errDesp } = await db.from('despachos')
    .insert({ idsolicitud: solicitudId, idusuariodespacha: usuarioDespachaId, fechadespacho: new Date().toISOString(), estado: 'Completado' })
    .select();
  if (errDesp) throw errDesp;
  const despachoId = despacho[0].iddespacho;
  for (const item of itemsDespachados) {
    await db.from('despachodetalle').insert({ iddespacho: despachoId, idproducto: item.productId, cantidaddespachada: item.cantidad });
    await db.rpc('actualizar_stock', { p_producto_id: item.productId, p_cantidad: item.cantidad });
  }
  await db.from('solicitudes').update({ estado: 'Despachada' }).eq('idsolicitud', solicitudId);
  return true;
}

// ======================= FORMULARIO: USUARIO =======================
async function abrirFormUsuario(usuarioExistente = null) {
  const roles = await fetchRoles();
  const deptos = await fetchDepartamentos();
  const esEdicion = !!usuarioExistente;
  const u = usuarioExistente || {};

  const rolesOpts  = roles.map(r => ({ value: r.idrol, label: r.nombrerol }));
  const deptosOpts = deptos.map(d => ({ value: d.iddepartamento, label: d.nombre }));

  const body = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">
      <div style="grid-column:1/-1">${formInput('f_nombre','Nombre completo','text','Ej: María González',true, u.nombre||'')}</div>
      ${formInput('f_correo','Correo electrónico','email','usuario@empresa.com',true, u.correo||'')}
      ${esEdicion
        ? `<div style="${formGroupStyle}">
            <label style="${formLabelStyle}">Nueva contraseña <span style="color:#94a3b8;font-weight:400">(opcional)</span></label>
            <input id="f_pass" type="password" placeholder="Dejar vacío para no cambiar" style="${formInputStyle}">
           </div>`
        : formInput('f_pass','Contraseña','password','Mínimo 6 caracteres',!esEdicion)
      }
      ${formSelect('f_rol','Rol', rolesOpts, true, u.idrol||'')}
      ${formSelect('f_depto','Departamento', deptosOpts, true, u.iddepartamento||'')}
    </div>
    <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#f8fafc;border-radius:10px;margin-top:4px">
      <input type="checkbox" id="f_activo" ${u.activo !== false ? 'checked' : ''} style="width:18px;height:18px;accent-color:#3b82f6">
      <label for="f_activo" style="font-size:0.9rem;font-weight:500;color:#374151;cursor:pointer">Usuario activo</label>
    </div>`;

  openFormModal(esEdicion ? 'Editar Usuario' : 'Nuevo Usuario', body, async () => {
    if (!validateRequired([['f_nombre','nombre'],['f_correo','correo'],['f_rol','Rol'],['f_depto','Departamento']])) throw new Error('Validación');
    if (!esEdicion && !getVal('f_pass')) { showToast('La contraseña es obligatoria','warning'); throw new Error('Validación'); }

    const payload = {
      nombre: getVal('f_nombre'),
      correo: getVal('f_correo'),
      idrol: getInt('f_rol'),
      iddepartamento: getInt('f_depto'),
      activo: getCheck('f_activo'),
    };
    const pass = getVal('f_pass');
    if (pass) payload.passwordhash = pass; // En prod usar hashing

    let error;
    if (esEdicion) {
      ({ error } = await db.from('usuarios').update(payload).eq('idusuario', u.idusuario));
    } else {
      ({ error } = await db.from('usuarios').insert(payload));
    }
    if (error) { showToast('Error al guardar usuario: ' + error.message, 'error'); throw error; }
    showToast(esEdicion ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
    renderUsuarios();
  });
}

// ======================= FORMULARIO: PRODUCTO =======================
async function abrirFormProducto(productoExistente = null) {
  const esEdicion = !!productoExistente;
  const p = productoExistente || {};

  const body = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">
      <div style="grid-column:1/-1">${formInput('f_nombre','Nombre del producto','text','Ej: Papel A4 75g',true, p.nombre||'')}</div>
      <div style="grid-column:1/-1">${formTextarea('f_desc','Descripción','Descripción breve del producto...',false, p.Descripcion||'')}</div>
      ${formInput('f_stock','Stock actual','number','0',true, p.stockactual??'')}
      ${formInput('f_stockmin','Stock mínimo','number','0',true, p.stockminimo??'')}
    </div>
    <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#f8fafc;border-radius:10px;margin-top:4px">
      <input type="checkbox" id="f_activo" ${p.activo !== false ? 'checked' : ''} style="width:18px;height:18px;accent-color:#3b82f6">
      <label for="f_activo" style="font-size:0.9rem;font-weight:500;color:#374151;cursor:pointer">Producto activo</label>
    </div>`;

  openFormModal(esEdicion ? 'Editar Producto' : 'Agregar Producto', body, async () => {
    if (!validateRequired([['f_nombre','nombre'],['f_stock','Stock actual'],['f_stockmin','Stock mínimo']])) throw new Error('Validación');
    const stockActual = getInt('f_stock');
    const stockMin    = getInt('f_stockmin');
    if (stockActual < 0 || stockMin < 0) { showToast('El stock no puede ser negativo','warning'); throw new Error(); }

    const payload = {
      nombre: getVal('f_nombre'),
      descripcion: getVal('f_desc'),
      stockactual: stockActual,
      stockminimo: stockMin,
      activo: getCheck('f_activo'),
    };
    let error;
    if (esEdicion) {
      ({ error } = await db.from('productos').update(payload).eq('idproducto', p.idproducto));
    } else {
      ({ error } = await db.from('productos').insert(payload));
    }
    if (error) { showToast('Error al guardar producto: ' + error.message, 'error'); throw error; }
    showToast(esEdicion ? 'Producto actualizado' : 'Producto agregado correctamente');
    renderInventario();
  });
}

// ======================= FORMULARIO: SOLICITUD =======================
async function abrirFormSolicitud(solicitudExistente = null) {
  const productos = await fetchProductos();
  const esEdicion = !!solicitudExistente;
  const s = solicitudExistente || {};

  const productosOpts = productos.map(p => ({ value: p.idproducto, label: `${p.nombre} (Stock: ${p.stockactual})` }));

  // Estado del formulario dinámico de ítems
  let items = [{ id: Date.now() }];

  const renderItems = () => {
    const container = document.getElementById('items-container');
    if (!container) return;
    container.innerHTML = items.map((item, idx) => `
      <div style="display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:end;margin-bottom:10px" id="item-${item.id}">
        <div>
          <label style="${formLabelStyle}">Producto ${idx+1}</label>
          <select class="item-producto" data-id="${item.id}" style="${formInputStyle}background:white">
            <option value="">-- Seleccionar --</option>
            ${productosOpts.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
          </select>
        </div>
        <div style="width:90px">
          <label style="${formLabelStyle}">Cantidad</label>
          <input class="item-cantidad" data-id="${item.id}" type="number" min="1" value="1" style="${formInputStyle}">
        </div>
        ${items.length > 1
          ? `<button onclick="document.getElementById('item-${item.id}').remove();items=items.filter(i=>i.id!=${item.id})"
              style="background:#fee2e2;border:none;border-radius:8px;padding:10px 12px;cursor:pointer;color:#b91c1c;margin-bottom:1px">
              <i class="fas fa-trash"></i></button>`
          : '<div></div>'}
      </div>`).join('');
  };

  const body = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">
      ${formSelect('f_prioridad', 'prioridad', [
        {value:'Alta', label:'🔴 Alta'}, {value:'Media', label:'🟡 Media'}, {value:'Baja', label:'🟢 Baja'}
      ], true, s.Prioridad||'')}
      ${!esEdicion ? '' : formSelect('f_estado','estado',[
        {value:'Pendiente',label:'Pendiente'},{value:'Aprobada',label:'Aprobada'},{value:'Rechazada',label:'Rechazada'}
      ], true, s.Estado||'Pendiente')}
      <div style="grid-column:1/-1">${formTextarea('f_comentarios','comentarios','Observaciones adicionales...',false, s.Comentarios||'')}</div>
    </div>
    ${!esEdicion ? `
    <div style="margin-top:4px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <label style="${formLabelStyle}margin:0">Productos solicitados <span style="color:#ef4444">*</span></label>
        <button id="addItemBtn" style="background:#eff6ff;border:none;color:#3b82f6;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:600">
          + Agregar producto
        </button>
      </div>
      <div id="items-container"></div>
    </div>` : ''}`;

  openFormModal(esEdicion ? 'Editar Solicitud' : 'Nueva Solicitud', body, async () => {
    if (!validateRequired([['f_prioridad','prioridad']])) throw new Error();

    let error;
    if (esEdicion) {
      const payload = { prioridad: getVal('f_prioridad'), comentarios: getVal('f_comentarios') };
      if (document.getElementById('f_estado')) payload.estado = getVal('f_estado');
      ({ error } = await db.from('solicitudes').update(payload).eq('idsolicitud', s.idsolicitud));
      if (error) { showToast('Error: ' + error.message, 'error'); throw error; }
      showToast('Solicitud actualizada');
    } else {
      // Recoger ítems
      const productoEls  = document.querySelectorAll('.item-producto');
      const cantidadEls  = document.querySelectorAll('.item-cantidad');
      const itemsData = [];
      for (let i = 0; i < productoEls.length; i++) {
        const pid = productoEls[i].value;
        const qty = parseInt(cantidadEls[i].value) || 0;
        if (!pid) { showToast('Selecciona un producto en cada fila','warning'); throw new Error(); }
        if (qty < 1) { showToast('La cantidad debe ser mayor a 0','warning'); throw new Error(); }
        itemsData.push({ idproducto: parseInt(pid), cantidad: qty });
      }
      if (!itemsData.length) { showToast('Agrega al menos un producto','warning'); throw new Error(); }

      // Insertar solicitud
      const { data: sol, error: e1 } = await db.from('solicitudes').insert({
        idusuario: currentUser.id,
        fechasolicitud: new Date().toISOString(),
        estado: 'Pendiente',
        prioridad: getVal('f_prioridad'),
        comentarios: getVal('f_comentarios'),
      }).select();
      if (e1) { showToast('Error: ' + e1.message, 'error'); throw e1; }

      // Insertar detalle
      const detalles = itemsData.map(it => ({ idsolicitud: sol[0].idsolicitud, idproducto: it.idproducto, cantidad: it.Cantidad }));
      const { error: e2 } = await db.from('solicituddetalle').insert(detalles);
      if (e2) { showToast('Solicitud creada pero error en detalle: ' + e2.message, 'warning'); }
      else showToast('Solicitud creada correctamente');
    }
    renderSolicitudes();
  });

  // Inicializar ítems después de montar el DOM
  setTimeout(() => {
    renderItems();
    document.getElementById('addItemBtn')?.addEventListener('click', () => {
      items.push({ id: Date.now() });
      renderItems();
    });
  }, 50);
}

// ======================= FORMULARIO: DEPARTAMENTO =======================
async function abrirFormDepartamento(deptoExistente = null) {
  const esEdicion = !!deptoExistente;
  const d = deptoExistente || {};
  const body = formInput('f_nombre','Nombre del departamento','text','Ej: Recursos Humanos',true, d.nombre||'');
  openFormModal(esEdicion ? 'Editar Departamento' : 'Nuevo Departamento', body, async () => {
    if (!validateRequired([['f_nombre','nombre']])) throw new Error();
    const payload = { nombre: getVal('f_nombre') };
    let error;
    if (esEdicion) ({ error } = await db.from('departamentos').update(payload).eq('iddepartamento', d.iddepartamento));
    else           ({ error } = await db.from('departamentos').insert(payload));
    if (error) { showToast('Error: ' + error.message, 'error'); throw error; }
    showToast(esEdicion ? 'Departamento actualizado' : 'Departamento creado');
  });
}

// ======================= FORMULARIO: ROL =======================
async function abrirFormRol(rolExistente = null) {
  const esEdicion = !!rolExistente;
  const r = rolExistente || {};
  const body = formInput('f_nombre','Nombre del rol','text','Ej: Supervisor',true, r.nombrerol||'');
  openFormModal(esEdicion ? 'Editar Rol' : 'Nuevo Rol', body, async () => {
    if (!validateRequired([['f_nombre','Nombre del rol']])) throw new Error();
    const payload = { nombrerol: getVal('f_nombre') };
    let error;
    if (esEdicion) ({ error } = await db.from('roles').update(payload).eq('idrol', r.idrol));
    else           ({ error } = await db.from('roles').insert(payload));
    if (error) { showToast('Error: ' + error.message, 'error'); throw error; }
    showToast(esEdicion ? 'Rol actualizado' : 'Rol creado');
  });
}

// ======================= RENDERIZADO =======================
function renderSolicitudesConDatos(solicitudes) {
  showLoader(false);
  let rows = '';
  for (const sol of solicitudes) {
    const usuario = sol.usuarios ?? {};
    const depto   = usuario.departamentos ?? {};
    const badgeClass = { Pendiente:'badge-pendiente', Aprobada:'badge-aprobado', Rechazada:'badge-rechazado', Despachada:'badge-despachado' }[sol.estado] || '';
    rows += `
      <tr>
        <td>#${sol.idsolicitud}</td>
        <td>${usuario.Nombre ?? 'N/A'}</td>
        <td>${depto.Nombre ?? 'N/A'}</td>
        <td>${new Date(sol.fechasolicitud).toLocaleDateString('es-DO')}</td>
        <td>${sol.prioridad}</td>
        <td><span class="badge ${badgeClass}">${sol.estado}</span></td>
        <td style="display:flex;gap:6px">
          <button class="btn-secondary editar-sol" data-id="${sol.idsolicitud}" style="padding:6px 10px;font-size:0.8rem">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-secondary eliminar-sol" data-id="${sol.idsolicitud}" style="padding:6px 10px;font-size:0.8rem;color:#ef4444">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
  }
  const tbody = document.querySelector('.data-table tbody');
  if (tbody) tbody.innerHTML = rows || '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:32px">Sin resultados</td></tr>';

  // Eventos editar solicitud
  document.querySelectorAll('.editar-sol').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const { data } = await db.from('solicitudes').select('*').eq('idsolicitud', id).single();
      if (data) abrirFormSolicitud(data);
    });
  });

  // Eventos eliminar solicitud
  document.querySelectorAll('.eliminar-sol').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      showModal('Eliminar solicitud', `¿Eliminar la solicitud #${id}? Esta acción no se puede deshacer.`, async () => {
        await db.from('solicituddetalle').delete().eq('idsolicitud', id);
        const { error } = await db.from('solicitudes').delete().eq('idsolicitud', id);
        if (error) showToast('Error al eliminar','error');
        else { showToast('Solicitud eliminada','warning'); renderSolicitudes(); }
      });
    });
  });
}

async function renderDashboard() {
  showLoader(true);
  try {
    const [stats, alertas] = await Promise.all([fetchDashboardStats(), fetchAlertasInventario()]);
    document.getElementById('dynamicContent').innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><h3>Solicitudes Pendientes</h3><div class="stat-number">${stats.pendientes}</div></div>
        <div class="stat-card"><h3>Aprobadas Este Mes</h3><div class="stat-number">${stats.aprobadasMes}</div></div>
        <div class="stat-card"><h3>Rechazadas</h3><div class="stat-number">${stats.rechazadas}</div></div>
        <div class="stat-card"><h3>Despachadas</h3><div class="stat-number">${stats.despachadas}</div></div>
      </div>
      <div class="card" style="background:white;border-radius:20px;padding:24px;margin-top:16px;box-shadow:0 1px 3px rgba(0,0,0,.05)">
        <h3 style="margin-bottom:16px;font-size:1rem">⚠️ Alertas de Inventario</h3>
        ${alertas.length
          ? `<div style="display:flex;flex-direction:column;gap:10px">
              ${alertas.map(a => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#fef2f2;border-radius:12px;border:1px solid #fecaca">
                  <strong style="color:#0f172a">${a.Nombre}</strong>
                  <span style="color:#b91c1c;font-size:0.85rem;font-weight:600">Stock: ${a.stockactual} / Mín: ${a.stockminimo}</span>
                </div>`).join('')}
            </div>`
          : '<p style="color:#64748b">✅ Sin alertas de inventario</p>'}
      </div>`;
  } catch(err) {
    console.error(err); showError('No se pudo cargar el dashboard.');
  } finally { showLoader(false); }
}

async function renderSolicitudes() {
  showLoader(true);
  try {
    const solicitudes = await fetchSolicitudes();
    document.getElementById('dynamicContent').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <i class="fas fa-filter" style="color:#94a3b8"></i>
          <span style="font-size:0.9rem;color:#64748b;font-weight:500">Filtrar por estado:</span>
          ${['Todos','Pendiente','Aprobada','Rechazada','Despachada'].map(e =>
            `<button class="filtro-btn btn-secondary" data-estado="${e}"
              style="padding:6px 16px;font-size:0.85rem;border-radius:40px;
              ${e==='Todos'?'background:#3b82f6;color:white;border-color:#3b82f6':''}">${e}</button>`
          ).join('')}
        </div>
        <button id="nuevaSolicitudBtn" class="btn-primary">
          <i class="fas fa-plus"></i> Nueva Solicitud
        </button>
      </div>
      <table class="data-table">
        <thead><tr>
          <th>ID</th><th>Solicitante</th><th>Departamento</th>
          <th>Fecha</th><th>Prioridad</th><th>Estado</th><th>Acciones</th>
        </tr></thead>
        <tbody></tbody>
      </table>`;

    renderSolicitudesConDatos(solicitudes);

    document.getElementById('nuevaSolicitudBtn')?.addEventListener('click', () => abrirFormSolicitud());

    document.querySelectorAll('.filtro-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        document.querySelectorAll('.filtro-btn').forEach(b => {
          b.style.background=''; b.style.color=''; b.style.borderColor='';
        });
        btn.style.background='#3b82f6'; btn.style.color='white'; btn.style.borderColor='#3b82f6';
        showLoader(true);
        try { renderSolicitudesConDatos(await fetchSolicitudes(btn.dataset.estado)); }
        finally { showLoader(false); }
      });
    });
  } catch(err) {
    console.error(err); showError('No se pudieron cargar las solicitudes.');
  } finally { showLoader(false); }
}

async function renderInventario() {
  showLoader(true);
  try {
    const productos = await fetchInventario();
    let rows = '';
    productos.forEach(p => {
      const critico = p.stockactual < p.stockminimo;
      rows += `<tr>
        <td><strong>${p.nombre}</strong>${p.Descripcion ? `<br><small style="color:#94a3b8">${p.Descripcion}</small>` : ''}</td>
        <td>${p.stockactual}</td>
        <td>${p.stockminimo}</td>
        <td><span class="badge ${critico ? 'badge-rechazado' : 'badge-aprobado'}">${critico ? 'Crítico' : 'Normal'}</span></td>
        <td><span class="badge ${p.activo ? 'badge-aprobado' : 'badge-pendiente'}">${p.activo ? 'activo' : 'Inactivo'}</span></td>
        <td style="display:flex;gap:6px">
          <button class="btn-secondary editar-prod" data-id="${p.idproducto}" style="padding:6px 10px;font-size:0.8rem">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-secondary eliminar-prod" data-id="${p.idproducto}" style="padding:6px 10px;font-size:0.8rem;color:#ef4444">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
    });

    document.getElementById('dynamicContent').innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
        <button id="nuevoProductoBtn" class="btn-primary"><i class="fas fa-plus"></i> Agregar Producto</button>
      </div>
      <table class="data-table">
        <thead><tr>
          <th>Producto</th><th>Stock Actual</th><th>Stock Mínimo</th>
          <th>Estado Stock</th><th>Activo</th><th>Acciones</th>
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:32px">Sin productos registrados</td></tr>'}</tbody>
      </table>`;

    document.getElementById('nuevoProductoBtn')?.addEventListener('click', () => abrirFormProducto());

    document.querySelectorAll('.editar-prod').forEach(btn => {
      btn.addEventListener('click', async () => {
        const { data } = await db.from('productos').select('*').eq('idproducto', btn.dataset.id).single();
        if (data) abrirFormProducto(data);
      });
    });

    document.querySelectorAll('.eliminar-prod').forEach(btn => {
      btn.addEventListener('click', () => {
        showModal('Eliminar producto', '¿Eliminar este producto del inventario?', async () => {
          const { error } = await db.from('productos').delete().eq('idproducto', btn.dataset.id);
          if (error) showToast('Error al eliminar: ' + error.message,'error');
          else { showToast('Producto eliminado','warning'); renderInventario(); }
        });
      });
    });
  } catch(err) {
    console.error(err); showError('No se pudo cargar el inventario.');
  } finally { showLoader(false); }
}

async function renderDespacho() {
  showLoader(true);
  try {
    const solicitudes = await fetchSolicitudesParaDespachar();
    let cards = '';
    solicitudes.forEach(sol => {
      cards += `
        <div class="despacho-card" style="background:white;border-radius:20px;padding:20px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,.05)">
          <h4>Solicitud #${sol.idsolicitud}</h4>
          <p style="margin:8px 0;color:#475569">
            Solicitante: <strong>${sol.usuarios?.Nombre ?? 'N/A'}</strong>
            (${sol.usuarios?.Departamentos?.Nombre ?? 'N/A'})
          </p>
          <button class="btn-primary despachar-btn" data-id="${sol.idsolicitud}">
            <i class="fas fa-truck"></i> Confirmar Despacho
          </button>
        </div>`;
    });
    document.getElementById('dynamicContent').innerHTML =
      `<div class="despacho-grid">${cards || '<p style="color:#64748b">No hay solicitudes aprobadas pendientes.</p>'}</div>`;

    document.querySelectorAll('.despachar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        showModal('Confirmar Despacho', `¿Registrar despacho para la solicitud #${id}?`, async () => {
          showLoader(true);
          try {
            await registrarDespacho(id, currentUser.id, []);
            showToast('Despacho registrado correctamente');
          } catch(err) {
            console.error(err); showToast('Error al despachar','error');
          } finally { showLoader(false); }
          renderDespacho();
        });
      });
    });
  } catch(err) {
    console.error(err); showError('No se pudo cargar el módulo de despacho.');
  } finally { showLoader(false); }
}

async function renderUsuarios() {
  showLoader(true);
  try {
    const usuarios = await fetchUsuarios();
    let rows = '';
    usuarios.forEach(u => {
      rows += `<tr>
        <td><strong>${u.nombre}</strong></td>
        <td>${u.correo}</td>
        <td>${u.roles?.nombrerol ?? 'Sin rol'}</td>
        <td>${u.departamentos?.Nombre ?? '—'}</td>
        <td><span class="badge ${u.activo ? 'badge-aprobado' : 'badge-rechazado'}">${u.activo ? 'activo' : 'Inactivo'}</span></td>
        <td style="display:flex;gap:6px">
          <button class="btn-secondary editar-usr" data-id="${u.idusuario}" style="padding:6px 10px;font-size:0.8rem">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-secondary eliminar-usr" data-id="${u.idusuario}" style="padding:6px 10px;font-size:0.8rem;color:#ef4444">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
    });

    document.getElementById('dynamicContent').innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
        <button id="nuevoUsuarioBtn" class="btn-primary"><i class="fas fa-plus"></i> Nuevo Usuario</button>
      </div>
      <table class="data-table">
        <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Departamento</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:32px">Sin usuarios</td></tr>'}</tbody>
      </table>`;

    document.getElementById('nuevoUsuarioBtn')?.addEventListener('click', () => abrirFormUsuario());

    document.querySelectorAll('.editar-usr').forEach(btn => {
      btn.addEventListener('click', async () => {
        const { data } = await db.from('usuarios').select('*').eq('idusuario', btn.dataset.id).single();
        if (data) abrirFormUsuario(data);
      });
    });

    document.querySelectorAll('.eliminar-usr').forEach(btn => {
      btn.addEventListener('click', () => {
        showModal('Eliminar usuario', '¿Eliminar este usuario del sistema?', async () => {
          const { error } = await db.from('usuarios').delete().eq('idusuario', btn.dataset.id);
          if (error) showToast('Error: ' + error.message,'error');
          else { showToast('Usuario eliminado','warning'); renderUsuarios(); }
        });
      });
    });
  } catch(err) {
    console.error(err); showError('No se pudo cargar la lista de usuarios.');
  } finally { showLoader(false); }
}

// ======================= NAVEGACIÓN =======================
function loadSection(sectionId) {
  currentSection = sectionId;
  document.getElementById('currentSectionTitle').innerText =
    sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
  document.querySelectorAll('.nav-item').forEach(item =>
    item.classList.toggle('active', item.dataset.section === sectionId)
  );
  const secciones = {
    dashboard: renderDashboard, solicitudes: renderSolicitudes,
    inventario: renderInventario, despacho: renderDespacho, usuarios: renderUsuarios,
  };
  (secciones[sectionId] ?? renderDashboard)();
}

// ======================= CSS DINÁMICO (animaciones del modal) =======================
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
  @keyframes slideUp { from { transform:translateY(20px);opacity:0 } to { transform:translateY(0);opacity:1 } }
  @keyframes slideIn { from { transform:translateX(20px);opacity:0 } to { transform:translateX(0);opacity:1 } }
  #formModal input:focus, #formModal select:focus, #formModal textarea:focus {
    border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1);
  }
`;
document.head.appendChild(style);

// ======================= INICIALIZACIÓN =======================
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-item').forEach(item =>
    item.addEventListener('click', () => loadSection(item.dataset.section))
  );
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    showModal('Cerrar sesión', '¿Estás seguro que deseas salir?', async () => {
      await db.auth.signOut();
      window.location.reload();
    });
  });
  loadSection('dashboard');
});