const CLAVE = 'recreo-demo-v1';
const PIN = '123456';
const HORAS = ['15:00', '15:40', '16:20', '17:00', '17:40', '18:20', '19:00'];
const OBRAS = [
  { id: 'particular', etiqueta: 'Particular', formato: 'ninguno' },
  { id: 'ioma', etiqueta: 'IOMA', formato: 'ioma' },
  { id: 'pami', etiqueta: 'PAMI', formato: 'pami' },
  { id: 'osde', etiqueta: 'OSDE', formato: 'libre' },
  { id: 'swiss', etiqueta: 'Swiss Medical', formato: 'libre' },
  { id: 'galeno', etiqueta: 'Galeno', formato: 'libre' },
  { id: 'osecac', etiqueta: 'OSECAC', formato: 'libre' },
  { id: 'omint', etiqueta: 'OMINT', formato: 'libre' },
  { id: 'medife', etiqueta: 'Medifé', formato: 'libre' },
];
const NINOS = [
  { nombre: 'Sofía', apellido: 'Luna', dni: '45111222', obra: 'IOMA', nro: '12345678901' },
  { nombre: 'Mateo', apellido: 'Ruiz', dni: '44999888', obra: 'OSDE', nro: '1122334455' },
  { nombre: 'Valentina', apellido: 'Gómez', dni: '46222333', obra: 'PAMI', nro: '27123456789012' },
  { nombre: 'Benjamín', apellido: 'Torres', dni: '43888777', obra: 'Particular', nro: '' },
  { nombre: 'Emma', apellido: 'Díaz', dni: '47000111', obra: 'Galeno', nro: '556677' },
  { nombre: 'Thiago', apellido: 'Romero', dni: '45555444', obra: 'OSECAC', nro: '998877' },
];
const INICIO = {
  marca: 'Recreo',
  profesional: 'Mónica Escobar',
  matricula: '',
  direccion: 'San Martín 36, San Nicolás de los Arroyos',
  bajada: 'Espacio terapéutico para niños y adolescentes. El turno es para quien va a la sesión.',
  logo: 'image/logo.png',
};

const app = document.querySelector('#app');
let memoria = null;

function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (caracter) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[caracter]));
}

function hoyBA() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function horaAhora() {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const mapa = {};
  for (const parte of partes) mapa[parte.type] = parte.value;
  return `${mapa.hour}:${mapa.minute}`;
}

function sumar(fecha, dias) {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia + dias)).toISOString().slice(0, 10);
}

function weekday(fecha) {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
}

function larga(fecha) {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const texto = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(Date.UTC(anio, mes - 1, dia, 15)));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function partesFecha(fecha) {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const partes = {};
  for (const parte of new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).formatToParts(new Date(Date.UTC(anio, mes - 1, dia, 15)))) {
    partes[parte.type] = parte.value;
  }
  return { semana: (partes.weekday || '').replace('.', ''), numero: partes.day || '' };
}

function habiles(desde, cantidad) {
  const dias = [];
  let fecha = desde;
  while (dias.length < cantidad) {
    const numero = weekday(fecha);
    if (numero !== 0 && numero !== 6) dias.push(fecha);
    fecha = sumar(fecha, 1);
  }
  return dias;
}

function limpiarNombre(valor) {
  return String(valor || '').trim().replace(/\s+/g, ' ').slice(0, 60);
}

function validarDni(valor) {
  const dni = String(valor || '').replace(/\D/g, '');
  if (!/^\d{7,8}$/.test(dni) || /^0+$/.test(dni)) {
    return { ok: false, error: 'El DNI tiene 7 u 8 números, sin puntos.' };
  }
  return { ok: true, dni };
}

function nota(texto, clase) {
  if (!texto) return '';
  return `<div class="nota ${clase || ''}" role="status"><p>${esc(texto)}</p></div>`;
}

function pistaObra(obra, otra) {
  if (otra) return 'Como figura en el carnet.';
  if (!obra) return 'Elegí la obra social para ver cómo cargar el número.';
  if (obra.formato === 'pami') return '14 números del carnet. En la demo alcanza con escribirlos.';
  if (obra.formato === 'ioma') return 'Números del carnet de IOMA, sin la barra.';
  if (obra.formato === 'ninguno') return '';
  return 'Como figura en el carnet.';
}

function codigoNuevo() {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = '';
  for (let i = 0; i < 5; i += 1) codigo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  return codigo;
}

function leer() {
  if (memoria) return memoria;
  try {
    const crudo = localStorage.getItem(CLAVE);
    memoria = crudo ? JSON.parse(crudo) : null;
  } catch {
    memoria = null;
  }
  return memoria;
}

function guardar(data) {
  memoria = data;
  try { localStorage.setItem(CLAVE, JSON.stringify(data)); } catch { /* la demo sigue en memoria */ }
}

function muestras(hoy) {
  const dias = habiles(hoy, 4);
  const plan = [
    [0, '15:00', 0, 'Sesión', 40, 'K7M2P'],
    [0, '16:20', 1, 'Sesión', 40, 'R4N8Q'],
    [0, '19:00', 2, 'Primera consulta', 40, 'T3W6L'],
    [1, '15:40', 3, 'Sesión', 40, 'B9H2C'],
    [1, '17:00', 4, 'Sesión', 40, 'E5J7V'],
    [2, '16:20', 5, 'Primera consulta', 40, 'G8P3D'],
    [2, '19:00', 0, 'Sesión', 40, 'S2L9A'],
    [3, '15:00', 1, 'Sesión', 40, 'H6C4N'],
    [3, '17:40', 4, 'Sesión', 40, 'M3Q8T'],
  ];
  return plan.filter((item) => dias[item[0]]).map((item, indice) => ({
    id: `muestra-${indice}`,
    origen: 'muestra',
    fecha: dias[item[0]],
    hora: item[1],
    patologia: item[3],
    minutos: item[4],
    codigo: item[5],
    estado: 'reservado',
    ...NINOS[item[2]],
  }));
}

function base() {
  const hoy = hoyBA();
  const previo = leer();
  if (previo && previo.dia === hoy && Array.isArray(previo.turnos)) return previo;
  const propios = (previo?.turnos || []).filter((turno) => turno.origen === 'demo' && turno.fecha >= hoy && turno.estado !== 'cancelado');
  const data = { dia: hoy, turnos: [...muestras(hoy), ...propios] };
  guardar(data);
  return data;
}

function activosEn(fecha) {
  return base().turnos.filter((turno) => turno.fecha === fecha && turno.estado !== 'cancelado');
}

function turnoVigente(dni) {
  const hoy = hoyBA();
  const ahora = horaAhora();
  return base().turnos
    .filter((turno) => turno.dni === dni && ['reservado', 'confirmado'].includes(turno.estado))
    .filter((turno) => turno.fecha > hoy || (turno.fecha === hoy && turno.hora >= ahora))
    .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`))[0] || null;
}

function horasLibres(fecha, { paraFamilia } = {}) {
  const tomadas = new Set(activosEn(fecha).map((turno) => turno.hora));
  const ahora = horaAhora();
  return HORAS.filter((hora) => {
    if (tomadas.has(hora)) return false;
    if (paraFamilia && fecha === hoyBA() && hora <= ahora) return false;
    return true;
  });
}

function diasAbiertos() {
  return habiles(hoyBA(), 10)
    .map((fecha) => ({ fecha, horas: horasLibres(fecha, { paraFamilia: true }) }))
    .filter((dia) => dia.horas.length)
    .slice(0, 8);
}

function obraPorId(id) {
  return OBRAS.find((obra) => obra.id === id) || null;
}

function buscarObras(texto) {
  const q = String(texto || '').trim().toLocaleLowerCase('es');
  if (!q) return OBRAS;
  return OBRAS.filter((obra) => obra.etiqueta.toLocaleLowerCase('es').includes(q));
}

function obrasHtml(lista) {
  const items = lista.map((obra) => `<button type="button" class="obra" data-obra="${obra.id}"><span class="sigla">${esc(obra.etiqueta)}</span></button>`).join('');
  return `${items}<button type="button" class="obra" data-accion="obra-otra"><span class="sigla">Otra</span><span class="legal">No está en la lista. La escribo yo.</span></button>`;
}

function marca() {
  return `<div class="lockup">
    <img class="mark" src="${esc(INICIO.logo)}" alt="">
    <div>
      <p class="marca">${esc(INICIO.marca)}</p>
      <h1>${esc(INICIO.profesional)}</h1>
      <p class="matricula">Psicóloga · Niños y adolescentes</p>
    </div>
  </div>`;
}

function revisar(form, obra, otra) {
  const nombre = limpiarNombre(form.nombre);
  const apellido = limpiarNombre(form.apellido);
  const documento = validarDni(form.dni);
  const errores = [];
  if (!nombre) errores.push('Escribí el nombre.');
  if (!apellido) errores.push('Escribí el apellido.');
  if (!documento.ok) errores.push(documento.error);
  const obraOtra = String(form.obraOtra || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  if (otra) {
    if (!obraOtra) errores.push('Escribí la obra social.');
  } else if (!obra) {
    errores.push('Elegí la obra social.');
  }
  const formato = otra ? 'libre' : obra?.formato;
  const nro = String(form.nro || '').trim();
  if (!errores.length && formato !== 'ninguno' && nro.length < 4) errores.push('Escribí el número de afiliado.');
  return {
    ok: errores.length === 0,
    errores,
    datos: {
      nombre,
      apellido,
      dni: documento.dni || '',
      obra: otra ? obraOtra : (obra?.etiqueta || ''),
      nro: formato === 'ninguno' ? '' : nro,
    },
  };
}

function publico(turno) {
  return {
    ...turno,
    cuando: larga(turno.fecha),
  };
}

if (document.body.classList.contains('paciente') && app) {
  const state = {
    paso: 'datos',
    form: { nombre: '', apellido: '', dni: '', nro: '', obraOtra: '' },
    obra: null,
    otra: false,
    dias: [],
    fecha: '',
    hora: '',
    turno: null,
    vigente: null,
    error: '',
    cargando: false,
    sheet: false,
    obras: OBRAS,
    buscar: '',
    codigoCancelar: '',
  };

  function pantallaDatos() {
    const obra = state.obra;
    const esconderNumero = obra?.formato === 'ninguno' && !state.otra;
    return `<div class="ficha">
      ${marca()}
      <p class="direccion">${esc(INICIO.direccion)}</p>
      <p class="bajada">${esc(INICIO.bajada)}</p>
      <div class="pasos" aria-hidden="true"><span class="on"></span><span></span></div>
      <div class="par">
        <div>
          <label for="nombre">Nombre</label>
          <input id="nombre" data-field="nombre" autocomplete="given-name" maxlength="60" value="${esc(state.form.nombre)}">
        </div>
        <div>
          <label for="apellido">Apellido</label>
          <input id="apellido" data-field="apellido" autocomplete="family-name" maxlength="60" value="${esc(state.form.apellido)}">
        </div>
      </div>
      <p class="pista">Nombre y DNI de quien va a la sesión. Puede anotarlo un adulto.</p>
      <label for="dni">DNI</label>
      <input id="dni" data-field="dni" inputmode="numeric" autocomplete="off" maxlength="12" value="${esc(state.form.dni)}">
      <p class="etiqueta">Obra social</p>
      <button type="button" class="elegida" data-accion="abrir-obras">
        <strong>${esc(obra ? obra.etiqueta : state.otra ? 'Otra' : 'Elegir')}</strong>
        <span>Buscar</span>
      </button>
      ${state.otra ? `<label for="obraOtra">Cuál</label><input id="obraOtra" data-field="obraOtra" maxlength="80" value="${esc(state.form.obraOtra)}">` : ''}
      ${esconderNumero ? '' : `<label for="nro">Número de afiliado</label>
        <input id="nro" data-field="nro" inputmode="text" autocomplete="off" maxlength="24" value="${esc(state.form.nro)}">
        <p class="pista">${esc(pistaObra(obra, state.otra))}</p>`}
      <p class="etiqueta">Turno</p><p>Primera consulta · 40 min</p>
      ${nota(state.error, 'mal')}
      <div class="cierre">
        <button class="btn" type="button" data-accion="continuar">Ver turnos</button>
        <button class="btn claro" type="button" data-accion="ir-buscar">Ya tengo un turno</button>
      </div>
    </div>
    ${state.sheet ? `<div class="sheet">
      <h2>Obra social</h2>
      <p class="bajada">Algunas de las más usadas, para esta demo.</p>
      <label for="buscar-obra">Buscar</label>
      <input id="buscar-obra" data-field="buscar" placeholder="IOMA, PAMI, OSDE…" value="${esc(state.buscar)}">
      <div class="lista" id="lista-obras">${obrasHtml(state.obras)}</div>
      <button class="btn secundario" type="button" data-accion="cerrar-sheet">Cerrar</button>
    </div>` : ''}`;
  }

  function pantallaTurno() {
    const dia = state.dias.find((item) => item.fecha === state.fecha) || state.dias[0];
    const horas = dia?.horas || [];
    return `${marca()}
      <div class="pasos" aria-hidden="true"><span class="on"></span><span class="on"></span></div>
      <h2>Hola, ${esc(state.form.nombre)}.</h2>
      <p class="bajada">Estos horarios son en Recreo y duran 40 minutos. En la demo están armados de lunes a viernes, de 15 a 20.</p>
      ${state.dias.length ? `<div class="dias">${state.dias.map((item) => {
        const parte = partesFecha(item.fecha);
        return `<button type="button" class="dia ${item.fecha === dia.fecha ? 'on' : ''}" data-fecha="${esc(item.fecha)}"><small>${esc(parte.semana)}</small>${esc(parte.numero)}</button>`;
      }).join('')}</div>
        <div class="horas">${horas.map((hora) => `<button type="button" class="hora" data-hora="${esc(hora)}" aria-pressed="${hora === state.hora}">${esc(hora)}</button>`).join('')}</div>` : nota('Por ahora no hay horarios abiertos en Recreo.')}
      ${nota(state.error, 'mal')}
      <button class="btn" type="button" data-accion="reservar" ${state.hora ? '' : 'disabled'}>Confirmar turno</button>
      <button class="enlace" type="button" data-accion="volver-datos">Volver a los datos</button>`;
  }

  function pantallaListo() {
    const turno = state.turno;
    return `<div class="ficha">
      ${marca()}
      <div class="turno-cuerpo">
        <div>
          <p class="eyebrow">Turno reservado</p>
          <h2>Listo, ${esc(state.form.nombre)}.</h2>
        </div>
        <div class="turno-cuando">
          <p class="cuando-turno">${esc(turno.cuando)}</p>
          <p class="hora-grande">${esc(turno.hora)}</p>
          <p class="motivo-turno">Primera consulta · 40 min</p>
        </div>
        <p class="direccion">${esc(INICIO.direccion)}</p>
        <div>
          <div class="codigo"><p>Código para cancelar</p><b>${esc(turno.codigo)}</b></div>
          <p class="bajada">En la demo el turno queda solo en este navegador. Si abrís la agenda acá, lo vas a ver.</p>
        </div>
      </div>
      <div class="cierre">
        <a class="btn" href="agenda.html">Verlo en la agenda</a>
        <button class="btn peligro" type="button" data-accion="cancelar-recien">Cancelar turno</button>
      </div>
    </div>`;
  }

  function pantallaVigente() {
    const turno = state.vigente;
    if (!turno) {
      return `${marca()}
        <h2>No hay un turno activo con ese DNI.</h2>
        <button class="btn" type="button" data-accion="volver-datos">Sacar un turno</button>`;
    }
    return `${marca()}
      <p class="eyebrow">Turno reservado</p>
      <h2>${esc(larga(turno.fecha))}</h2>
      <p class="hora-grande">${esc(turno.hora)}</p>
      <p class="bajada">${esc(turno.patologia || 'Primera consulta')}${turno.minutos ? ` · ${esc(turno.minutos)} min` : ''}</p>
      <label for="codigo">Código de la reserva</label>
      <input id="codigo" data-field="codigoCancelar" maxlength="8" autocapitalize="characters" value="${esc(state.codigoCancelar)}">
      ${nota(state.error, 'mal')}
      <button class="btn secundario" type="button" data-accion="cancelar-codigo">Cancelar turno</button>
      <button class="enlace" type="button" data-accion="volver-datos">Volver</button>`;
  }

  function pantallaBuscar() {
    return `${marca()}
      <h2>Buscar mi turno</h2>
      <label for="dni">DNI</label>
      <input id="dni" data-field="dni" inputmode="numeric" maxlength="12" value="${esc(state.form.dni)}">
      ${nota(state.error, 'mal')}
      <button class="btn" type="button" data-accion="buscar-turno">Buscar</button>
      <button class="enlace" type="button" data-accion="volver-datos">Volver</button>`;
  }

  function render() {
    const pantallas = { datos: pantallaDatos, turno: pantallaTurno, listo: pantallaListo, vigente: pantallaVigente, buscar: pantallaBuscar };
    app.innerHTML = (pantallas[state.paso] || pantallaDatos)();
    app.classList.toggle('una', state.paso === 'datos' && !state.sheet);
    app.classList.toggle('listo', state.paso === 'listo');
    if (state.sheet) document.querySelector('#buscar-obra')?.focus();
  }

  function reservar() {
    const revision = revisar(state.form, state.obra, state.otra);
    if (!revision.ok) {
      state.error = revision.errores[0];
      state.paso = 'datos';
      return;
    }
    if (!state.hora || !state.fecha) {
      state.error = 'Elegí un día y un horario.';
      return;
    }
    const vigente = turnoVigente(revision.datos.dni);
    if (vigente) {
      state.vigente = vigente;
      state.paso = 'vigente';
      state.error = 'Ya tenés un turno. Para elegir otro, primero cancelá este.';
      return;
    }
    if (!horasLibres(state.fecha, { paraFamilia: true }).includes(state.hora)) {
      state.error = 'Ese horario ya no está disponible.';
      state.dias = diasAbiertos();
      state.fecha = state.dias[0]?.fecha || '';
      state.hora = '';
      return;
    }
    const turno = {
      id: `demo-${Date.now()}`,
      origen: 'demo',
      fecha: state.fecha,
      hora: state.hora,
      patologia: 'Primera consulta',
      minutos: 40,
      codigo: codigoNuevo(),
      estado: 'reservado',
      ...revision.datos,
    };
    const data = base();
    data.turnos.push(turno);
    guardar(data);
    state.turno = publico(turno);
    state.paso = 'listo';
    state.error = '';
  }

  function cancelar(codigo) {
    const documento = validarDni(state.form.dni);
    if (!documento.ok) {
      state.error = documento.error;
      return false;
    }
    const normal = String(codigo || '').trim().toUpperCase();
    const data = base();
    const turno = data.turnos.find((item) => item.dni === documento.dni && item.codigo.toUpperCase() === normal && ['reservado', 'confirmado'].includes(item.estado));
    if (!turno) {
      state.error = 'El código no coincide con un turno activo.';
      return false;
    }
    turno.estado = 'cancelado';
    guardar(data);
    state.turno = null;
    state.vigente = null;
    state.paso = 'datos';
    state.error = '';
    return true;
  }

  app.addEventListener('input', (evento) => {
    const campo = evento.target.dataset.field;
    if (!campo) return;
    if (campo === 'buscar') {
      state.buscar = evento.target.value;
      state.obras = buscarObras(state.buscar);
      const lista = document.querySelector('#lista-obras');
      if (lista) lista.innerHTML = obrasHtml(state.obras);
      return;
    }
    if (campo === 'codigoCancelar') state.codigoCancelar = evento.target.value;
    else state.form[campo] = evento.target.value;
  });

  app.addEventListener('click', (evento) => {
    const obraId = evento.target.closest('[data-obra]')?.dataset.obra;
    if (obraId) {
      state.obra = obraPorId(obraId);
      state.otra = false;
      state.sheet = false;
      state.error = '';
      render();
      return;
    }
    const fecha = evento.target.closest('[data-fecha]')?.dataset.fecha;
    if (fecha) {
      state.fecha = fecha;
      state.hora = '';
      render();
      return;
    }
    const hora = evento.target.closest('[data-hora]')?.dataset.hora;
    if (hora) {
      state.hora = hora;
      render();
      return;
    }
    const accion = evento.target.closest('[data-accion]')?.dataset.accion;
    if (!accion) return;
    if (accion === 'abrir-obras') {
      state.sheet = true;
      state.buscar = '';
      state.obras = OBRAS;
      render();
    } else if (accion === 'cerrar-sheet') {
      state.sheet = false;
      render();
    } else if (accion === 'obra-otra') {
      state.otra = true;
      state.obra = null;
      state.sheet = false;
      render();
    } else if (accion === 'continuar') {
      const revision = revisar(state.form, state.obra, state.otra);
      if (!revision.ok) {
        state.error = revision.errores[0];
        render();
        return;
      }
      const vigente = turnoVigente(revision.datos.dni);
      if (vigente) {
        state.vigente = vigente;
        state.paso = 'vigente';
        state.error = 'Ya tenés un turno. Para elegir otro, primero cancelá este.';
        render();
        return;
      }
      state.dias = diasAbiertos();
      state.fecha = state.dias[0]?.fecha || '';
      state.hora = '';
      state.paso = 'turno';
      state.error = '';
      render();
    } else if (accion === 'volver-datos') {
      state.paso = 'datos';
      state.error = '';
      render();
    } else if (accion === 'reservar') {
      reservar();
      render();
    } else if (accion === 'ir-buscar') {
      state.paso = 'buscar';
      state.error = '';
      render();
    } else if (accion === 'buscar-turno') {
      const documento = validarDni(state.form.dni);
      if (!documento.ok) {
        state.error = documento.error;
        render();
        return;
      }
      state.form.dni = documento.dni;
      state.vigente = turnoVigente(documento.dni);
      state.paso = 'vigente';
      state.error = '';
      render();
    } else if (accion === 'cancelar-codigo' || accion === 'cancelar-recien') {
      const codigo = accion === 'cancelar-recien' ? state.turno?.codigo : state.codigoCancelar;
      if (cancelar(codigo)) {
        render();
        app.insertAdjacentHTML('beforeend', nota('El turno quedó cancelado. Podés elegir otro.', 'bien'));
      } else render();
    }
  });

  render();
}

if (document.body.classList.contains('admin') && app) {
  const state = {
    authed: sessionStorage.getItem('recreo-demo-sesion') === 'ok',
    pin: '',
    error: '',
    tab: 'agenda',
    fecha: hoyBA(),
    abierto: null,
    anotar: null,
    mensaje: '',
    mensajeMal: false,
    consulta: '',
    pacienteAbierto: null,
  };

  function nav() {
    if (!state.authed) return '';
    const item = (id, texto) => `<button type="button" data-tab="${id}" aria-current="${state.tab === id ? 'page' : 'false'}">${texto}</button>`;
    return `<nav class="nav">${item('agenda', 'Agenda')}${item('horarios', 'Horarios')}${item('pacientes', 'Pacientes')}${item('mas', 'Más')}</nav>`;
  }

  function login() {
    const puntos = [0, 1, 2, 3, 4, 5].map((i) => `<i class="${i < state.pin.length ? 'on' : ''}"></i>`).join('');
    const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((tecla) => (
      tecla ? `<button type="button" class="tecla" data-tecla="${tecla}">${tecla}</button>` : '<span class="tecla vacia"></span>'
    )).join('');
    return `<div class="lockup">
        <img class="mark" src="${esc(INICIO.logo)}" alt="">
        <div>
          <p class="marca">Recreo</p>
          <h1>Agenda</h1>
        </div>
      </div>
      <p class="bajada">${esc(INICIO.profesional)} · en esta demo la clave es 123456.</p>
      <div class="puntos" aria-label="Clave">${puntos}</div>
      <div class="teclado">${teclas}</div>
      ${nota(state.error, 'mal')}`;
  }

  function agenda() {
    const fecha = state.fecha;
    const finDeSemana = weekday(fecha) === 0 || weekday(fecha) === 6;
    const turnos = activosEn(fecha).sort((a, b) => a.hora.localeCompare(b.hora));
    const libres = finDeSemana || fecha < hoyBA()
      ? []
      : horasLibres(fecha).filter((hora) => fecha > hoyBA() || hora > horaAhora());
    const eventos = [
      ...turnos.map((turno) => ({ tipo: 'turno', desde: turno.hora, turno })),
      ...libres.map((hora) => ({ tipo: 'libre', desde: hora })),
    ].sort((a, b) => a.desde.localeCompare(b.desde));
    const lista = eventos.map((evento) => {
      if (evento.tipo === 'libre') {
        return `<button type="button" class="libre" data-hora-libre="${esc(evento.desde)}">${esc(evento.desde)} · Libre, anotar un turno</button>`;
      }
      const turno = evento.turno;
      const abierto = state.abierto === turno.id;
      return `<article class="turno" data-turno="${esc(turno.id)}">
        <div class="fila"><span>${esc(turno.hora)}</span><span>${esc(turno.estado)}</span></div>
        <div class="quien">${esc(turno.apellido)}, ${esc(turno.nombre)}</div>
        <div class="detalle">${esc(turno.patologia || 'Sesión')} · ${esc(turno.minutos || 40)} min</div>
        <div class="detalle">${esc(turno.obra)} · DNI ${esc(turno.dni)}</div>
        ${abierto ? `<div class="detalle">Afiliado ${esc(turno.nro || '—')} · código ${esc(turno.codigo)}</div>
          <div class="acciones">
            <button type="button" class="chico" data-estado="confirmado" data-id="${esc(turno.id)}">Cobertura ok</button>
            <button type="button" class="chico" data-estado="atendido" data-id="${esc(turno.id)}">Atendido</button>
            <button type="button" class="chico" data-estado="ausente" data-id="${esc(turno.id)}">No vino</button>
            <button type="button" class="texto peligro" data-estado="cancelado" data-id="${esc(turno.id)}">Cancelar</button>
          </div>` : ''}
      </article>`;
    }).join('');
    const anotar = state.anotar;
    const formulario = anotar ? `<section class="caja" id="anotar">
      <h3>Anotar ${esc(anotar.hora)}</h3>
      <label for="a-nombre">Nombre</label><input id="a-nombre" data-anotar="nombre" value="${esc(anotar.nombre)}">
      <label for="a-apellido">Apellido</label><input id="a-apellido" data-anotar="apellido" value="${esc(anotar.apellido)}">
      <label for="a-dni">DNI</label><input id="a-dni" data-anotar="dni" inputmode="numeric" maxlength="8" value="${esc(anotar.dni)}">
      <label for="a-obra">Obra social</label>
      <select id="a-obra" data-anotar="obra">${OBRAS.map((obra) => `<option value="${obra.id}" ${anotar.obraId === obra.id ? 'selected' : ''}>${esc(obra.etiqueta)}</option>`).join('')}<option value="otra" ${anotar.obraId === 'otra' ? 'selected' : ''}>Otra</option></select>
      ${anotar.obraId === 'otra' ? `<label for="a-otra">Cuál</label><input id="a-otra" data-anotar="obraOtra" value="${esc(anotar.obraOtra)}">` : ''}
      ${anotar.obraId === 'particular' ? '' : `<label for="a-nro">Número de afiliado</label><input id="a-nro" data-anotar="nro" value="${esc(anotar.nro)}">`}
      ${nota(anotar.error, 'mal')}
      <button class="btn" type="button" data-accion="guardar-anotar">Guardar turno</button>
      <button class="enlace" type="button" data-accion="cerrar-anotar">Cerrar</button>
    </section>` : '';
    return `<div class="lienzo"><div class="lado"><div class="dia-nav">
        <button type="button" class="flecha" data-accion="dia-anterior" aria-label="Día anterior">‹</button>
        <div><p class="eyebrow">Agenda</p><h2>${esc(larga(fecha))}</h2></div>
        <button type="button" class="flecha" data-accion="dia-siguiente" aria-label="Día siguiente">›</button>
      </div>
      <p class="bajada">Recreo: ${finDeSemana ? 'sábado y domingo no' : '15:00–20:00'}.</p>
      ${fecha === hoyBA() ? '' : '<button class="btn secundario chico" type="button" data-accion="hoy">Volver a hoy</button>'}
      ${lista || '<p class="vacio">Este día no tiene nada cargado.</p>'}
      ${formulario}
      ${nota(state.mensaje, state.mensajeMal ? 'mal' : 'bien')}
    </div></div>`;
  }

  function horarios() {
    const nombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const filas = nombres.map((nombre, indice) => {
      const abierto = indice >= 1 && indice <= 5;
      return `<article class="banda ${abierto ? '' : 'cerrado'}"><strong>${nombre}</strong><div>${abierto ? '15:00–20:00 · Recreo' : 'Cerrado'}</div></article>`;
    }).join('');
    return `<p class="eyebrow">Horarios</p><h2>La semana en Recreo</h2>
      <p class="bajada">De lunes a viernes, de 15 a 20. Sábado y domingo no. En el consultorio Mónica cambia estas franjas desde esta pantalla. En la demo quedan fijas para poder mostrarlas.</p>
      ${filas}`;
  }

  function pacientes() {
    const q = state.consulta.trim().toLocaleLowerCase('es');
    const mapa = new Map();
    for (const turno of base().turnos) {
      if (turno.estado === 'cancelado') continue;
      const actual = mapa.get(turno.dni);
      if (!actual || `${turno.fecha}${turno.hora}` < `${actual.fecha}${actual.hora}`) mapa.set(turno.dni, turno);
    }
    const lista = [...mapa.values()]
      .filter((turno) => !q || `${turno.apellido} ${turno.nombre} ${turno.dni}`.toLocaleLowerCase('es').includes(q))
      .sort((a, b) => a.apellido.localeCompare(b.apellido, 'es'));
    const filas = lista.map((turno) => `<tr class="fila-paciente ${state.pacienteAbierto === turno.dni ? 'abierta' : ''}" data-paciente="${esc(turno.dni)}">
      <td>
        <p class="nombre-paciente">${esc(turno.apellido)}, ${esc(turno.nombre)}</p>
        <div class="detalle">DNI ${esc(turno.dni)} · ${esc(turno.obra)}</div>
        <div class="detalle">${esc(turno.nro || 'Sin número')}</div>
        ${state.pacienteAbierto === turno.dni ? `<div class="detalle">Próximo turno: ${esc(larga(turno.fecha))} · ${esc(turno.hora)} · código ${esc(turno.codigo)}</div>` : ''}
      </td>
    </tr>`).join('');
    return `<p class="eyebrow">Pacientes</p>
      <h2>Niños y adolescentes</h2>
      <label for="q">Buscar</label>
      <input id="q" data-consulta value="${esc(state.consulta)}" placeholder="Apellido o DNI">
      ${filas ? `<table class="tabla pacientes"><tbody>${filas}</tbody></table>` : '<p class="vacio">Nadie coincide con esa búsqueda.</p>'}
      <p class="pista">Las fotos, los PDF y la historia clínica viven en la agenda real. Acá se muestra la ficha para recorrerla.</p>`;
  }

  function mas() {
    return `<p class="eyebrow">Más</p>
      <h2>${esc(INICIO.profesional)}</h2>
      <p class="bajada">Psicóloga · Niños y adolescentes</p>
      <p class="direccion">${esc(INICIO.direccion)}</p>
      <p class="bajada">${esc(INICIO.bajada)}</p>
      <section class="dia-card">
        <h3>Esta demo</h3>
        <p class="bajada">La clave es 123456. Lo que se anota queda en este navegador y no entra en la agenda del consultorio.</p>
        <button class="btn secundario" type="button" data-accion="reiniciar">Volver a los turnos de muestra</button>
      </section>
      ${nota(state.mensaje, state.mensajeMal ? 'mal' : 'bien')}
      <a class="btn" href="turno.html">Ver cómo saca turno la familia</a>
      <button class="btn peligro" type="button" data-accion="salir">Cerrar sesión</button>`;
  }

  function render() {
    const cuerpo = !state.authed ? login() : { agenda, horarios, pacientes, mas }[state.tab]();
    app.innerHTML = `<div class="hoja">${cuerpo}</div>${nav()}`;
  }

  function ponerEstado(id, estado) {
    const data = base();
    const turno = data.turnos.find((item) => item.id === id);
    if (!turno) return;
    turno.estado = estado;
    guardar(data);
    state.mensaje = estado === 'cancelado' ? 'Turno cancelado.' : 'Listo.';
    state.mensajeMal = false;
    if (estado === 'cancelado') state.abierto = null;
  }

  app.addEventListener('input', (evento) => {
    if (evento.target.dataset.consulta != null) {
      state.consulta = evento.target.value;
      const pos = evento.target.selectionStart;
      render();
      const caja = document.querySelector('#q');
      if (caja) {
        caja.focus();
        if (pos != null) caja.setSelectionRange(pos, pos);
      }
      return;
    }
    const campo = evento.target.dataset.anotar;
    if (campo && state.anotar) {
      state.anotar[campo] = evento.target.value;
      if (campo === 'obra') {
        state.anotar.obraId = evento.target.value;
        render();
      }
    }
  });

  app.addEventListener('click', (evento) => {
    const tab = evento.target.closest('[data-tab]')?.dataset.tab;
    if (tab) {
      state.tab = tab;
      state.mensaje = '';
      state.anotar = null;
      state.abierto = null;
      render();
      window.scrollTo(0, 0);
      return;
    }
    const tecla = evento.target.closest('[data-tecla]')?.dataset.tecla;
    if (tecla) {
      if (tecla === '⌫') state.pin = state.pin.slice(0, -1);
      else if (state.pin.length < 6) state.pin += tecla;
      render();
      if (state.pin.length === 6) {
        if (state.pin === PIN) {
          state.authed = true;
          sessionStorage.setItem('recreo-demo-sesion', 'ok');
          state.pin = '';
          state.error = '';
          state.fecha = hoyBA();
        } else {
          state.pin = '';
          state.error = 'Clave incorrecta.';
        }
        render();
      }
      return;
    }
    const estado = evento.target.closest('[data-estado]')?.dataset.estado;
    const idEstado = evento.target.closest('[data-estado]')?.dataset.id;
    if (estado && idEstado) {
      ponerEstado(idEstado, estado);
      render();
      return;
    }
    const horaLibre = evento.target.closest('[data-hora-libre]')?.dataset.horaLibre;
    if (horaLibre) {
      state.anotar = { hora: horaLibre, nombre: '', apellido: '', dni: '', obraId: 'particular', obraOtra: '', nro: '', error: '' };
      state.abierto = null;
      state.mensaje = '';
      render();
      document.querySelector('#anotar')?.scrollIntoView({ block: 'nearest' });
      return;
    }
    const turnoId = evento.target.closest('[data-turno]')?.dataset.turno;
    if (turnoId && !evento.target.closest('button')) {
      state.abierto = state.abierto === turnoId ? null : turnoId;
      state.anotar = null;
      render();
      return;
    }
    const paciente = evento.target.closest('[data-paciente]')?.dataset.paciente;
    if (paciente) {
      state.pacienteAbierto = state.pacienteAbierto === paciente ? null : paciente;
      render();
      return;
    }
    const accion = evento.target.closest('[data-accion]')?.dataset.accion;
    if (accion === 'dia-anterior' || accion === 'dia-siguiente') {
      state.fecha = sumar(state.fecha, accion === 'dia-anterior' ? -1 : 1);
      state.abierto = null;
      state.anotar = null;
      state.mensaje = '';
      render();
    } else if (accion === 'hoy') {
      state.fecha = hoyBA();
      state.abierto = null;
      state.anotar = null;
      render();
    } else if (accion === 'cerrar-anotar') {
      state.anotar = null;
      render();
    } else if (accion === 'guardar-anotar') {
      const anotar = state.anotar;
      const obra = anotar.obraId === 'otra' ? null : obraPorId(anotar.obraId);
      const revision = revisar(
        { nombre: anotar.nombre, apellido: anotar.apellido, dni: anotar.dni, nro: anotar.nro, obraOtra: anotar.obraOtra },
        obra,
        anotar.obraId === 'otra',
      );
      if (!revision.ok) {
        anotar.error = revision.errores[0];
        render();
        return;
      }
      if (turnoVigente(revision.datos.dni)) {
        anotar.error = 'Esa persona ya tiene un turno activo.';
        render();
        return;
      }
      const data = base();
      data.turnos.push({
        id: `demo-${Date.now()}`,
        origen: 'demo',
        fecha: state.fecha,
        hora: anotar.hora,
        patologia: 'Sesión',
        minutos: 40,
        codigo: codigoNuevo(),
        estado: 'reservado',
        ...revision.datos,
      });
      guardar(data);
      state.anotar = null;
      state.mensaje = 'Turno anotado.';
      state.mensajeMal = false;
      render();
    } else if (accion === 'reiniciar') {
      memoria = null;
      try { localStorage.removeItem(CLAVE); } catch { /* sigue */ }
      base();
      state.mensaje = 'Volvieron los turnos de muestra.';
      state.mensajeMal = false;
      state.tab = 'agenda';
      state.fecha = hoyBA();
      render();
    } else if (accion === 'salir') {
      state.authed = false;
      sessionStorage.removeItem('recreo-demo-sesion');
      state.pin = '';
      render();
    }
  });

  render();
}
