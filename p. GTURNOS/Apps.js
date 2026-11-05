const STORAGE_KEY = "empleadosTurnos";
const STORAGE_RULES_KEY = "reglasTurnos";
const STORAGE_UNIDADES_KEY = "unidadesTurnos";
const STORAGE_MANUALES_KEY = "cambiosTurnosManuales";
const STORAGE_UNIDADES_CONFIG_KEY = "configuracionUnidadesTurnos";
const STORAGE_ORDEN_CUADROS_KEY = "ordenCuadrosTurnos";
const STORAGE_ROLES_PERSONALIZADOS_KEY = "rolesPersonalizadosTurnos";
const STORAGE_HORARIOS_MANUALES_KEY = "horariosManualesTurnos";
const STORAGE_DETALLES_CAMBIOS_KEY = "detallesCambiosTurnos";
const STORAGE_MODO_MANUAL_KEY = "modoManualTurnos";
const STORAGE_MAPA_ASIGNACION_KEY = "mapaAsignacionTurnosActivo";
const STORAGE_CUADROS_GUARDADOS_KEY = "cuadrosGuardadosTurnos";
const STORAGE_PAREJAS_KEY = "parejasTurnosTurnos";
const STORAGE_DIAS_ROL_KEY = "diasPorRolTurnos";
const COLOR_UNIDAD_PREDETERMINADO = "#2563eb";
const STORAGE_REGLAS_GENERALES_KEY = "reglasGeneralesTurnos";
const REGLAS_GENERALES_BASE = {
    descansoEntreTurnos: { activa: true, valor: 12 },
    descansoSemanal: { activa: true, valor: 36 },
    maxHorasAnuales: { activa: true, valor: 1592 },
    maxHorasSemanales: { activa: true, valor: 40 },
    maxHorasMensuales: { activa: true, valor: 160 },
    vacacionesImpidenTurno: { activa: true },
    respetarPuesto: { activa: true }
};
const DEFAULT_UNIDADES = ["Unidad 1", "Unidad 2", "Unidad 4", "Unidad 5"];
const UNIDADES_BASE = [...DEFAULT_UNIDADES];
const esUnidadConLetra = (unidad) => /^unidad\s*[a-z]$/i.test(String(unidad || "").trim());

let empleados = cargarEmpleadosGuardados();
let reglasGenerales = cargarReglasGenerales();
let reglasPorEmpleado = cargarReglasGuardadas();
let nombresUnidades = cargarUnidadesGuardadas();
let cambiosTurnosManuales = cargarCambiosManuales();
let configuracionUnidades = cargarConfiguracionUnidades();
let ordenCuadros = cargarOrdenCuadros();
let diasPorRol = (() => {
    try {
        const datos = JSON.parse(localStorage.getItem(STORAGE_DIAS_ROL_KEY) || "[]");
        return Array.isArray(datos) ? datos : [];
    } catch (error) {
        return [];
    }
})();

let parejasTurno = (() => {
    try {
        const datos = JSON.parse(localStorage.getItem(STORAGE_PAREJAS_KEY) || "null");
        return { activa: Boolean(datos?.activa), reglas: Array.isArray(datos?.reglas) ? datos.reglas : [] };
    } catch (error) {
        return { activa: false, reglas: [] };
    }
})();

let rolesPersonalizadosGuardados = cargarRolesPersonalizadosGuardados();
let horariosManualesTurnos = cargarHorariosManualesGuardados();
let detallesCambiosManuales = cargarDetallesCambiosManuales();
let empleadoActivo = { nombre: null };
let asignacionesActuales = [];
let fechasPeriodoActual = [];
let cambioTurnoActivo = null;
let arrastreTurno = null;
let avisosCobertura = new Map();
let semillasContinuidad = null;
const historialCambios = [];
const botonDeshacerCambio = document.getElementById("botonDeshacerCambio");

function actualizarBotonDeshacer() {
    if (!botonDeshacerCambio) return;
    botonDeshacerCambio.disabled = historialCambios.length === 0;
    botonDeshacerCambio.textContent = historialCambios.length ? `Deshacer (${historialCambios.length})` : "Deshacer";
}

function registrarHistorialCambios() {
    historialCambios.push(JSON.stringify({
        cambios: cambiosTurnosManuales,
        horarios: horariosManualesTurnos,
        detalles: detallesCambiosManuales,
        reglas: reglasPorEmpleado
    }));
    if (historialCambios.length > 30) historialCambios.shift();
    actualizarBotonDeshacer();
}

function deshacerUltimoCambio() {
    const instantanea = historialCambios.pop();
    actualizarBotonDeshacer();
    if (!instantanea) return;
    const estado = JSON.parse(instantanea);
    cambiosTurnosManuales = estado.cambios;
    horariosManualesTurnos = estado.horarios;
    detallesCambiosManuales = estado.detalles;
    reglasPorEmpleado = estado.reglas;
    guardarCambiosManuales();
    guardarHorariosManuales();
    guardarDetallesCambiosManuales();
    guardarReglas();
    mostrarEmpleados();
    generarTurnos();
}

botonDeshacerCambio?.addEventListener("click", deshacerUltimoCambio);

const nombreEmpleado = document.getElementById("nombreEmpleado");
const porcentajeHoras = document.getElementById("porcentajeHoras");
const rotacionUnidades = document.getElementById("rotacionUnidades");
const cargoEmpleado = document.getElementById("cargoEmpleado");
const botonAgregar = document.getElementById("botonAgregar");
const listaEmpleados = document.getElementById("listaEmpleados");
const botonGenerar = document.getElementById("botonGenerar");
const botonGenerarPeriodo = document.getElementById("botonGenerarPeriodo");
const botonActualizarCuadro = document.getElementById("botonActualizarCuadro");
const cuadrosTurnos = document.getElementById("cuadrosTurnos");
const tituloCuadro = document.getElementById("tituloCuadro");
const detalleCuadro = document.getElementById("detalleCuadro");
const estadoCuadro = document.getElementById("estadoCuadro");
const botonImprimirCuadro = document.getElementById("botonImprimirCuadro");
const botonDescargarCuadro = document.getElementById("botonDescargarCuadro");
const botonImagenCuadro = document.getElementById("botonImagenCuadro");
const metricaEmpleados = document.getElementById("metricaEmpleados");
const metricaUnidades = document.getElementById("metricaUnidades");
const metricaDias = document.getElementById("metricaDias");
const metricaCambios = document.getElementById("metricaCambios");
const fechaInicioTurnos = document.getElementById("fechaInicioTurnos");
const fechaFinTurnos = document.getElementById("fechaFinTurnos");
const festivosTurnos = document.getElementById("festivosTurnos");
const STORAGE_FESTIVOS_KEY = "festivosTurnos";
if (festivosTurnos) {
    festivosTurnos.value = localStorage.getItem(STORAGE_FESTIVOS_KEY) || "";
    festivosTurnos.addEventListener("change", () => localStorage.setItem(STORAGE_FESTIVOS_KEY, festivosTurnos.value));
}

function obtenerFestivos() {
    return new Set((festivosTurnos?.value || "").split(/[\s,;]+/).filter((valor) => /^\d{4}-\d{2}-\d{2}$/.test(valor)));
}

// Durante la generación se reutilizan catálogos, horarios y días de la semana ya calculados.
let cacheGeneracion = null;

function obtenerDiaSemanaFecha(valor) {
    const cache = cacheGeneracion?.diasSemana;
    let dia = cache?.get(valor);
    if (dia === undefined) {
        dia = new Date(`${valor}T00:00:00`).getDay();
        cache?.set(valor, dia);
    }
    return dia;
}

function ejecutarConCacheGeneracion(funcion) {
    cacheGeneracion = { diasSemana: new Map(), catalogos: new Map() };
    try {
        return funcion();
    } finally {
        cacheGeneracion = null;
    }
}

// Sábados, domingos y festivos: se cubren siempre y se reparten entre el equipo.
function esDiaEspecial(fecha, festivos) {
    const diaSemana = obtenerDiaSemanaFecha(fecha.valor);
    return diaSemana === 0 || diaSemana === 6 || festivos.has(fecha.valor);
}

function contarDiasEspecialesTrabajados(registro, fechasPeriodo, festivos) {
    return registro.turnosOriginalesPorFecha.reduce((total, turno, indice) =>
        total + (esDiaEspecial(fechasPeriodo[indice], festivos) && !["Descanso", "Libre", "Vacaciones"].includes(turno) ? 1 : 0), 0);
}
const archivoExcel = document.getElementById("archivoExcel");
const fechaHoraActual = document.getElementById("fechaHoraActual");
const botonTodosEmpleados = document.getElementById("botonTodosEmpleados");
const buscadorEmpleados = document.getElementById("buscadorEmpleados");
const modalEmpleado = document.getElementById("modalEmpleado");
const modalTitulo = document.getElementById("modalTitulo");
const cerrarModalEmpleado = document.getElementById("cerrarModalEmpleado");
const guardarModalEmpleado = document.getElementById("guardarModalEmpleado");
const botonImprimir = document.getElementById("botonImprimir");
const botonDescargar = document.getElementById("botonDescargar");
const botonEliminarEmpleado = document.getElementById("botonEliminarEmpleado");
const tipoContrato = document.getElementById("tipoContrato");
const jornada = document.getElementById("jornada");
const porcentajeHorasEmpleado = document.getElementById("porcentajeHorasEmpleado");
const unidadActual = document.getElementById("unidadActual");
const fechaAlta = document.getElementById("fechaAlta");
const sexoEmpleado = document.getElementById("sexoEmpleado");
const transportePropio = document.getElementById("transportePropio");
const cargoEmpleadoModal = document.getElementById("cargoEmpleadoModal");
const responsabilidadesCargo = document.getElementById("responsabilidadesCargo");
const observacionesEmpleado = document.getElementById("observacionesEmpleado");
const contenedorReglasEmpleado = document.getElementById("contenedorReglasEmpleado");
const modalCambioTurno = document.getElementById("modalCambioTurno");
const cerrarModalCambioTurno = document.getElementById("cerrarModalCambioTurno");
const guardarCambioTurno = document.getElementById("guardarCambioTurno");
const nuevoTurnoIndividual = document.getElementById("nuevoTurnoIndividual");
const unidadCambioTurno = document.getElementById("unidadCambioTurno");
const horarioManualCambioTurno = document.getElementById("horarioManualCambioTurno");
const observacionCambioTurno = document.getElementById("observacionCambioTurno");
const ordenadoPorCambioTurno = document.getElementById("ordenadoPorCambioTurno");
const detalleCambioTurno = document.getElementById("detalleCambioTurno");
const listaSugerenciasCobertura = document.getElementById("listaSugerenciasCobertura");
const configuracionUnidadesElemento = document.getElementById("configuracionUnidades");
const guardarConfiguracionUnidadesBoton = document.getElementById("guardarConfiguracionUnidades");
const nuevaUnidad = document.getElementById("nuevaUnidad");
const agregarUnidadBoton = document.getElementById("agregarUnidad");
const quitarUnidadBoton = document.getElementById("quitarUnidadBoton");
const unidadNuevoRol = document.getElementById("unidadNuevoRol");
const crearRolUnidadBoton = document.getElementById("crearRolUnidad");
const eliminarRolUnidadBoton = document.getElementById("eliminarRolUnidad");
const tabs = document.querySelectorAll(".tab");
const tabPanels = document.querySelectorAll(".tab-panel");
const pestañasPrincipales = document.querySelectorAll(".principal-tab");
const panelesPrincipales = document.querySelectorAll(".principal-panel");
const ordenEmpleados = document.getElementById("ordenEmpleados");
let ordenEmpleadosActual = "unidad";

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const catalogoTurnos = [
    { codigo: "M1", nombre: "Mañana estándar 1", horario: "07:45 - 14:45", descripcion: "Turno principal de mañana para unidades y refuerzos." },
    { codigo: "M2", nombre: "Mañana estándar 2", horario: "07:45 - 14:45", descripcion: "Turno principal de mañana para unidades y refuerzos." },
    { codigo: "M3", nombre: "Mañana especial", horario: "07:45 - 11:45", descripcion: "Puestos de apoyo específico de mañana." },
    { codigo: "M4", nombre: "Mañana operativo 4", horario: "07:45 - 14:45", descripcion: "Funciones definidas según unidad." },
    { codigo: "M5", nombre: "Mañana operativo 5", horario: "07:45 - 14:45", descripcion: "Funciones definidas según unidad." },
    { codigo: "M6", nombre: "Mañana adicional", horario: "07:45 - 14:45", descripcion: "Cobertura o apoyo semanal." },
    { codigo: "T1", nombre: "Tarde estándar 1", horario: "15:00 - 22:00", descripcion: "Turno principal de tarde para unidades." },
    { codigo: "T2", nombre: "Tarde estándar 2", horario: "15:00 - 22:00", descripcion: "Turno principal de tarde para unidades." },
    { codigo: "T3", nombre: "Tarde intermedio", horario: "14:40 - 21:40", descripcion: "Turno de tarde con entrada adelantada." },
    { codigo: "T4", nombre: "Tarde cierre", horario: "15:00 - 22:00", descripcion: "Personal asignado a cierres." },
    { codigo: "CD", nombre: "Centro de Día", horario: "08:15 - 17:15", descripcion: "Jornada de atención en Centro de Día." },
    { codigo: "CD (Reducido)", nombre: "Centro de Día parcial", horario: "07:30 - 11:30", descripcion: "Turno parcial de mañana en Centro de Día." },
    { codigo: "RF", nombre: "Refuerzo matutino", horario: "07:45 - 11:45", descripcion: "Apoyo específico durante horas pico." },
    { codigo: "Vacaciones", nombre: "Vacaciones", horario: "No trabaja", descripcion: "Ausencia planificada entre las fechas indicadas." }
];
const RESPONSABILIDADES_POR_CARGO = {
    Coordinador: ["Organizar la actividad del equipo", "Supervisar cobertura y unidades", "Resolver incidencias operativas"],
    Auxiliar: ["Apoyar la atención y las tareas asignadas", "Preparar materiales y espacios", "Informar de incidencias al responsable"],
    Limpieza: ["Mantener la higiene de espacios y materiales", "Reponer productos de limpieza", "Comunicar incidencias de mantenimiento"],
    Enfermero: ["Realizar cuidados y seguimiento sanitario", "Registrar la atención prestada", "Comunicar cambios clínicos"],
    Médico: ["Valorar y planificar la atención médica", "Registrar diagnósticos e indicaciones", "Coordinar decisiones clínicas"],
    Otros: ["Definir responsabilidades específicas del puesto", "Cumplir las tareas asignadas", "Comunicar incidencias al responsable"]
};
const GRUPOS_TURNO_PERFIL = {
    manana: (codigo) => /^(M|CD|RF)/.test(codigo),
    tarde: (codigo) => /^T/.test(codigo),
    noche: (codigo) => /^N/.test(codigo)
};
// Cualidades de turno por profesión: grupos permitidos, máximo de días seguidos, días libres fijos y turnos preferidos.
// M1 es un turno exclusivo de Auxiliar: el resto de profesiones lo tienen en "excluidos".
const PERFILES_PROFESION = {
    Coordinador: {
        icono: "🧭", grupos: ["manana"], excluidos: ["M1"], maxConsecutivos: 5, diasLibre: ["Sábado", "Domingo"],
        preferidos: ["M2"], rotacionLibres: false,
        descripcion: "Horario de mañana (sin M1), fines de semana libres y máximo 5 días seguidos."
    },
    Auxiliar: {
        icono: "🤝", grupos: ["manana", "tarde"], maxConsecutivos: 5, diasLibre: [],
        preferidos: ["M1", "T1"], rotacionLibres: true,
        descripcion: "Rota entre mañana y tarde con descansos rotativos y máximo 5 días seguidos."
    },
    Limpieza: {
        icono: "🧽", grupos: ["manana"], excluidos: ["M1"], maxConsecutivos: 5, diasLibre: ["Domingo"],
        preferidos: ["M3", "M2"], rotacionLibres: true,
        descripcion: "Solo turnos de mañana, domingo libre y máximo 5 días seguidos."
    },
    Enfermero: {
        icono: "🩺", grupos: ["manana", "tarde", "noche"], excluidos: ["M1"], maxConsecutivos: 4, diasLibre: [],
        preferidos: ["M2", "T1"], rotacionLibres: true,
        descripcion: "Cobertura de mañana, tarde y noche con máximo 4 días seguidos."
    },
    Médico: {
        icono: "⚕️", grupos: ["manana", "tarde"], excluidos: ["M1"], maxConsecutivos: 4, diasLibre: ["Domingo"],
        preferidos: ["M2", "T1"], rotacionLibres: true,
        descripcion: "Mañana o tarde, domingo libre y máximo 4 días seguidos."
    },
    Otros: {
        icono: "👤", grupos: ["manana", "tarde", "noche"], maxConsecutivos: 5, diasLibre: [],
        preferidos: ["M1"], rotacionLibres: true,
        descripcion: "Sin restricciones propias: se usan solo las reglas generales y de la unidad."
    }
};
let cargoFiltroActual = "";

function obtenerPerfilProfesion(cargo) {
    return PERFILES_PROFESION[cargo] || PERFILES_PROFESION.Otros;
}

function codigoEnGruposPerfil(codigo, perfil) {
    // Los roles creados por el usuario se respetan siempre: la profesión solo restringe el catálogo base.
    if (esRolPersonalizado(codigo)) return true;
    if (perfil.excluidos?.includes(codigo)) return false;
    const esEstandar = Object.values(GRUPOS_TURNO_PERFIL).some((prueba) => prueba(codigo));
    if (!esEstandar) return true;
    return perfil.grupos.some((grupo) => GRUPOS_TURNO_PERFIL[grupo](codigo));
}

// Punto único de control: un turno o rol solo se asigna si corresponde a la profesión del empleado.
function turnoCompatibleConProfesion(regla, turno) {
    if (["Descanso", "Libre", "Vacaciones"].includes(turno)) return true;
    if (regla?.perfilProfesionActivo === false) return true;
    return codigoEnGruposPerfil(turno, obtenerPerfilProfesion(regla?.cargo));
}

function filtrarTurnosPorPerfil(turnos, regla) {
    if (regla?.perfilProfesionActivo === false) return turnos;
    const perfil = obtenerPerfilProfesion(regla?.cargo);
    const permitidos = turnos.filter((turno) => turno === "Vacaciones" || codigoEnGruposPerfil(turno, perfil));
    return permitidos.some((turno) => turno !== "Vacaciones") ? permitidos : turnos;
}

function obtenerMaxConsecutivosEfectivo(regla) {
    const propio = Number(regla?.maxTurnos) || 0;
    if (regla?.perfilProfesionActivo === false) return propio;
    const limite = obtenerPerfilProfesion(regla?.cargo).maxConsecutivos;
    return propio ? Math.min(propio, limite) : limite;
}

function aplicarPerfilProfesionAEmpleado(nombre) {
    const regla = reglasPorEmpleado[nombre];
    if (!regla) return false;
    const cargo = regla.cargo || "Otros";
    const perfil = obtenerPerfilProfesion(cargo);
    const unidad = obtenerUnidadAsignada(regla, "");
    const candidatos = obtenerCatalogoTurnosEmpleado(regla)
        .map((turno) => turno.codigo)
        .filter((codigo) => Object.values(GRUPOS_TURNO_PERFIL).some((prueba) => prueba(codigo)))
        .filter((codigo) => codigoEnGruposPerfil(codigo, perfil) && turnoAsignableEnUnidad(unidad, codigo));
    if (!candidatos.length) return false;

    const preferidos = perfil.preferidos.filter((codigo) => candidatos.includes(codigo));
    const turnosPreferidos = preferidos.length ? preferidos : [candidatos[0]];
    reglasPorEmpleado[nombre] = {
        ...regla,
        perfilProfesionActivo: true,
        turnosPreferidos,
        turnoPreferido: turnosPreferidos[0],
        maxTurnos: Math.min(Number(regla.maxTurnos) || perfil.maxConsecutivos, perfil.maxConsecutivos),
        descanso: true,
        rotacionLibres: perfil.rotacionLibres,
        diasLibre: [...new Set([...(regla.diasLibre || []), ...perfil.diasLibre])]
    };
    return true;
}

function aplicarPerfilAProfesion(cargo) {
    const afectados = empleados.filter((nombre) => (reglasPorEmpleado[nombre]?.cargo || "Otros") === cargo);
    const aplicados = afectados.filter(aplicarPerfilProfesionAEmpleado).length;
    if (aplicados) {
        guardarReglas();
        mostrarEmpleados();
    }
    return { total: afectados.length, aplicados };
}

function cargoDeEmpleado(nombre) {
    return reglasPorEmpleado[nombre]?.cargo || "Otros";
}

// Un único filtro compartido por Gestión de personal y Generador/cuadrante.
function establecerFiltroProfesion(cargo) {
    cargoFiltroActual = cargo;
    mostrarEmpleados();
    if (asignacionesActuales.length) renderizarCuadrosVisibles();
}

function renderizarPanelProfesiones() {
    const detalle = document.getElementById("detalleProfesion");
    ["filtroProfesiones", "filtroProfesionesCuadro"].forEach((id) => {
        const contenedor = document.getElementById(id);
        if (contenedor) renderizarBotonesProfesion(contenedor);
    });
    if (!detalle) return;
    detalle.hidden = !cargoFiltroActual;
    if (cargoFiltroActual) {
        detalle.dataset.cargo = cargoFiltroActual;
        const perfil = obtenerPerfilProfesion(cargoFiltroActual);
        const descripcion = document.getElementById("descripcionProfesion");
        if (descripcion) descripcion.textContent = `${cargoFiltroActual}: ${perfil.descripcion}`;
    }
}

function renderizarBotonesProfesion(contenedor) {
    contenedor.innerHTML = "";
    const opciones = [["", "Todas"], ...Object.keys(PERFILES_PROFESION).map((cargo) => [cargo, cargo])];
    opciones.forEach(([cargo, etiqueta]) => {
        const cantidad = empleados.filter((nombre) => !cargo || (reglasPorEmpleado[nombre]?.cargo || "Otros") === cargo).length;
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "boton-profesion" + (cargoFiltroActual === cargo ? " activo" : "");
        boton.dataset.cargo = cargo;
        boton.setAttribute("aria-pressed", String(cargoFiltroActual === cargo));
        boton.textContent = `${cargo ? obtenerPerfilProfesion(cargo).icono + " " : ""}${etiqueta} (${cantidad})`;
        boton.addEventListener("click", () => establecerFiltroProfesion(cargo));
        contenedor.appendChild(boton);
    });
}

function aplicarPerfilProfesionSeleccionada() {
    if (!cargoFiltroActual) return;
    const { total, aplicados } = aplicarPerfilAProfesion(cargoFiltroActual);
    alert(total
        ? `Perfil de ${cargoFiltroActual} aplicado a ${aplicados} de ${total} empleado(s).`
        : `No hay empleados con el cargo ${cargoFiltroActual}.`);
}

function generarTurnosProfesionSeleccionada() {
    if (!cargoFiltroActual) return;
    if (!empleados.some((nombre) => (reglasPorEmpleado[nombre]?.cargo || "Otros") === cargoFiltroActual)) {
        alert(`No hay empleados con el cargo ${cargoFiltroActual}.`);
        return;
    }
    generarTurnosDesdeBoton();
}

function aplicarPerfilAlEmpleadoActivo() {
    const nombre = empleadoActivo.nombre;
    if (!nombre || !reglasPorEmpleado[nombre]) return;
    reglasPorEmpleado[nombre].cargo = cargoEmpleadoModal?.value || reglasPorEmpleado[nombre].cargo || "Otros";
    if (!aplicarPerfilProfesionAEmpleado(nombre)) {
        alert("Ningún turno de la unidad es compatible con este perfil profesional");
        return;
    }
    guardarReglas();
    mostrarEmpleados();
    abrirModalEmpleado(nombre);
    alert("Perfil profesional aplicado");
}

function actualizarFechaHora() {
    if (!fechaHoraActual) return;

    const ahora = new Date();
    const fecha = ahora.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
    const hora = ahora.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    fechaHoraActual.textContent = `${fecha} · ${hora}`;
}

actualizarFechaHora();
setInterval(actualizarFechaHora, 1000);

if (botonAgregar && nombreEmpleado && listaEmpleados) {
    botonAgregar.addEventListener("click", agregarEmpleado);
    nombreEmpleado.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            agregarEmpleado();
        }
    });
}

if (botonGenerar) {
    botonGenerar.addEventListener("click", generarTurnosDesdeBoton);
}

if (botonGenerarPeriodo) {
    botonGenerarPeriodo.addEventListener("click", generarTurnosDesdeBoton);
}

if (botonActualizarCuadro) {
    botonActualizarCuadro.addEventListener("click", generarTurnosDesdeBoton);
}

[fechaInicioTurnos, fechaFinTurnos].forEach((campo) => {
    campo?.addEventListener("change", () => {
        fechasPeriodoManuales = true;
    });
});

if (guardarConfiguracionUnidadesBoton) {
    guardarConfiguracionUnidadesBoton.addEventListener("click", guardarConfiguracionUnidades);
}

if (agregarUnidadBoton) {
    agregarUnidadBoton.addEventListener("click", agregarNuevaUnidad);
}

if (quitarUnidadBoton) {
    quitarUnidadBoton.addEventListener("click", quitarUnidadConfigurada);
}

if (crearRolUnidadBoton) {
    crearRolUnidadBoton.addEventListener("click", crearRolParaUnidad);
}

eliminarRolUnidadBoton?.addEventListener("click", eliminarRolDeUnidadConfigurada);

if (archivoExcel) {
    archivoExcel.addEventListener("change", manejarArchivoExcel);
}

if (botonTodosEmpleados) {
    botonTodosEmpleados.addEventListener("click", alternarTodosLosEmpleados);
}

if (buscadorEmpleados) {
    buscadorEmpleados.addEventListener("input", mostrarEmpleados);
}

document.getElementById("botonAplicarPerfilProfesion")?.addEventListener("click", aplicarPerfilProfesionSeleccionada);
document.getElementById("botonGenerarProfesion")?.addEventListener("click", generarTurnosProfesionSeleccionada);
document.getElementById("botonPerfilEmpleado")?.addEventListener("click", aplicarPerfilAlEmpleadoActivo);

if (cargoEmpleadoModal) {
    cargoEmpleadoModal.addEventListener("change", () => mostrarResponsabilidadesCargo(cargoEmpleadoModal.value));
}

if (ordenEmpleados) {
    ordenEmpleados.addEventListener("change", () => {
        ordenEmpleadosActual = ordenEmpleados.value || "unidad";
        mostrarEmpleados();
    });
}

if (cuadrosTurnos) {
    cuadrosTurnos.addEventListener("click", manejarClickCuadroTurnos);
    cuadrosTurnos.addEventListener("dragstart", iniciarArrastreCuadro);
    cuadrosTurnos.addEventListener("dragend", limpiarEstadoArrastreCuadros);
    cuadrosTurnos.addEventListener("dragover", permitirSoltarCuadro);
    cuadrosTurnos.addEventListener("drop", soltarCuadro);
    cuadrosTurnos.addEventListener("contextmenu", (event) => {
        const celda = event.target.closest(".celda-turno-editable");
        if (!celda || !celda.draggable) return;
        event.preventDefault();
        if (confirm(`¿Borrar el turno de ${celda.dataset.empleado} (${celda.dataset.fecha})?`)) {
            borrarTurnoCelda(celda.dataset.empleado, celda.dataset.fecha);
        }
    });
}

if (cerrarModalCambioTurno) {
    cerrarModalCambioTurno.addEventListener("click", cerrarEditorCambioTurno);
}

document.getElementById("borrarCambioTurno")?.addEventListener("click", () => {
    if (!cambioTurnoActivo) return;
    const { empleado, fecha } = cambioTurnoActivo;
    cerrarEditorCambioTurno();
    borrarTurnoCelda(empleado, fecha);
});

if (guardarCambioTurno) {
    guardarCambioTurno.addEventListener("click", guardarCambioTurnoIndividual);
}

if (cerrarModalEmpleado) {
    cerrarModalEmpleado.addEventListener("click", cerrarModal);
}

if (guardarModalEmpleado) {
    guardarModalEmpleado.addEventListener("click", guardarCambiosEmpleado);
}

if (botonImprimir) {
    botonImprimir.addEventListener("click", imprimirEmpleado);
}

if (botonDescargar) {
    botonDescargar.addEventListener("click", descargarEmpleado);
}

if (botonImprimirCuadro) {
    botonImprimirCuadro.addEventListener("click", () => imprimirSoloCuadro());
}

if (botonDescargarCuadro) {
    botonDescargarCuadro.addEventListener("click", descargarCuadroCsv);
}

if (botonImagenCuadro) {
    botonImagenCuadro.addEventListener("click", descargarCuadroImagen);
}

if (botonEliminarEmpleado) {
    botonEliminarEmpleado.addEventListener("click", eliminarEmpleado);
}

if (tabs.length) {
    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            cambiarPestanaEmpleado(tab.dataset.tab);
        });
    });
}

if (pestañasPrincipales.length) {
    pestañasPrincipales.forEach((pestaña) => {
        pestaña.addEventListener("click", () => cambiarPestanaPrincipal(pestaña.dataset.principalTab));
    });
}

function cambiarPestanaPrincipal(nombrePestana) {
    if (nombrePestana === "cuadrante") prepararTurnosIndividuales();
    pestañasPrincipales.forEach((pestaña) => {
        const activa = pestaña.dataset.principalTab === nombrePestana;
        pestaña.classList.toggle("active", activa);
        pestaña.setAttribute("aria-selected", String(activa));
    });
    panelesPrincipales.forEach((panel) => {
        const activo = panel.id === `principal-${nombrePestana}`;
        panel.classList.toggle("active", activo);
        panel.hidden = !activo;
    });
}

function cambiarPestanaEmpleado(nombrePestana) {
    tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === nombrePestana));
    tabPanels.forEach((panel) => {
        const activo = panel.id === `tab-${nombrePestana}`;
        panel.classList.toggle("active", activo);
        panel.style.display = activo ? "block" : "none";
    });

    if (nombrePestana === "reglas" && empleadoActivo.nombre) {
        try {
            renderizarReglasEmpleadoModal(empleadoActivo.nombre);
        } catch (error) {
            console.error("No se pudo abrir la pestaña de reglas", error);
            if (contenedorReglasEmpleado) {
                contenedorReglasEmpleado.textContent = "No se pudieron cargar las reglas de este empleado.";
            }
        }
    }
}

function cargarEmpleadosGuardados() {
    const guardados = localStorage.getItem(STORAGE_KEY);
    if (!guardados) return [];

    try {
        const array = JSON.parse(guardados);
        return Array.isArray(array) ? array : [];
    } catch (error) {
        console.error("No se pudieron cargar los empleados guardados", error);
        return [];
    }
}

function cargarReglasGenerales() {
    let guardadas = {};
    try {
        guardadas = JSON.parse(localStorage.getItem(STORAGE_REGLAS_GENERALES_KEY)) || {};
    } catch (error) {
        console.error("No se pudieron cargar las reglas generales", error);
    }
    const resultado = {};
    Object.entries(REGLAS_GENERALES_BASE).forEach(([clave, base]) => {
        resultado[clave] = { ...base, ...(guardadas[clave] || {}) };
    });
    return resultado;
}

function inicializarReglasGenerales() {
    document.querySelectorAll("[data-regla-general]").forEach((campo) => {
        const clave = campo.dataset.reglaGeneral;
        if (!reglasGenerales[clave]) return;
        if (campo.type === "checkbox") campo.checked = reglasGenerales[clave].activa;
        else campo.value = reglasGenerales[clave].valor;

        campo.addEventListener("change", () => {
            if (campo.type === "checkbox") {
                reglasGenerales[clave].activa = campo.checked;
            } else {
                const numero = Number(campo.value);
                if (!Number.isFinite(numero) || numero <= 0) {
                    campo.value = reglasGenerales[clave].valor;
                    return;
                }
                reglasGenerales[clave].valor = numero;
            }
            localStorage.setItem(STORAGE_REGLAS_GENERALES_KEY, JSON.stringify(reglasGenerales));
        });
    });
}

inicializarReglasGenerales();

function cargarReglasGuardadas() {
    const guardadas = localStorage.getItem(STORAGE_RULES_KEY);
    if (!guardadas) return {};

    try {
        const data = JSON.parse(guardadas);
        return data && typeof data === "object" ? data : {};
    } catch (error) {
        console.error("No se pudieron cargar las reglas guardadas", error);
        return {};
    }
}

function cargarUnidadesGuardadas() {
    const guardadas = localStorage.getItem(STORAGE_UNIDADES_KEY);
    if (!guardadas) return [...DEFAULT_UNIDADES];

    try {
        const array = JSON.parse(guardadas);
        const numericas = Array.isArray(array) ? array.filter((unidad) => !esUnidadConLetra(unidad)) : [];
        return numericas.length ? numericas : [...DEFAULT_UNIDADES];
    } catch (error) {
        console.error("No se pudieron cargar los nombres de las unidades", error);
        return [...DEFAULT_UNIDADES];
    }
}

function guardarEmpleados() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(empleados));
}

function guardarReglas() {
    localStorage.setItem(STORAGE_RULES_KEY, JSON.stringify(reglasPorEmpleado));
}

function cargarCambiosManuales() {
    const guardados = localStorage.getItem(STORAGE_MANUALES_KEY);
    if (!guardados) return {};

    try {
        const datos = JSON.parse(guardados);
        return datos && typeof datos === "object" ? datos : {};
    } catch (error) {
        console.error("No se pudieron cargar los cambios manuales de turnos", error);
        return {};
    }
}

function guardarCambiosManuales() {
    localStorage.setItem(STORAGE_MANUALES_KEY, JSON.stringify(cambiosTurnosManuales));
}

function cargarHorariosManualesGuardados() {
    const guardados = localStorage.getItem(STORAGE_HORARIOS_MANUALES_KEY);
    if (!guardados) return {};

    try {
        const datos = JSON.parse(guardados);
        return datos && typeof datos === "object" ? datos : {};
    } catch (error) {
        console.error("No se pudieron cargar los horarios manuales", error);
        return {};
    }
}

function guardarHorariosManuales() {
    localStorage.setItem(STORAGE_HORARIOS_MANUALES_KEY, JSON.stringify(horariosManualesTurnos));
}

function cargarDetallesCambiosManuales() {
    const guardados = localStorage.getItem(STORAGE_DETALLES_CAMBIOS_KEY);
    if (!guardados) return {};

    try {
        const datos = JSON.parse(guardados);
        return datos && typeof datos === "object" ? datos : {};
    } catch (error) {
        console.error("No se pudieron cargar los detalles de los cambios manuales", error);
        return {};
    }
}

function guardarDetallesCambiosManuales() {
    localStorage.setItem(STORAGE_DETALLES_CAMBIOS_KEY, JSON.stringify(detallesCambiosManuales));
}

function cargarOrdenCuadros() {
    const guardado = localStorage.getItem(STORAGE_ORDEN_CUADROS_KEY);
    const ordenPredeterminado = ["mañanas", "tardes", "noches"];
    if (!guardado) return ordenPredeterminado;

    try {
        const orden = JSON.parse(guardado);
        return Array.isArray(orden) ? [...new Set([...orden, ...ordenPredeterminado])].filter((grupo) => grupo !== "otros") : ordenPredeterminado;
    } catch (error) {
        console.error("No se pudo cargar el orden de los cuadros", error);
        return ordenPredeterminado;
    }
}

function guardarOrdenCuadros() {
    localStorage.setItem(STORAGE_ORDEN_CUADROS_KEY, JSON.stringify(ordenCuadros));
}

function cargarRolesPersonalizadosGuardados() {
    const guardados = localStorage.getItem(STORAGE_ROLES_PERSONALIZADOS_KEY);
    if (!guardados) return [];
    try {
        const roles = JSON.parse(guardados);
        return Array.isArray(roles) ? roles.filter((rol) => rol && rol.codigo && rol.horario) : [];
    } catch (error) {
        console.error("No se pudieron cargar los roles personalizados", error);
        return [];
    }
}

function guardarRolesPersonalizados() {
    localStorage.setItem(STORAGE_ROLES_PERSONALIZADOS_KEY, JSON.stringify(rolesPersonalizadosGuardados));
}

function cargarConfiguracionUnidades() {
    const guardada = localStorage.getItem(STORAGE_UNIDADES_CONFIG_KEY);
    const base = {
        "Unidad 1": { color: "#2563eb", turnos: ["M1", "M2", "M3", "T1", "T2"] },
        "Unidad 2": { color: "#16a34a", turnos: ["M4", "M5", "M6", "T3", "T4"] },
        "Unidad 4": { color: "#2563eb", turnos: ["M1", "M2", "M3", "T1", "T2"] },
        "Unidad 5": { color: "#16a34a", turnos: ["M4", "M5", "M6", "T3", "T4"] }
    };
    if (!guardada) return base;
    try {
        const configuracion = { ...base, ...JSON.parse(guardada) };
        const normalizada = normalizarConfiguracionUnidades(configuracion);
        localStorage.setItem(STORAGE_UNIDADES_CONFIG_KEY, JSON.stringify(normalizada));
        return normalizada;
    } catch (error) {
        console.error("No se pudo cargar la configuración de unidades", error);
        return base;
    }
}

function normalizarConfiguracionUnidades(configuracion) {
    const resultado = {};

    Object.entries(configuracion || {}).forEach(([nombre, datos]) => {
        if (esUnidadConLetra(nombre)) return;
        const numero = extraerNumeroUnidad(nombre);
        const nombreNormalizado = numero === null ? nombre.trim() : `Unidad ${numero}`;
        const actual = resultado[nombreNormalizado];
        const turnos = Array.isArray(datos?.turnos) ? datos.turnos : [];

        resultado[nombreNormalizado] = actual
            ? {
                color: datos?.color || actual.color,
                turnos: [...new Set([...actual.turnos, ...turnos])],
                puestos: datos?.puestos || actual.puestos
            }
            : {
                color: datos?.color || COLOR_UNIDAD_PREDETERMINADO,
                turnos: [...new Set(turnos)],
                puestos: datos?.puestos
            };
    });

    return resultado;
}

function guardarConfiguracionUnidades() {
    sincronizarConfiguracionUnidadesDesdeFormulario();
    localStorage.setItem(STORAGE_UNIDADES_CONFIG_KEY, JSON.stringify(configuracionUnidades));
    renderizarConfiguracionUnidades();
    actualizarSelectorUnidades();
    mostrarEmpleados();
    alert("Configuración de unidades guardada");
}

function sincronizarConfiguracionUnidadesDesdeFormulario() {
    const datos = {};
    document.querySelectorAll("[data-config-unidad]").forEach((bloque) => {
        const unidad = bloque.dataset.configUnidad;
        datos[unidad] = {
            color: normalizarColor(bloque.querySelector("input[type='color']")?.value),
            turnos: Array.from(bloque.querySelectorAll("input[data-config-turno]:checked")).map((input) => input.value),
            puestos: configuracionUnidades[unidad]?.puestos
        };
    });
    configuracionUnidades = normalizarConfiguracionUnidades({ ...configuracionUnidades, ...datos });
}

// Validación y alta de un rol personalizado, compartida por todos los formularios que crean roles.
function registrarRolPersonalizado({ codigo, nombre, horario, descripcion }) {
    if (!codigo || !nombre || !horario) {
        alert("Completa el código, el nombre y el horario del rol");
        return false;
    }
    if (!/^[MT][A-Z0-9-]{1,7}$/.test(codigo)) {
        alert("El código debe empezar por M o T y tener entre 2 y 8 caracteres");
        return false;
    }
    if (!/^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}$/.test(horario)) {
        alert("El horario debe tener el formato 07:45 - 14:45");
        return false;
    }
    if (obtenerCatalogoTurnosEmpleado({}).some((turno) => turno.codigo.toUpperCase() === codigo)) {
        alert("Ese código ya existe en la aplicación");
        return false;
    }
    rolesPersonalizadosGuardados.push({ codigo, nombre, horario, descripcion: descripcion || "Rol personalizado" });
    guardarRolesPersonalizados();
    return true;
}

function crearRolParaUnidad() {
    const unidad = unidadNuevoRol?.value;
    const codigo = document.getElementById("codigoNuevoRolUnidad")?.value.trim().toUpperCase();
    const horario = document.getElementById("horarioNuevoRolUnidad")?.value.trim();
    const descripcion = document.getElementById("descripcionNuevoRolUnidad")?.value.trim() || "Rol personalizado";
    const nombre = codigo;

    if (!unidad) {
        alert("Selecciona una unidad");
        return;
    }

    sincronizarConfiguracionUnidadesDesdeFormulario();
    const claveUnidad = Object.keys(configuracionUnidades).find((nombreUnidad) => unidadesSonIguales(nombreUnidad, unidad));
    if (!claveUnidad) {
        alert("La unidad seleccionada ya no está disponible");
        return;
    }

    if (!registrarRolPersonalizado({ codigo, nombre, horario, descripcion })) return;
    configuracionUnidades[claveUnidad].turnos = [...new Set([...configuracionUnidades[claveUnidad].turnos, codigo])];
    localStorage.setItem(STORAGE_UNIDADES_CONFIG_KEY, JSON.stringify(configuracionUnidades));
    renderizarConfiguracionUnidades();
    actualizarSelectorUnidades();
    mostrarEmpleados();

    ["codigoNuevoRolUnidad", "horarioNuevoRolUnidad", "descripcionNuevoRolUnidad"].forEach((id) => {
        const campo = document.getElementById(id);
        if (campo) campo.value = "";
    });
    alert(`Rol ${codigo} añadido a ${claveUnidad}`);
}

function agregarNuevaUnidad() {
    if (!nuevaUnidad) return;

    const nombre = nuevaUnidad.value.trim().replace(/\s+/g, " ");
    if (!nombre) {
        alert("Escribe el nombre de la nueva unidad");
        return;
    }

    const existe = Object.keys(configuracionUnidades).some((unidad) => unidadesSonIguales(unidad, nombre));
    if (existe) {
        alert("Esa unidad ya existe");
        return;
    }

    const numero = extraerNumeroUnidad(nombre);
    const nombreNormalizado = numero === null ? nombre : `Unidad ${numero}`;
    configuracionUnidades[nombreNormalizado] = {
        color: obtenerColorUnidadDisponible(),
        turnos: []
    };
    localStorage.setItem(STORAGE_UNIDADES_CONFIG_KEY, JSON.stringify(configuracionUnidades));
    nuevaUnidad.value = "";
    renderizarConfiguracionUnidades();
    actualizarSelectorUnidades();
}

function quitarUnidadConfigurada() {
    if (!nuevaUnidad) return;

    const unidad = nuevaUnidad.value.trim().replace(/\s+/g, " ");
    if (!unidad) {
        alert("Escribe el nombre de la unidad que quieres quitar");
        return;
    }

    if (!window.confirm(`¿Quieres quitar la unidad ${unidad}? Los empleados que la tengan asignada quedarán sin esa unidad.`)) return;

    const clave = Object.keys(configuracionUnidades).find((item) => unidadesSonIguales(item, unidad));
    if (!clave) {
        alert("No se encontró una unidad con ese nombre");
        return;
    }
    delete configuracionUnidades[clave];
    localStorage.setItem(STORAGE_UNIDADES_CONFIG_KEY, JSON.stringify(configuracionUnidades));

    Object.values(reglasPorEmpleado).forEach((regla) => {
        if (!regla.rotacionUnidades) return;
        regla.rotacionUnidades = regla.rotacionUnidades
            .split(/[,;]+/)
            .map((item) => item.trim())
            .filter((item) => item && !unidadesSonIguales(item, unidad))
            .join(", ");
    });
    guardarReglas();

    renderizarConfiguracionUnidades();
    actualizarSelectorUnidades();
    mostrarEmpleados();
    nuevaUnidad.value = "";
    alert(`Unidad ${unidad} eliminada`);
}

function obtenerColorUnidadDisponible() {
    const colores = ["#f97316", "#9333ea", "#0891b2", "#dc2626", "#65a30d", "#c026d3"];
    const usados = Object.values(configuracionUnidades).map((configuracion) => configuracion.color);
    return colores.find((color) => !usados.includes(color)) || "#64748b";
}

function ordenarUnidades(elementos, obtenerNombre) {
    return elementos.sort((a, b) => {
        const nombreA = obtenerNombre(a);
        const nombreB = obtenerNombre(b);
        const numeroA = extraerNumeroUnidad(nombreA);
        const numeroB = extraerNumeroUnidad(nombreB);

        if (numeroA !== null && numeroB !== null && numeroA !== numeroB) {
            return numeroA - numeroB;
        }
        if (numeroA !== null && numeroB === null) return -1;
        if (numeroA === null && numeroB !== null) return 1;
        return nombreA.localeCompare(nombreB, "es", { sensitivity: "base" });
    });
}

function extraerNumeroUnidad(nombre) {
    const coincidencia = String(nombre || "").match(/(?:unidad|u)\s*(\d+)/i) || String(nombre || "").match(/^\s*(\d+)\s*$/);
    return coincidencia ? Number(coincidencia[1]) : null;
}

function renderizarConfiguracionUnidades() {
    if (!configuracionUnidadesElemento) return;
    configuracionUnidadesElemento.innerHTML = "";
    const turnosDisponibles = [...catalogoTurnos, ...rolesPersonalizadosGuardados].filter((turno, indice, turnos) =>
        turno.codigo !== "Vacaciones" && turnos.findIndex((item) => item.codigo === turno.codigo) === indice
    );
    ordenarUnidades(Object.entries(configuracionUnidades), ([unidad]) => unidad).forEach(([unidad, configuracion]) => {
        const bloque = document.createElement("div");
        bloque.className = "configuracion-unidad-item";
        bloque.dataset.configUnidad = unidad;
        bloque.style.setProperty("--color-unidad", normalizarColor(configuracion.color));
        const titulo = document.createElement("h4");
        titulo.textContent = unidad;
        bloque.appendChild(titulo);
        const color = document.createElement("input");
        color.type = "color";
        color.value = normalizarColor(configuracion.color);
        color.setAttribute("aria-label", `Color de ${unidad}`);
        bloque.appendChild(color);
        const turnos = document.createElement("div");
        turnos.className = "configuracion-turnos-checkboxes";
        turnosDisponibles.forEach((turno) => {
            const label = document.createElement("label");
            label.className = "check-inline";
            label.innerHTML = `<input type="checkbox" data-config-turno value="${turno.codigo}"> ${turno.codigo}`;
            label.querySelector("input").checked = configuracion.turnos.includes(turno.codigo);
            turnos.appendChild(label);
        });
        bloque.appendChild(turnos);
        configuracionUnidadesElemento.appendChild(bloque);
    });
    actualizarSelectorUnidadNuevoRol();
    renderizarPuestosUnidades();
    renderizarDiasPorRol();
    renderizarParejas();
}

function actualizarSelectorUnidadNuevoRol() {
    if (!unidadNuevoRol) return;
    const valorAnterior = unidadNuevoRol.value;
    unidadNuevoRol.innerHTML = "";
    ordenarUnidades(Object.keys(configuracionUnidades), (unidad) => unidad).forEach((unidad) => {
        const opcion = document.createElement("option");
        opcion.value = unidad;
        opcion.textContent = unidad;
        unidadNuevoRol.appendChild(opcion);
    });
    const opcionAnterior = Array.from(unidadNuevoRol.options).find((opcion) => unidadesSonIguales(opcion.value, valorAnterior));
    if (opcionAnterior) unidadNuevoRol.value = opcionAnterior.value;
}

function eliminarRolDeUnidadConfigurada() {
    const unidad = unidadNuevoRol?.value;
    const codigo = document.getElementById("codigoNuevoRolUnidad")?.value.trim().toUpperCase();
    if (!unidad || !codigo) {
        alert("Selecciona una unidad e indica el código del rol");
        return;
    }

    const claveUnidad = Object.keys(configuracionUnidades).find((nombre) => unidadesSonIguales(nombre, unidad));
    if (!claveUnidad) {
        alert("La unidad seleccionada ya no está disponible");
        return;
    }
    if (!rolesPersonalizadosGuardados.some((rol) => rol.codigo === codigo)) {
        alert("Solo se pueden quitar roles personalizados");
        return;
    }
    if (!configuracionUnidades[claveUnidad].turnos.includes(codigo)) {
        alert(`El rol ${codigo} no está asignado a ${claveUnidad}`);
        return;
    }
    if (!window.confirm(`¿Quieres quitar el rol ${codigo} de ${claveUnidad}?`)) return;

    sincronizarConfiguracionUnidadesDesdeFormulario();
    configuracionUnidades[claveUnidad].turnos = configuracionUnidades[claveUnidad].turnos.filter((turno) => turno !== codigo);

    const sigueAsignado = Object.values(configuracionUnidades).some((configuracion) => configuracion.turnos.includes(codigo));
    if (!sigueAsignado) quitarRolPersonalizadoDelCatalogo(codigo);
    localStorage.setItem(STORAGE_UNIDADES_CONFIG_KEY, JSON.stringify(configuracionUnidades));
    renderizarConfiguracionUnidades();
    actualizarSelectorUnidades();
    mostrarEmpleados();
    const codigoCampo = document.getElementById("codigoNuevoRolUnidad");
    if (codigoCampo) codigoCampo.value = "";
    alert(`Rol ${codigo} eliminado de ${claveUnidad}`);
}

function renderizarPuestosUnidades() {
    const contenedor = document.getElementById("configuracionPuestos");
    if (!contenedor) return;
    contenedor.innerHTML = "";
    const campos = [["manana", "Mañana"], ["tarde", "Tarde"], ["descanso", "Descanso"]];
    ordenarUnidades(Object.keys(configuracionUnidades), (unidad) => unidad).forEach((unidad) => {
        const puestos = configuracionUnidades[unidad].puestos || {};
        const fila = document.createElement("div");
        fila.className = "puestos-unidad-item";
        fila.dataset.puestosUnidad = unidad;
        fila.style.setProperty("--color-unidad", normalizarColor(configuracionUnidades[unidad].color));
        const titulo = document.createElement("h4");
        titulo.textContent = unidad;
        fila.appendChild(titulo);
        campos.forEach(([clave, etiqueta]) => {
            const label = document.createElement("label");
            label.textContent = `${etiqueta} `;
            const input = document.createElement("input");
            input.type = "number";
            input.min = "0";
            input.step = "1";
            input.placeholder = "Sin límite";
            input.dataset.puesto = clave;
            input.value = puestos[clave] ?? "";
            label.appendChild(input);
            fila.appendChild(label);
        });
        contenedor.appendChild(fila);
    });
}

function guardarPuestosUnidades() {
    document.querySelectorAll("[data-puestos-unidad]").forEach((fila) => {
        const unidad = fila.dataset.puestosUnidad;
        if (!configuracionUnidades[unidad]) return;
        const puestos = {};
        fila.querySelectorAll("input[data-puesto]").forEach((input) => {
            puestos[input.dataset.puesto] = input.value === "" ? null : Math.max(0, Math.floor(Number(input.value) || 0));
        });
        configuracionUnidades[unidad].puestos = puestos;
    });
    localStorage.setItem(STORAGE_UNIDADES_CONFIG_KEY, JSON.stringify(configuracionUnidades));
    alert("Puestos requeridos guardados. Pulsa Actualizar cuadro para aplicarlos.");
}


function guardarDiasPorRol() {
    localStorage.setItem(STORAGE_DIAS_ROL_KEY, JSON.stringify(diasPorRol));
}

function obtenerRolesDiasPorRol() {
    return [...catalogoTurnos, ...rolesPersonalizadosGuardados]
        .filter((turno, i, todos) => turno.codigo !== "Vacaciones" && todos.findIndex((t) => t.codigo === turno.codigo) === i);
}

// Roles que encajan con el empleado: los de su unidad, los suyos propios y los creados globalmente.
function obtenerRolesDiasPorRolEmpleado(empleado) {
    const regla = reglasPorEmpleado[empleado];
    const unidad = obtenerUnidadAsignada(regla, "");
    const codigosUnidad = obtenerConfiguracionUnidad(unidad)?.turnos || [];
    const propios = (regla?.reglasPersonalizadas || []).map((turno) => turno.codigo);
    const globales = rolesPersonalizadosGuardados.map((turno) => turno.codigo);
    const compatibles = new Set([...codigosUnidad, ...propios, ...globales]);
    return obtenerRolesDiasPorRol().filter((turno) => compatibles.has(turno.codigo) && turnoCompatibleConProfesion(regla, turno.codigo));
}

function renderizarDiasPorRol() {
    const selEmpleado = document.getElementById("diasRolEmpleado");
    const selCodigo = document.getElementById("diasRolCodigo");
    const lista = document.getElementById("listaDiasRol");
    if (!selEmpleado || !selCodigo || !lista) return;
    const empleadoPrevio = selEmpleado.value;
    selEmpleado.innerHTML = "";
    empleados.forEach((empleado) => selEmpleado.appendChild(new Option(empleado, empleado)));
    if (empleados.includes(empleadoPrevio)) selEmpleado.value = empleadoPrevio;
    const opciones = document.getElementById("diasRolOpciones");
    opciones.innerHTML = "";
    const rolesEmpleado = selEmpleado.value ? obtenerRolesDiasPorRolEmpleado(selEmpleado.value) : [];
    (rolesEmpleado.length ? rolesEmpleado : obtenerRolesDiasPorRol()).forEach((turno) => {
        const opcion = new Option(turno.nombre || "", turno.codigo);
        opciones.appendChild(opcion);
    });

    lista.innerHTML = "";
    document.getElementById("contadorDiasRol").textContent = diasPorRol.length;
    document.getElementById("vacioDiasRol").hidden = diasPorRol.length > 0;
    diasPorRol.forEach((regla, indice) => {
        const item = document.createElement("li");
        item.textContent = `${regla.empleado}: ${regla.codigo} durante ${regla.dias} día(s) `;
        const quitar = document.createElement("button");
        quitar.type = "button";
        quitar.className = "boton boton-peligro";
        quitar.textContent = "Quitar";
        quitar.addEventListener("click", () => {
            diasPorRol.splice(indice, 1);
            guardarDiasPorRol();
            renderizarDiasPorRol();
        });
        item.appendChild(quitar);
        lista.appendChild(item);
    });
}

// Crea el rol escrito en el formulario si no existe y devuelve su código (o null si no es válido).
function cargarNuevoRolDias(silenciarSiExiste = false) {
    const escrito = document.getElementById("diasRolCodigo")?.value.trim().toUpperCase();
    if (!escrito) {
        alert("Escribe el código del rol");
        return null;
    }
    const existente = obtenerRolesDiasPorRol().find((turno) => turno.codigo.toUpperCase() === escrito);
    if (existente) {
        if (!silenciarSiExiste) alert(`El rol ${existente.codigo} ya existe y está disponible para asignarlo`);
        return existente.codigo;
    }
    const nombre = document.getElementById("diasRolNombre")?.value.trim();
    const horario = document.getElementById("diasRolHorario")?.value.trim();
    if (!registrarRolPersonalizado({ codigo: escrito, nombre, horario })) return null;
    ["diasRolNombre", "diasRolHorario"].forEach((id) => { document.getElementById(id).value = ""; });
    renderizarDiasPorRol();
    renderizarConfiguracionUnidades();
    if (!silenciarSiExiste) alert(`Rol ${escrito} cargado. Ya puedes asignarlo a cualquier empleado`);
    return escrito;
}

function agregarDiasPorRol() {
    const empleado = document.getElementById("diasRolEmpleado")?.value;
    const escrito = document.getElementById("diasRolCodigo")?.value.trim().toUpperCase();
    const dias = Math.floor(Number(document.getElementById("diasRolDias")?.value));
    if (!empleado || !escrito || !Number.isFinite(dias) || dias < 0) {
        alert("Selecciona un empleado, indica un rol y un número de días válido");
        return;
    }
    const codigo = cargarNuevoRolDias(true);
    if (!codigo) return;
    if (!turnoCompatibleConProfesion(reglasPorEmpleado[empleado], codigo)) {
        alert(`${codigo} no corresponde a la profesión de ${empleado} (${reglasPorEmpleado[empleado]?.cargo || "Otros"})`);
        return;
    }
    const compatibles = obtenerRolesDiasPorRolEmpleado(empleado);
    if (reglasGenerales.respetarPuesto.activa && compatibles.length && !compatibles.some((turno) => turno.codigo === codigo)) {
        const unidad = obtenerUnidadAsignada(reglasPorEmpleado[empleado], "sin unidad");
        if (!confirm(`${codigo} no pertenece a la unidad de ${empleado} (${unidad}). ¿Asignarlo igualmente?`)) return;
    }
    diasPorRol = diasPorRol.filter((regla) => !(regla.empleado === empleado && regla.codigo === codigo));
    diasPorRol.push({ empleado, codigo, dias });
    guardarDiasPorRol();
    renderizarDiasPorRol();
    document.getElementById("diasRolCodigo").value = "";
    renderizarConfiguracionUnidades();
}

const campoRolDias = document.getElementById("diasRolCodigo");
campoRolDias?.addEventListener("dblclick", () => {
    campoRolDias.value = "";
    campoRolDias.focus();
    campoRolDias.showPicker?.();
});
const ventanaDiasRol = document.getElementById("ventanaDiasRol");
document.getElementById("verDiasRol")?.addEventListener("click", () => ventanaDiasRol?.showModal());
document.getElementById("cerrarDiasRol")?.addEventListener("click", () => ventanaDiasRol?.close());
ventanaDiasRol?.addEventListener("click", (evento) => {
    if (evento.target === ventanaDiasRol) ventanaDiasRol.close();
});
document.getElementById("cargarNuevoRolDias")?.addEventListener("click", () => {
    if (cargarNuevoRolDias()) document.getElementById("diasRolCodigo").value = "";
});
document.getElementById("agregarDiasRol")?.addEventListener("click", agregarDiasPorRol);
document.getElementById("diasRolEmpleado")?.addEventListener("change", renderizarDiasPorRol);
renderizarDiasPorRol();

// ---- Parejas de turno ----
function guardarParejas() {
    localStorage.setItem(STORAGE_PAREJAS_KEY, JSON.stringify(parejasTurno));
}

function actualizarCuadroTrasCambioParejas() {
    const panelManual = document.getElementById("panelManual");
    if (!asignacionesActuales.length || panelManual && !panelManual.hidden) return;
    generarTurnos();
}

function obtenerRolesUnidadPareja(unidad) {
    return (configuracionUnidades[unidad]?.turnos || []).filter((turno) =>
        ["mañanas", "tardes"].includes(clasificarTurno(turno)) && turno !== "Vacaciones");
}

function renderizarParejas() {
    const selUnidad = document.getElementById("parejaUnidad");
    const selA = document.getElementById("parejaRolA");
    const selB = document.getElementById("parejaRolB");
    const lista = document.getElementById("listaParejas");
    if (!selUnidad || !selA || !selB || !lista) return;
    const previa = selUnidad.value;
    selUnidad.innerHTML = "";
    const unidades = ordenarUnidades(Object.keys(configuracionUnidades), (unidad) => unidad);
    unidades.forEach((unidad) => selUnidad.appendChild(new Option(unidad, unidad)));
    if (unidades.includes(previa)) selUnidad.value = previa;
    const rolA = selA.value, rolB = selB.value;
    [selA, selB].forEach((sel) => {
        sel.innerHTML = "";
        obtenerRolesUnidadPareja(selUnidad.value).forEach((rol) => sel.appendChild(new Option(rol, rol)));
    });
    if ([...selA.options].some((o) => o.value === rolA)) selA.value = rolA;
    if ([...selB.options].some((o) => o.value === rolB)) selB.value = rolB;
    else if (selB.options.length > 1 && selA.value === selB.value) selB.selectedIndex = 1;

    const boton = document.getElementById("alternarParejas");
    boton.textContent = parejasTurno.activa ? "Desactivar parejas" : "Activar parejas";
    boton.setAttribute("aria-pressed", String(parejasTurno.activa));
    boton.classList.toggle("boton-activo", parejasTurno.activa);
    const estado = document.getElementById("estadoParejas");
    estado.textContent = parejasTurno.activa ? "Activado" : "Desactivado";
    estado.classList.toggle("activo", parejasTurno.activa);

    lista.innerHTML = "";
    parejasTurno.reglas.forEach((regla, indice) => {
        const item = document.createElement("li");
        item.textContent = `${regla.unidad}: ${regla.a} + ${regla.b} juntos ${regla.dias} día(s) seguidos `;
        const quitar = document.createElement("button");
        quitar.type = "button";
        quitar.className = "boton boton-peligro";
        quitar.textContent = "Quitar";
        quitar.addEventListener("click", () => {
            parejasTurno.reglas.splice(indice, 1);
            guardarParejas();
            renderizarParejas();
            actualizarCuadroTrasCambioParejas();
        });
        item.appendChild(quitar);
        lista.appendChild(item);
    });
}

function anadirReglaPareja({ unidad, a, b, dias }) {
    if (parejasTurno.reglas.some((r) => r.unidad === unidad && ((r.a === a && r.b === b) || (r.a === b && r.b === a)))) {
        parejasTurno.reglas = parejasTurno.reglas.filter((r) => !(r.unidad === unidad && ((r.a === a && r.b === b) || (r.a === b && r.b === a))));
    }
    // Un rol solo puede pertenecer a una pareja por unidad.
    const ocupado = parejasTurno.reglas.find((r) => r.unidad === unidad && [a, b].some((rol) => [r.a, r.b].includes(rol)));
    if (ocupado) {
        alert(`Un rol de esta pareja ya está en ${ocupado.a} + ${ocupado.b}. Quita esa pareja primero.`);
        return false;
    }
    parejasTurno.reglas.push({ unidad, a, b, dias });
    return true;
}

function agregarPareja() {
    const unidad = document.getElementById("parejaUnidad").value;
    const a = document.getElementById("parejaRolA").value;
    const b = document.getElementById("parejaRolB").value;
    const dias = Math.floor(Number(document.getElementById("parejaDias").value));
    if (!unidad || !a || !b || a === b || !(dias >= 1)) {
        alert("Elige una unidad, dos roles distintos y al menos 1 día.");
        return;
    }
    if (clasificarTurno(a) !== clasificarTurno(b)) {
        alert("Los dos roles de una pareja deben ser de la misma franja (mañana o tarde).");
        return;
    }
    if (!anadirReglaPareja({ unidad, a, b, dias })) return;
    guardarParejas();
    renderizarParejas();
    actualizarCuadroTrasCambioParejas();
}

function aplicarPlantillaParejas() {
    const unidad = document.getElementById("parejaUnidad").value;
    const roles = obtenerRolesUnidadPareja(unidad);
    const faltan = ["M4", "M5", "M6", "T3", "T4"].filter((rol) => !roles.includes(rol));
    if (!unidad || faltan.length) {
        alert(`${unidad || "La unidad"} no tiene los roles ${faltan.join(", ")}. Actívalos en «Turnos asignables».`);
        return;
    }
    parejasTurno.reglas = parejasTurno.reglas.filter((r) => r.unidad !== unidad);
    anadirReglaPareja({ unidad, a: "M4", b: "M5", dias: 3 });
    anadirReglaPareja({ unidad, a: "T3", b: "T4", dias: 4 });
    parejasTurno.activa = true;
    configuracionUnidades[unidad].puestos = { ...(configuracionUnidades[unidad].puestos || {}), manana: 3, tarde: 2 };
    localStorage.setItem(STORAGE_UNIDADES_CONFIG_KEY, JSON.stringify(configuracionUnidades));
    guardarParejas();
    renderizarParejas();
    renderizarPuestosUnidades();
    actualizarCuadroTrasCambioParejas();
}

document.getElementById("alternarParejas")?.addEventListener("click", () => {
    parejasTurno.activa = !parejasTurno.activa;
    guardarParejas();
    renderizarParejas();
    actualizarCuadroTrasCambioParejas();
});
document.getElementById("parejaUnidad")?.addEventListener("change", renderizarParejas);
document.getElementById("agregarPareja")?.addEventListener("click", agregarPareja);
document.getElementById("plantillaParejas")?.addEventListener("click", aplicarPlantillaParejas);
renderizarParejas();

// Asigna a las mismas dos personas los roles de cada pareja durante bloques de N días seguidos.
// Se ejecuta antes de los roles únicos, que completan después los roles sin pareja (aleatorios).
function aplicarParejasTurno(unidad, registrosUnidad, todosRegistros, fechasPeriodo) {
    if (!parejasTurno.activa) return;
    const rolesUnidad = obtenerRolesUnidadPareja(unidad);
    const reglas = parejasTurno.reglas.filter((r) => r.unidad === unidad && rolesUnidad.includes(r.a) && rolesUnidad.includes(r.b));
    if (!reglas.length) return;
    const festivos = obtenerFestivos();

    // Los roles de una pareja solo pueden tenerlos sus miembros: se vacían antes de asignar.
    const rolesPareja = new Set(reglas.flatMap((regla) => [regla.a, regla.b]));
    todosRegistros.forEach((registro) => {
        registro.turnosOriginalesPorFecha.forEach((turno, i) => {
            if (rolesPareja.has(turno) && unidadesSonIguales(registro.unidadesPorDia[i] || registro.unidad, unidad)) {
                registro.turnosOriginalesPorFecha[i] = "Descanso";
                delete registro.unidadesPorDia[i];
            }
        });
    });

    // Los bloques de todas las parejas se resuelven por orden cronológico para repartir la disponibilidad.
    const bloques = [];
    reglas.forEach((regla, indiceRegla) => {
        for (let inicio = 0, n = 0; inicio < fechasPeriodo.length; inicio += regla.dias, n++) {
            bloques.push({ regla, indiceRegla, inicio, fin: Math.min(inicio + regla.dias, fechasPeriodo.length), n });
        }
    });
    bloques.sort((x, y) => x.inicio - y.inicio || x.indiceRegla - y.indiceRegla);
    const usos = reglas.map(() => new Map(registrosUnidad.map((registro) => [registro, 0])));

    // Intenta fijar el rol en todo el bloque; devuelve cómo deshacerlo o null si no es posible.
    const intentar = (registro, rol, inicio, fin) => {
        const copia = [...registro.turnosOriginalesPorFecha];
        const restaurar = () => copia.forEach((valor, i) => { registro.turnosOriginalesPorFecha[i] = valor; });
        const deshacer = () => {
            restaurar();
            for (let dia = inicio; dia < fin; dia++) registro.parejaDias?.delete(dia);
        };
        for (let dia = inicio; dia < fin; dia++) {
            const fijoLibre = !esDiaEspecial(fechasPeriodo[dia], festivos) &&
                registro.regla.descanso !== false && registro.regla.diasLibre?.includes(fechasPeriodo[dia].nombre);
            if (registro.turnosOriginalesPorFecha[dia] === "Vacaciones" || fijoLibre || registro.parejaDias?.has(dia) ||
                !intentarAsignarCobertura(registro, dia, rol, unidad, fechasPeriodo)) {
                restaurar();
                return null;
            }
        }
        for (let dia = inicio; dia < fin; dia++) (registro.parejaDias ||= new Set()).add(dia);
        return deshacer;
    };

    bloques.forEach(({ regla, indiceRegla, inicio, fin, n }) => {
        const total = registrosUnidad.length;
        const huecos = (registro) => registro.turnosOriginalesPorFecha.slice(inicio, fin).filter((turno) => ["Descanso", "Libre"].includes(turno)).length;
        // Menos usos primero, luego quien ya trabaja esos días, rotando el desempate entre bloques.
        const orden = registrosUnidad
            .map((registro, i) => ({ registro, usos: usos[indiceRegla].get(registro), huecos: huecos(registro), rot: (i + n * 2) % total }))
            .sort((x, y) => x.usos - y.usos || x.huecos - y.huecos || x.rot - y.rot)
            .map((x) => x.registro);
        let pareja = null;
        for (const primero of orden) {
            const deshacerPrimero = intentar(primero, regla.a, inicio, fin);
            if (!deshacerPrimero) continue;
            const segundo = orden.find((candidato) => candidato !== primero && intentar(candidato, regla.b, inicio, fin));
            if (segundo) {
                pareja = [primero, segundo];
                break;
            }
            deshacerPrimero();
        }
        if (pareja) {
            pareja.forEach((registro) => usos[indiceRegla].set(registro, usos[indiceRegla].get(registro) + 1));
        } else {
            const clave = `${unidad} (pareja ${regla.a}+${regla.b})`;
            avisosCobertura.set(clave, (avisosCobertura.get(clave) || 0) + 1);
        }
    });
}

function aplicarDiasPorRol(todosRegistros, fechasPeriodo) {
    const festivos = obtenerFestivos();
    const trabaja = (turno) => !["Descanso", "Libre", "Vacaciones"].includes(turno);
    const descansa = (turno) => ["Descanso", "Libre"].includes(turno);
    const reglasValidas = diasPorRol.filter((regla) =>
        obtenerCatalogoTurnosEmpleado({}).some((turno) => turno.codigo === regla.codigo) &&
        turnoCompatibleConProfesion(reglasPorEmpleado[regla.empleado], regla.codigo)
    );

    // Primero se recortan los excesos para que los días liberados puedan reutilizarse.
    reglasValidas.forEach(({ empleado, codigo, dias }) => {
        const registro = todosRegistros.find((item) => item.empleado === empleado);
        if (!registro) return;
        registro.turnosOriginalesPorFecha
            .map((turno, i) => (turno === codigo ? i : -1))
            .filter((i) => i >= 0)
            .slice(dias)
            .forEach((i) => {
                registro.turnosOriginalesPorFecha[i] = "Descanso";
                delete registro.unidadesPorDia[i];
            });
    });

    reglasValidas.forEach(({ empleado, codigo, dias }) => {
        const registro = todosRegistros.find((item) => item.empleado === empleado);
        if (!registro) return;
        const turnos = registro.turnosOriginalesPorFecha;
        const grupo = clasificarTurno(codigo);
        const puestos = obtenerConfiguracionUnidad(registro.unidad)?.puestos || {};
        const limite = (valor) => (valor === null || valor === undefined || valor === "" || !Number.isFinite(Number(valor)) ? null : Math.max(0, Number(valor)));
        const maxGrupo = grupo === "mañanas" ? limite(puestos.manana) : grupo === "tardes" ? limite(puestos.tarde) : null;
        const minDescanso = limite(puestos.descanso);
        const otrosCodigos = new Set(reglasValidas.filter((r) => r.empleado === empleado && r.codigo !== codigo).map((r) => r.codigo));
        const mismaUnidad = (otro, i) => unidadesSonIguales(otro.unidadesPorDia[i] || otro.unidad, registro.unidad);
        const equipo = todosRegistros.filter((otro) => unidadesSonIguales(otro.unidad, registro.unidad));

        const permitido = (i) => {
            const actual = turnos[i];
            if (actual === codigo || actual === "Vacaciones" || otrosCodigos.has(actual) || registro.unidadesPorDia[i]) return false;
            if (todosRegistros.some((otro) => otro !== registro && mismaUnidad(otro, i) && otro.turnosOriginalesPorFecha[i] === codigo)) return false;
            const especial = esDiaEspecial(fechasPeriodo[i], festivos);
            if (!especial && registro.regla.descanso !== false && registro.regla.diasLibre?.includes(fechasPeriodo[i].nombre)) return false;
            if (maxGrupo !== null && clasificarTurno(actual) !== grupo) {
                const ocupados = todosRegistros.filter((otro) => otro !== registro && mismaUnidad(otro, i) && clasificarTurno(otro.turnosOriginalesPorFecha[i]) === grupo).length;
                if (ocupados >= maxGrupo) return false;
            }
            if (minDescanso !== null && descansa(actual)) {
                const descansando = equipo.filter((otro) => descansa(otro.turnosOriginalesPorFecha[i])).length;
                if (descansando - 1 < minDescanso) return false;
            }
            return true;
        };
        const contar = () => turnos.filter((turno) => turno === codigo).length;

        for (let ronda = 0; ronda < turnos.length && contar() < dias; ronda++) {
            const candidatos = turnos.map((_, i) => i).filter(permitido)
                .sort((a, b) => (descansa(turnos[a]) - descansa(turnos[b])) || a - b);
            // Se reparten los días a lo largo del periodo en lugar de agruparlos al principio.
            const paso = Math.max(1, Math.floor(candidatos.length / Math.max(1, dias - contar())));
            const ordenados = candidatos.filter((_, k) => k % paso === 0).concat(candidatos.filter((_, k) => k % paso !== 0));
            const asignado = ordenados.some((i) => intentarAsignarCobertura(registro, i, codigo, registro.unidad, fechasPeriodo));
            if (!asignado) break;
        }
        const faltan = dias - contar();
        if (faltan > 0) {
            avisosCobertura.set(`${empleado}: ${codigo} por regla de días`, faltan);
        }
    });
}

function cambiarPestanaReglas(nombre) {
    document.querySelectorAll("[data-reglas-tab]").forEach((boton) => {
        const activa = boton.dataset.reglasTab === nombre;
        boton.classList.toggle("active", activa);
        boton.setAttribute("aria-selected", String(activa));
    });
    document.querySelectorAll("[data-reglas-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.reglasPanel !== nombre;
    });
}

document.querySelectorAll("[data-reglas-tab]").forEach((boton) => {
    boton.addEventListener("click", () => cambiarPestanaReglas(boton.dataset.reglasTab));
});
document.getElementById("guardarPuestosUnidades")?.addEventListener("click", guardarPuestosUnidades);

function actualizarSelectorUnidades() {
    // Las vistas de cuadrante trabajan siempre con todas las unidades configuradas.
}

function obtenerUnidadesConfiguradasUnicas() {
    const unidadesPorClave = new Map();
    Object.keys(configuracionUnidades).forEach((unidad) => {
        const clave = extraerNumeroUnidad(unidad);
        const identificador = clave === null ? `texto:${unidad.trim().toLowerCase()}` : `numero:${clave}`;
        if (!unidadesPorClave.has(identificador)) {
            unidadesPorClave.set(identificador, unidad);
        }
    });
    return Array.from(unidadesPorClave.values());
}

function unidadesSonIguales(unidadA, unidadB) {
    const numeroA = extraerNumeroUnidad(unidadA);
    const numeroB = extraerNumeroUnidad(unidadB);
    if (numeroA !== null && numeroB !== null) return numeroA === numeroB;
    return String(unidadA || "").trim().toLowerCase() === String(unidadB || "").trim().toLowerCase();
}

function claveCambioTurno(empleado, fecha) {
    return `${empleado}::${fecha}`;
}

function abrirModalEmpleado(nombre) {
    if (!modalEmpleado || !modalTitulo) return;
    empleadoActivo.nombre = nombre;
    modalTitulo.textContent = nombre;
    const campoNombreCompleto = document.getElementById("nombreCompletoEmpleado");
    if (campoNombreCompleto) campoNombreCompleto.value = nombre;

    const datos = reglasPorEmpleado[nombre] || {};
    if (tipoContrato) tipoContrato.value = datos.tipoContrato || "Fijo";
    if (jornada) jornada.value = datos.jornada || "Completa";
    if (porcentajeHorasEmpleado) porcentajeHorasEmpleado.value = datos.porcentajeHorasMes ?? 100;
    if (unidadActual) unidadActual.value = datos.rotacionUnidades || nombresUnidades[0] || "Unidad 1";
    const listaUnidades = document.getElementById("unidadesDisponibles");
    if (listaUnidades) {
        listaUnidades.innerHTML = "";
        obtenerUnidadesTrabajoDisponibles(datos.rotacionUnidades).forEach((unidad) => {
            const opcion = document.createElement("option");
            opcion.value = unidad;
            listaUnidades.appendChild(opcion);
        });
    }
    if (fechaAlta) fechaAlta.value = datos.fechaAlta || "";
    if (sexoEmpleado) sexoEmpleado.value = datos.sexo || "";
    if (transportePropio) transportePropio.value = datos.transportePropio || "No";
    if (cargoEmpleadoModal) cargoEmpleadoModal.value = datos.cargo || "Otros";
    mostrarResponsabilidadesCargo(cargoEmpleadoModal?.value || datos.cargo || "Otros");
    if (observacionesEmpleado) observacionesEmpleado.value = datos.observaciones || "";

    try {
        renderizarReglasEmpleadoModal(nombre);
    } catch (error) {
        console.error("No se pudo cargar la pestaña de reglas", error);
        if (contenedorReglasEmpleado) {
            contenedorReglasEmpleado.textContent = "No se pudieron cargar las reglas de este empleado.";
        }
    }
    cambiarPestanaEmpleado("contratacion");
    modalEmpleado.classList.remove("oculto");
    modalEmpleado.setAttribute("aria-hidden", "false");
}

function cerrarModal() {
    if (!modalEmpleado) return;
    modalEmpleado.classList.add("oculto");
    modalEmpleado.setAttribute("aria-hidden", "true");
}

function agregarEmpleado() {
    if (!nombreEmpleado || !listaEmpleados) return;

    const nombre = nombreEmpleado.value.trim();
    if (!nombre) {
        alert("Escribe el nombre del empleado");
        return;
    }

    const nombreNormalizado = nombre.replace(/\s+/g, " ");
    if (empleados.some((empleado) => empleado.toLowerCase() === nombreNormalizado.toLowerCase())) {
        alert("Este empleado ya está en la lista");
        nombreEmpleado.value = "";
        return;
    }

    const porcentaje = Number(porcentajeHoras?.value ?? 100);
    const rotacion = rotacionUnidades?.value || "Rotación libre";
    if (Number.isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
        alert("El porcentaje de horas contratadas debe estar entre 0 y 100");
        return;
    }

    empleados.push(nombreNormalizado);
    reglasPorEmpleado[nombreNormalizado] = {
        turnoPreferido: "M1",
        turnosPreferidos: ["M1"],
        diasLibre: [],
        maxTurnos: Math.min(calcularMaxTurnos(porcentaje), 5),
        descanso: true,
        rotacionLibres: true,
        participaRotacion: true,
        colorUnidad: COLOR_UNIDAD_PREDETERMINADO,
        reglaResponsableUnidad5: true,
        reglaResponsableUnidad4: true,
        porcentajeHorasMes: porcentaje,
        rotacionUnidades: rotacion,
        cargo: cargoEmpleado?.value || "Otros",
        tipoContrato: "Fijo",
        jornada: "Completa",
        fechaAlta: "",
        sexo: "",
        transportePropio: "No",
        observaciones: ""
    };

    nombreEmpleado.value = "";
    if (porcentajeHoras) porcentajeHoras.value = "100";
    if (cargoEmpleado) cargoEmpleado.value = "Otros";
    if (rotacionUnidades) rotacionUnidades.value = nombresUnidades[0] || "Unidad 1";

    guardarEmpleados();
    guardarReglas();
    mostrarEmpleados();
    abrirModalEmpleado(nombreNormalizado);
}

function calcularMaxTurnos(porcentaje) {
    if (porcentaje <= 0) return 0;
    if (porcentaje >= 100) return 7;
    return Math.max(1, Math.round((porcentaje / 100) * 7));
}

function mostrarResponsabilidadesCargo(cargo) {
    if (!responsabilidadesCargo) return;
    responsabilidadesCargo.innerHTML = "";
    const responsabilidades = RESPONSABILIDADES_POR_CARGO[cargo] || RESPONSABILIDADES_POR_CARGO.Otros;
    const titulo = document.createElement("small");
    titulo.textContent = `Responsabilidades sugeridas para ${cargo || "Otros"}`;
    responsabilidadesCargo.appendChild(titulo);
    const lista = document.createElement("ul");
    responsabilidades.forEach((responsabilidad) => {
        const item = document.createElement("li");
        item.textContent = responsabilidad;
        lista.appendChild(item);
    });
    responsabilidadesCargo.appendChild(lista);
}

function mostrarEmpleados() {
    renderizarDiasPorRol();
    if (!listaEmpleados) return;

    listaEmpleados.innerHTML = "";
    renderizarPanelProfesiones();
    const textoBusqueda = buscadorEmpleados?.value.trim().toLocaleLowerCase("es-ES") || "";
    const empleadosFiltrados = empleados.filter((nombre) => {
        const unidad = reglasPorEmpleado[nombre]?.rotacionUnidades || "";
        if (cargoFiltroActual && (reglasPorEmpleado[nombre]?.cargo || "Otros") !== cargoFiltroActual) return false;
        return `${nombre} ${unidad}`.toLocaleLowerCase("es-ES").includes(textoBusqueda);
    });

    empleadosFiltrados.sort((nombreA, nombreB) => compararEmpleados(nombreA, nombreB, ordenEmpleadosActual));

    empleadosFiltrados.forEach((nombre) => {
        const regla = reglasPorEmpleado[nombre] || {};
        const item = document.createElement("div");
        item.className = "empleado-item" + (empleadoActivo.nombre === nombre ? " activo" : "");
        item.dataset.cargo = regla.cargo || "Otros";
        const colorUnidad = obtenerColorUnidad(obtenerUnidadAsignada(regla, ""), regla.colorUnidad);
        item.style.setProperty("--color-unidad", colorUnidad);
        const ficha = document.createElement("button");
        ficha.type = "button";
        ficha.className = "empleado-ficha";
        ficha.innerHTML = `<strong>${nombre}</strong><small><span class="indicador-color-unidad" style="background-color: ${colorUnidad}"></span>${regla.rotacionUnidades || "Sin unidad"}</small><small class="cargo-empleado-lista">${regla.cargo || "Otros"}</small>`;
        ficha.addEventListener("click", () => abrirModalEmpleado(nombre));

        const botonEliminar = document.createElement("button");
        botonEliminar.type = "button";
        botonEliminar.className = "boton-eliminar-empleado";
        botonEliminar.textContent = "×";
        botonEliminar.title = `Eliminar a ${nombre}`;
        botonEliminar.setAttribute("aria-label", `Eliminar a ${nombre}`);
        botonEliminar.addEventListener("click", (event) => {
            event.stopPropagation();
            eliminarEmpleadoDesdeLista(nombre);
        });

        const control = document.createElement("label");
        control.className = "interruptor-rotacion";
        control.title = "Incluir en la generación de turnos";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = regla.participaRotacion !== false;
        checkbox.setAttribute("aria-label", `Incluir a ${nombre} en la rotación`);
        checkbox.addEventListener("click", (event) => event.stopPropagation());
        checkbox.addEventListener("change", () => {
            reglasPorEmpleado[nombre] = {
                ...reglasPorEmpleado[nombre],
                participaRotacion: checkbox.checked
            };
            guardarReglas();
            item.classList.toggle("excluido", !checkbox.checked);
        });
        const indicador = document.createElement("span");
        indicador.className = "interruptor-pista";
        control.appendChild(checkbox);
        control.appendChild(indicador);
        item.appendChild(ficha);

        const unidadesEmpleado = obtenerUnidadesIndividuales(regla.rotacionUnidades);
        if (unidadesEmpleado.length > 1) {
            item.classList.add("multiunidad");
            const unidadVigente = obtenerUnidadAsignada(regla);
            const botonUnidad = document.createElement("button");
            botonUnidad.type = "button";
            botonUnidad.className = "boton-unidad-activa";
            botonUnidad.textContent = unidadesSonIguales(unidadVigente, regla.rotacionUnidades) ? "Unidad: todas" : `Unidad: ${unidadVigente}`;
            botonUnidad.title = "Cambiar la unidad en la que se asignan turnos";
            botonUnidad.addEventListener("click", (event) => {
                event.stopPropagation();
                const posicion = unidadesEmpleado.findIndex((unidad) => unidadesSonIguales(unidad, regla.unidadActiva));
                reglasPorEmpleado[nombre] = { ...regla, unidadActiva: unidadesEmpleado[(posicion + 1) % unidadesEmpleado.length] };
                guardarReglas();
                mostrarEmpleados();
            });
            item.appendChild(botonUnidad);
        }
        item.appendChild(control);
        item.appendChild(botonEliminar);
        item.classList.toggle("excluido", !checkbox.checked);
        listaEmpleados.appendChild(item);
    });

    if (!empleadosFiltrados.length) {
        const vacio = document.createElement("p");
        vacio.className = "lista-vacia";
        vacio.textContent = empleados.length ? "No se encontraron empleados." : "Todavía no hay empleados añadidos.";
        listaEmpleados.appendChild(vacio);
    }
    actualizarBotonTodosEmpleados();
    actualizarSelectorUnidades();
}

function compararEmpleados(nombreA, nombreB, criterio) {
    const reglaA = reglasPorEmpleado[nombreA] || {};
    const reglaB = reglasPorEmpleado[nombreB] || {};

    if (criterio === "unidad") {
        const unidadA = reglaA.rotacionUnidades || "Sin unidad";
        const unidadB = reglaB.rotacionUnidades || "Sin unidad";
        const numeroA = extraerNumeroUnidad(unidadA);
        const numeroB = extraerNumeroUnidad(unidadB);
        let diferenciaUnidad = 0;
        if (numeroA !== null && numeroB !== null) diferenciaUnidad = numeroA - numeroB;
        else if (numeroA !== null) diferenciaUnidad = -1;
        else if (numeroB !== null) diferenciaUnidad = 1;
        else diferenciaUnidad = unidadA.localeCompare(unidadB, "es", { sensitivity: "base" });
        if (diferenciaUnidad !== 0) return diferenciaUnidad;
    }

    if (criterio === "sexo") {
        const sexoA = reglaA.sexo || "Sin indicar";
        const sexoB = reglaB.sexo || "Sin indicar";
        const diferenciaSexo = sexoA.localeCompare(sexoB, "es", { sensitivity: "base" });
        if (diferenciaSexo !== 0) return diferenciaSexo;
    }

    if (criterio === "profesion") {
        const profesionA = reglaA.cargo || "Otros";
        const profesionB = reglaB.cargo || "Otros";
        const diferenciaProfesion = profesionA.localeCompare(profesionB, "es", { sensitivity: "base" });
        if (diferenciaProfesion !== 0) return diferenciaProfesion;
    }

    return nombreA.localeCompare(nombreB, "es", { sensitivity: "base" });
}

function actualizarBotonTodosEmpleados() {
    if (!botonTodosEmpleados) return;

    const todosActivos = empleados.length > 0 && empleados.every((nombre) => {
        return reglasPorEmpleado[nombre]?.participaRotacion !== false;
    });
    botonTodosEmpleados.textContent = todosActivos ? "Desactivar todos" : "Activar todos";
    botonTodosEmpleados.setAttribute("aria-label", todosActivos
        ? "Desactivar todos los empleados de la rotación"
        : "Activar todos los empleados para la rotación");
}

function alternarTodosLosEmpleados() {
    if (!empleados.length) return;

    const todosActivos = empleados.every((nombre) => {
        return reglasPorEmpleado[nombre]?.participaRotacion !== false;
    });
    const nuevoEstado = !todosActivos;

    empleados.forEach((nombre) => {
        reglasPorEmpleado[nombre] = {
            ...reglasPorEmpleado[nombre],
            participaRotacion: nuevoEstado
        };
    });

    guardarReglas();
    mostrarEmpleados();
}

function eliminarEmpleadoDesdeLista(nombre) {
    const confirmado = window.confirm(`¿Quieres eliminar a ${nombre} de la aplicación?`);
    if (!confirmado) return;

    empleados = empleados.filter((empleado) => empleado !== nombre);
    diasPorRol = diasPorRol.filter((regla) => regla.empleado !== nombre);
    guardarDiasPorRol();
    delete reglasPorEmpleado[nombre];
    Object.keys(cambiosTurnosManuales).forEach((clave) => {
        if (clave.startsWith(`${nombre}::`)) delete cambiosTurnosManuales[clave];
    });
    Object.keys(horariosManualesTurnos).forEach((clave) => {
        if (clave.startsWith(`${nombre}::`)) delete horariosManualesTurnos[clave];
    });
    Object.keys(detallesCambiosManuales).forEach((clave) => {
        if (clave.startsWith(`${nombre}::`)) delete detallesCambiosManuales[clave];
    });

    guardarEmpleados();
    guardarReglas();
    guardarCambiosManuales();
    guardarHorariosManuales();
    guardarDetallesCambiosManuales();
    if (empleadoActivo.nombre === nombre) {
        empleadoActivo.nombre = null;
        cerrarModal();
    }
    mostrarEmpleados();
}

function renderizarReglasEmpleadoModal(nombre) {
    if (!contenedorReglasEmpleado) return;
    const regla = reglasPorEmpleado[nombre] || {
        turnoPreferido: "M1",
        turnosPreferidos: ["M1"],
        diasLibre: [],
        maxTurnos: 5,
        descanso: true,
        rotacionLibres: true
    };

    contenedorReglasEmpleado.innerHTML = "";
    const bloque = document.createElement("div");
    bloque.className = "regla-empleado";

    const grupo = document.createElement("div");
    grupo.className = "grupo-reglas";

    const colorUnidad = document.createElement("div");
    colorUnidad.className = "campo color-unidad-reglas";
    colorUnidad.innerHTML = `
        <label for="modalColorUnidad">Color de la unidad</label>
        <div class="selector-color-unidad">
            <input type="color" id="modalColorUnidad" value="${obtenerColorUnidad(regla.rotacionUnidades, regla.colorUnidad)}">
            <span>Identifica visualmente esta unidad en empleados y cuadrante.</span>
        </div>
    `;
    grupo.appendChild(colorUnidad);

    const unidadReglas = document.createElement("div");
    unidadReglas.className = "campo campo-full unidad-reglas";
    unidadReglas.innerHTML = `
        <label for="modalUnidadTrabajo">Unidad de trabajo</label>
        <div class="unidad-trabajo-visual">
            <span class="indicador-color-unidad grande" style="background-color: ${obtenerColorUnidad(regla.rotacionUnidades, regla.colorUnidad)}"></span>
            <input type="text" id="modalUnidadTrabajo" value="${regla.rotacionUnidades || ""}" placeholder="Escribe la unidad de trabajo">
        </div>
    `;
    grupo.appendChild(unidadReglas);
    const unidadTrabajoInput = unidadReglas.querySelector("#modalUnidadTrabajo");
    const indicadorUnidadTrabajo = unidadReglas.querySelector(".indicador-color-unidad");
    unidadTrabajoInput?.addEventListener("input", () => {
        indicadorUnidadTrabajo.style.backgroundColor = obtenerColorUnidad(unidadTrabajoInput.value, regla.colorUnidad);
    });

    const selectorTurnos = document.createElement("details");
    selectorTurnos.className = "selector-turnos-reglas";
    selectorTurnos.open = true;

    const turnosLabel = document.createElement("summary");
    turnosLabel.textContent = "Seleccionador de roles del empleado";
    selectorTurnos.appendChild(turnosLabel);

    const botonLimpiarSelecciones = document.createElement("button");
    botonLimpiarSelecciones.type = "button";
    botonLimpiarSelecciones.className = "boton boton-secundario boton-limpiar-selecciones";
    botonLimpiarSelecciones.textContent = "Limpiar selecciones";
    botonLimpiarSelecciones.title = "Quitar las selecciones de roles, horarios y unidades";
    botonLimpiarSelecciones.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        selectorTurnos.querySelectorAll("input[data-tipo-turno='preferido']").forEach((input) => {
            input.checked = false;
        });
        horariosColumna.querySelectorAll(".horario-trabajo-opcion").forEach((opcion) => opcion.classList.remove("activo"));
        listaUnidades?.querySelectorAll(".unidad-trabajo-opcion").forEach((opcion) => {
            opcion.classList.remove("activa");
            opcion.setAttribute("aria-pressed", "false");
        });
        unidadTrabajoInput.value = "";
        unidadTrabajoInput.dispatchEvent(new Event("input"));
    });
    selectorTurnos.appendChild(botonLimpiarSelecciones);

    const selectorCuerpo = document.createElement("div");
    selectorCuerpo.className = "selector-roles-cuerpo";
    const unidadesColumna = document.createElement("aside");
    unidadesColumna.className = "unidades-trabajo-columna";
    const tituloUnidades = document.createElement("h4");
    tituloUnidades.textContent = "Unidades de trabajo";
    unidadesColumna.appendChild(tituloUnidades);
    const listaUnidades = document.createElement("div");
    listaUnidades.className = "lista-unidades-trabajo";
    unidadesColumna.appendChild(listaUnidades);
    const rolesColumna = document.createElement("div");
    rolesColumna.className = "roles-empleado-columna";
    const tituloRoles = document.createElement("h4");
    tituloRoles.className = "titulo-roles-empleado";
    tituloRoles.textContent = "Roles del empleado";
    rolesColumna.appendChild(tituloRoles);
    const horariosColumna = document.createElement("aside");
    horariosColumna.className = "horarios-trabajo-columna";
    const tituloHorarios = document.createElement("h4");
    tituloHorarios.textContent = "Horarios por turno";
    horariosColumna.appendChild(tituloHorarios);
    const listasHorarios = new Map();
    const crearListaHorarios = (grupo, titulo) => {
        const bloqueHorarios = document.createElement("div");
        bloqueHorarios.className = "subgrupo-horarios-trabajo";
        const encabezado = document.createElement("h5");
        encabezado.textContent = titulo;
        const lista = document.createElement("div");
        lista.className = "lista-horarios-trabajo";
        bloqueHorarios.append(encabezado, lista);
        horariosColumna.appendChild(bloqueHorarios);
        listasHorarios.set(grupo, lista);
    };
    crearListaHorarios("mañanas", "Mañana");
    crearListaHorarios("tardes", "Tarde");
    crearListaHorarios("otros", "Otros");
    selectorCuerpo.append(rolesColumna, horariosColumna, unidadesColumna);
    selectorTurnos.appendChild(selectorCuerpo);

    const unidadesTrabajo = obtenerUnidadesTrabajoDisponibles(regla.rotacionUnidades);
    const unidadesSeleccionadas = new Set(
        String(regla.rotacionUnidades || "")
            .split(/[,;]+/)
            .map((unidad) => unidad.trim())
            .filter(Boolean)
    );
    unidadesTrabajo.forEach((unidad) => {
        const botonUnidad = document.createElement("button");
        botonUnidad.type = "button";
        botonUnidad.className = "unidad-trabajo-opcion";
        botonUnidad.textContent = unidad;
        if (!UNIDADES_BASE.some((item) => unidadesSonIguales(item, unidad))) {
            botonUnidad.classList.add("item-personalizado");
            botonUnidad.title = "Pulsa para seleccionar. Usa el botón de eliminar para quitar esta unidad.";
            const eliminarUnidad = document.createElement("span");
            eliminarUnidad.className = "eliminar-item-columna";
            eliminarUnidad.textContent = "×";
            eliminarUnidad.title = `Eliminar ${unidad}`;
            eliminarUnidad.setAttribute("aria-label", `Eliminar ${unidad}`);
            eliminarUnidad.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                eliminarUnidadTrabajo(unidad, nombre);
            });
            botonUnidad.appendChild(eliminarUnidad);
        }
        botonUnidad.classList.toggle("activa", Array.from(unidadesSeleccionadas).some((seleccionada) => unidadesSonIguales(unidad, seleccionada)));
        botonUnidad.setAttribute("aria-pressed", String(botonUnidad.classList.contains("activa")));
        botonUnidad.addEventListener("click", () => {
            const seleccionada = Array.from(unidadesSeleccionadas).find((item) => unidadesSonIguales(item, unidad));
            if (seleccionada) {
                unidadesSeleccionadas.delete(seleccionada);
                botonUnidad.classList.remove("activa");
            } else {
                unidadesSeleccionadas.add(unidad);
                botonUnidad.classList.add("activa");
            }
            botonUnidad.setAttribute("aria-pressed", String(botonUnidad.classList.contains("activa")));
            unidadTrabajoInput.value = Array.from(unidadesSeleccionadas).join(", ");
            unidadTrabajoInput.dispatchEvent(new Event("input"));
        });
        listaUnidades.appendChild(botonUnidad);
    });

    const turnosSeleccionados = obtenerTurnosPreferidos(regla);

    const turnosCatalogo = obtenerCatalogoTurnosEmpleado(regla);
    const turnosManana = turnosCatalogo
        .filter((turno) => /^(M|CD|RF)/.test(turno.codigo))
        .sort((a, b) => ordenarCodigosTurno(a.codigo, b.codigo));
    const turnosTarde = turnosCatalogo
        .filter((turno) => /^T/.test(turno.codigo))
        .sort((a, b) => ordenarCodigosTurno(a.codigo, b.codigo));
    const turnosOtros = turnosCatalogo
        .filter((turno) => !turnosManana.includes(turno) && !turnosTarde.includes(turno))
        .sort((a, b) => ordenarCodigosTurno(a.codigo, b.codigo));

    const actualizarHorarioActivo = (grupo, horario, activo = true) => {
        const listaHorarios = listasHorarios.get(grupo);
        listaHorarios?.querySelectorAll(".horario-trabajo-opcion").forEach((opcion) => {
            opcion.classList.toggle("activo", activo && opcion.dataset.horario === horario);
        });
    };

    const agregarHorariosGrupo = (grupo, turnos) => {
        const horariosUnicos = Array.from(turnos.reduce((horarios, turno) => {
            const horario = turno.horario || "Sin horario";
            if (!horarios.has(horario)) horarios.set(horario, []);
            horarios.get(horario).push(turno);
            return horarios;
        }, new Map()).entries());
        const listaHorarios = listasHorarios.get(grupo);

        horariosUnicos.forEach(([horario, turnosHorario]) => {
            const botonHorario = document.createElement("button");
            botonHorario.type = "button";
            botonHorario.className = "horario-trabajo-opcion";
            botonHorario.dataset.horario = horario;
            botonHorario.textContent = horario;
            botonHorario.title = "Seleccionar este horario de trabajo";
            botonHorario.setAttribute("aria-label", `Seleccionar horario ${horario}`);
            const rolesPersonalizadosHorario = turnosHorario.filter((turno) => esRolPersonalizado(turno.codigo));
            if (rolesPersonalizadosHorario.length) {
                botonHorario.classList.add("item-personalizado");
                const eliminarHorario = document.createElement("span");
                eliminarHorario.className = "eliminar-item-columna";
                eliminarHorario.textContent = "×";
                eliminarHorario.title = `Eliminar horario ${horario}`;
                eliminarHorario.setAttribute("aria-label", `Eliminar horario ${horario}`);
                eliminarHorario.addEventListener("click", (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    eliminarHorarioTrabajo(horario, nombre);
                });
                botonHorario.appendChild(eliminarHorario);
            }
            botonHorario.addEventListener("click", () => {
                actualizarHorarioActivo(grupo, horario);
            });
            listaHorarios.appendChild(botonHorario);
        });
    };

    agregarHorariosGrupo("mañanas", turnosManana);
    agregarHorariosGrupo("tardes", turnosTarde);
    agregarHorariosGrupo("otros", turnosOtros);

    agregarGrupoTurnos(rolesColumna, "Turnos de mañana", "mañanas", turnosManana, turnosSeleccionados);
    agregarGrupoTurnos(rolesColumna, "Turnos de tarde", "tardes", turnosTarde, turnosSeleccionados);
    agregarGrupoTurnos(rolesColumna, "Otros turnos", "otros", turnosOtros, turnosSeleccionados);
    turnosSeleccionados.forEach((codigo) => {
        const turnoInicial = turnosCatalogo.find((turno) => turno.codigo === codigo);
        if (turnoInicial) actualizarHorarioActivo(clasificarTurno(turnoInicial.codigo), turnoInicial.horario);
    });

    function crearOpcionTurno(turno, grupo) {
        const label = document.createElement("label");
        label.className = "check-inline turno-catalogo";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = turno.codigo;
        input.dataset.turnoCodigo = turno.codigo;
        input.dataset.tipoTurno = "preferido";
        input.checked = turnosSeleccionados.includes(turno.codigo);
        const cargoModal = cargoEmpleadoModal?.value || reglasPorEmpleado[nombre]?.cargo;
        if (!turnoCompatibleConProfesion({ ...reglasPorEmpleado[nombre], cargo: cargoModal }, turno.codigo)) {
            input.checked = false;
            input.disabled = true;
            label.classList.add("turno-no-profesion");
            label.title = `No corresponde a la profesión (${cargoModal || "Otros"})`;
        }
        input.addEventListener("change", () => {
            if (input.checked) actualizarHorarioActivo(grupo, turno.horario);
            else if (!selectorTurnos.querySelector(`input[data-tipo-turno='preferido'][data-grupo-turno='${grupo}']:checked`)) {
                actualizarHorarioActivo(grupo, turno.horario, false);
            }
        });
        label.appendChild(input);
        const detalle = document.createElement("span");
        detalle.innerHTML = `<strong>${turno.codigo}</strong><small>${turno.nombre} · ${turno.horario}</small><small>${turno.descripcion}</small>`;
        if (esRolPersonalizado(turno.codigo)) {
            const eliminarRol = document.createElement("button");
            eliminarRol.type = "button";
            eliminarRol.className = "eliminar-rol-columna";
            eliminarRol.textContent = "×";
            eliminarRol.title = `Eliminar rol ${turno.codigo}`;
            eliminarRol.setAttribute("aria-label", `Eliminar rol ${turno.codigo}`);
            eliminarRol.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                eliminarRolPersonalizado(turno.codigo, nombre);
            });
            detalle.appendChild(eliminarRol);
        }
        label.appendChild(detalle);
        return label;
    }

    function agregarGrupoTurnos(contenedor, titulo, grupo, turnos, seleccionados) {
        if (!turnos.length) return;
        const grupoTurnos = document.createElement("div");
        grupoTurnos.className = "subgrupo-turnos-preferidos";
        const encabezado = document.createElement("h5");
        encabezado.textContent = titulo;
        grupoTurnos.appendChild(encabezado);
        const opciones = document.createElement("div");
        opciones.className = "grupo-reglas catalogo-turnos";
        turnos.forEach((turno) => {
            const opcion = crearOpcionTurno(turno, grupo);
            opcion.querySelector("input").dataset.grupoTurno = grupo;
            opciones.appendChild(opcion);
        });
        grupoTurnos.appendChild(opciones);
        contenedor.appendChild(grupoTurnos);
    }

    const nuevaRegla = document.createElement("details");
    nuevaRegla.className = "nueva-regla-turno";
    nuevaRegla.innerHTML = `
        <summary>Crear nuevo rol de turno</summary>
        <div class="nueva-regla-contenido">
            <div class="form-grid">
                <div class="campo"><label for="nuevoCodigoTurno">Código</label><input type="text" id="nuevoCodigoTurno" list="codigosTurnoGuardados" placeholder="Ejemplo: X1"><datalist id="codigosTurnoGuardados"></datalist></div>
                <div class="campo"><label for="nuevoNombreTurno">Nombre</label><input type="text" id="nuevoNombreTurno" placeholder="Nombre del turno"></div>
                <div class="campo"><label for="nuevoHorarioTurno">Horario</label><input type="text" id="nuevoHorarioTurno" placeholder="07:45 - 14:45"></div>
                <div class="campo campo-full"><label for="nuevaDescripcionTurno">Descripción</label><input type="text" id="nuevaDescripcionTurno" placeholder="Aplicación de este turno"></div>
            </div>
            <small class="ayuda-regla-turno">Completa los datos y pulsa Guardar rol para incorporarlo al seleccionador.</small>
            <div class="crear-unidad-desde-rol">
                <input id="nuevaUnidadDesdeRol" type="text" placeholder="Nombre de la unidad">
                <button id="crearUnidadDesdeRol" class="boton boton-secundario boton-crear-unidad-rol" type="button">Crear unidad de trabajo</button>
            </div>
        </div>
    `;
    const codigosGuardados = obtenerCodigosTurnoGuardados();
    const listaCodigos = nuevaRegla.querySelector("#codigosTurnoGuardados");
    codigosGuardados.forEach((codigo) => {
        const opcion = document.createElement("option");
        opcion.value = codigo;
        listaCodigos.appendChild(opcion);
    });
    selectorTurnos.appendChild(nuevaRegla);

    const vacacionesPanel = document.createElement("div");
    vacacionesPanel.className = "form-grid vacaciones-panel";
    vacacionesPanel.innerHTML = `
        <div class="campo">
            <label for="modalVacacionesInicio">Inicio de vacaciones</label>
            <input type="date" id="modalVacacionesInicio" value="${regla.vacacionesInicio || ""}">
        </div>
        <div class="campo">
            <label for="modalVacacionesFin">Fin de vacaciones</label>
            <input type="date" id="modalVacacionesFin" value="${regla.vacacionesFin || ""}">
        </div>
    `;
    vacacionesPanel.classList.toggle("oculto", !turnosSeleccionados.includes("Vacaciones"));
    rolesColumna.appendChild(vacacionesPanel);
    grupo.appendChild(selectorTurnos);

    const botonGuardarRegla = document.createElement("button");
    botonGuardarRegla.id = "guardarNuevaReglaTurno";
    botonGuardarRegla.type = "button";
    botonGuardarRegla.className = "boton boton-primario boton-guardar-regla";
    botonGuardarRegla.title = "Guardar la selección de roles (y el nuevo rol, si lo has completado)";
    botonGuardarRegla.textContent = "Guardar roles";
    botonGuardarRegla.addEventListener("click", () => {
        const camposNuevoRol = ["#nuevoCodigoTurno", "#nuevoNombreTurno", "#nuevoHorarioTurno", "#nuevaDescripcionTurno"];
        const hayNuevoRol = camposNuevoRol.some((selector) => nuevaRegla.querySelector(selector)?.value.trim());
        if (hayNuevoRol) agregarReglaTurnoEmpleado(nombre, true, nuevaRegla);
        else guardarCambiosEmpleado();
    });
    grupo.appendChild(botonGuardarRegla);

    nuevaRegla.querySelector("#crearUnidadDesdeRol").addEventListener("click", () => {
        const campoUnidad = nuevaRegla.querySelector("#nuevaUnidadDesdeRol");
        const unidad = campoUnidad.value.trim().replace(/\s+/g, " ");
        if (!unidad) return;
        if (Object.keys(configuracionUnidades).some((item) => unidadesSonIguales(item, unidad))) {
            alert("Esa unidad ya existe");
            return;
        }

        const numero = extraerNumeroUnidad(unidad);
        const unidadNormalizada = numero === null ? unidad : `Unidad ${numero}`;
        configuracionUnidades[unidadNormalizada] = {
            color: obtenerColorUnidadDisponible(),
            turnos: []
        };
        localStorage.setItem(STORAGE_UNIDADES_CONFIG_KEY, JSON.stringify(configuracionUnidades));
        actualizarSelectorUnidades();
        campoUnidad.value = "";

        const botonUnidad = document.createElement("button");
        botonUnidad.type = "button";
        botonUnidad.className = "unidad-trabajo-opcion";
        botonUnidad.textContent = unidadNormalizada;
        botonUnidad.setAttribute("aria-pressed", "false");
        botonUnidad.addEventListener("click", () => {
            const seleccionadas = new Set(unidadTrabajoInput.value.split(/[,;]+/).map((item) => item.trim()).filter(Boolean));
            const existente = Array.from(seleccionadas).find((item) => unidadesSonIguales(item, unidadNormalizada));
            if (existente) {
                seleccionadas.delete(existente);
                botonUnidad.classList.remove("activa");
            } else {
                seleccionadas.add(unidadNormalizada);
                botonUnidad.classList.add("activa");
            }
            botonUnidad.setAttribute("aria-pressed", String(botonUnidad.classList.contains("activa")));
            unidadTrabajoInput.value = Array.from(seleccionadas).join(", ");
            unidadTrabajoInput.dispatchEvent(new Event("input"));
        });
        listaUnidades.appendChild(botonUnidad);
    });

    const reglasUnidades = document.createElement("div");
    reglasUnidades.className = "reglas-unidades-especiales campo-full";
    const unidadAsignada = regla.rotacionUnidades || "";
    reglasUnidades.innerHTML = `
        <strong>Configuración de comportamiento de la aplicación</strong>
        <label class="check-inline">
            <input type="checkbox" id="modalReglaUnidad5" ${regla.reglaResponsableUnidad5 !== false ? "checked" : ""}>
            Unidad 5: distribuir M4, M5 y M6 por la mañana; T3 y T4 por la tarde
        </label>
        <label class="check-inline">
            <input type="checkbox" id="modalReglaUnidad4" ${regla.reglaResponsableUnidad4 !== false ? "checked" : ""}>
            Unidad 4: distribuir M1, M2 y M3 por la mañana; T1 y T2 por la tarde
        </label>
        <small>La aplicación alterna las franjas por semanas y respeta el horario individual de cada código.</small>
    `;
    if (!unidadCoincide(unidadAsignada, 5)) {
        reglasUnidades.querySelector("#modalReglaUnidad5").checked = false;
    }
    if (!unidadCoincide(unidadAsignada, 4)) {
        reglasUnidades.querySelector("#modalReglaUnidad4").checked = false;
    }
    grupo.appendChild(reglasUnidades);

    const vacacionesCheckbox = selectorTurnos.querySelector("input[value='Vacaciones']");
    vacacionesCheckbox?.addEventListener("change", () => {
        vacacionesPanel.classList.toggle("oculto", !vacacionesCheckbox.checked);
    });

    const labelMax = document.createElement("label");
    labelMax.textContent = "Máximo de turnos consecutivos:";

    const selectMax = document.createElement("input");
    selectMax.type = "number";
    selectMax.min = "1";
    selectMax.max = "31";
    selectMax.id = "modalMaxTurnos";
    selectMax.value = String(Math.min(Math.max(Number(regla.maxTurnos) || 5, 1), 31));
    labelMax.appendChild(selectMax);
    grupo.appendChild(labelMax);

    const botonAplicarMaximo = document.createElement("button");
    botonAplicarMaximo.type = "button";
    botonAplicarMaximo.className = "boton boton-secundario boton-regla-accion";
    botonAplicarMaximo.textContent = "Aplicar máximo manual";
    botonAplicarMaximo.addEventListener("click", () => {
        if (!selectMax.reportValidity()) return;
        guardarCambiosEmpleado();
    });
    grupo.appendChild(botonAplicarMaximo);

    const labelDescanso = document.createElement("label");
    labelDescanso.className = "check-inline";
    labelDescanso.innerHTML = '<input type="checkbox" id="modalDescanso" ' + (regla.descanso !== false ? "checked" : "") + '> Permitir descanso';
    grupo.appendChild(labelDescanso);

    const labelRotacion = document.createElement("label");
    labelRotacion.className = "check-inline";
    labelRotacion.innerHTML = '<input type="checkbox" id="modalRotacionLibres" ' + (regla.rotacionLibres !== false ? "checked" : "") + '> Rotación de libres';
    grupo.appendChild(labelRotacion);

    bloque.appendChild(grupo);

    const diasLabel = document.createElement("div");
    diasLabel.innerHTML = "<strong>Días libres:</strong>";
    bloque.appendChild(diasLabel);

    const diasGrupo = document.createElement("div");
    diasGrupo.className = "grupo-reglas";
    diasSemana.forEach((dia) => {
        const label = document.createElement("label");
        label.className = "check-inline";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = dia;
        input.dataset.tipoTurno = "dia";
        input.checked = !!(regla.diasLibre && regla.diasLibre.includes(dia));
        label.appendChild(input);
        label.appendChild(document.createTextNode(dia));
        diasGrupo.appendChild(label);
    });
    bloque.appendChild(diasGrupo);
    contenedorReglasEmpleado.appendChild(bloque);
}

function renombrarEmpleado(anterior, nuevo) {
    historialCambios.length = 0;
    actualizarBotonDeshacer();
    empleados = empleados.map((nombre) => (nombre === anterior ? nuevo : nombre));
    diasPorRol.forEach((regla) => {
        if (regla.empleado === anterior) regla.empleado = nuevo;
    });
    guardarDiasPorRol();
    if (reglasPorEmpleado[anterior]) {
        reglasPorEmpleado[nuevo] = reglasPorEmpleado[anterior];
        delete reglasPorEmpleado[anterior];
    }
    const prefijo = `${anterior}::`;
    [cambiosTurnosManuales, horariosManualesTurnos, detallesCambiosManuales].forEach((almacen) => {
        Object.keys(almacen).filter((clave) => clave.startsWith(prefijo)).forEach((clave) => {
            almacen[`${nuevo}::${clave.slice(prefijo.length)}`] = almacen[clave];
            delete almacen[clave];
        });
    });
    guardarCambiosManuales();
    guardarHorariosManuales();
    guardarDetallesCambiosManuales();
    empleadoActivo.nombre = nuevo;
}

function guardarCambiosEmpleado() {
    if (!empleadoActivo.nombre) return;

    const empleadoAnterior = empleadoActivo.nombre;
    const empleado = (document.getElementById("nombreCompletoEmpleado")?.value || "").trim().replace(/\s+/g, " ");
    if (!empleado) {
        alert("Escribe el nombre completo del empleado");
        return;
    }
    if (empleado !== empleadoAnterior && empleados.some((nombre) => nombre !== empleadoAnterior && nombre.toLowerCase() === empleado.toLowerCase())) {
        alert("Ya existe un empleado con ese nombre");
        return;
    }
    const reglaActual = reglasPorEmpleado[empleadoAnterior] || {};
    const turnosPreferidos = Array.from(document.querySelectorAll("#contenedorReglasEmpleado input[data-tipo-turno='preferido']"))
        .filter((input) => input.checked)
        .map((input) => input.value)
        .filter((turno) => turnoCompatibleConProfesion({ ...reglaActual, cargo: cargoEmpleadoModal?.value || reglaActual.cargo }, turno));
    if (!turnosPreferidos.length) {
        alert("Selecciona al menos un turno preferido compatible con la profesión del empleado");
        return;
    }

    const unidadOriginal = String(reglaActual.rotacionUnidades || "").trim();
    const unidadContrato = unidadActual?.value.trim() || "";
    const unidadRoles = document.getElementById("modalUnidadTrabajo")?.value.trim() || "";
    // Gana el campo que el usuario haya modificado; si ambos cambian, prevalece Contratación.
    const unidadTrabajo = (unidadContrato !== unidadOriginal ? unidadContrato : unidadRoles) || "Sin unidad";
    const turnosAjustados = normalizarTurnosParaUnidad(unidadTrabajo, turnosPreferidos);
    const turnoPreferido = turnosAjustados[0];
    const colorUnidad = normalizarColor(document.getElementById("modalColorUnidad")?.value);
    const vacacionesSeleccionadas = turnosAjustados.includes("Vacaciones");
    const vacacionesInicio = document.getElementById("modalVacacionesInicio")?.value || "";
    const vacacionesFin = document.getElementById("modalVacacionesFin")?.value || "";
    if (vacacionesSeleccionadas && (!vacacionesInicio || !vacacionesFin)) {
        alert("Indica la fecha de inicio y la fecha de fin de las vacaciones");
        return;
    }
    if (vacacionesInicio && vacacionesFin && vacacionesFin < vacacionesInicio) {
        alert("La fecha de fin de vacaciones no puede ser anterior a la fecha de inicio");
        return;
    }
    const maxTurnos = Number(document.getElementById("modalMaxTurnos")?.value || 2);
    const descanso = document.getElementById("modalDescanso")?.checked || false;
    const rotacionLibres = document.getElementById("modalRotacionLibres")?.checked || false;
    const diasLibre = Array.from(document.querySelectorAll("#contenedorReglasEmpleado input[data-tipo-turno='dia']"))
        .filter((input) => input.checked)
        .map((input) => input.value);

    const datosContrato = {
        tipoContrato: tipoContrato?.value || "Fijo",
        jornada: jornada?.value || "Completa",
        porcentajeHorasMes: Number(porcentajeHorasEmpleado?.value ?? 100),
        rotacionUnidades: unidadActual?.value || nombresUnidades[0] || "Unidad 1",
        fechaAlta: fechaAlta?.value || "",
        sexo: sexoEmpleado?.value || "",
        transportePropio: transportePropio?.value || "No",
        cargo: cargoEmpleadoModal?.value || "Otros",
        observaciones: observacionesEmpleado?.value || ""
    };

    if (empleado !== empleadoAnterior) renombrarEmpleado(empleadoAnterior, empleado);

    reglasPorEmpleado[empleado] = {
        ...reglaActual,
        ...datosContrato,
        rotacionUnidades: unidadTrabajo,
        colorUnidad,
        reglaResponsableUnidad5: unidadCoincide(unidadTrabajo, 5)
            ? true
            : document.getElementById("modalReglaUnidad5")?.checked || false,
        reglaResponsableUnidad4: unidadCoincide(unidadTrabajo, 4)
            ? true
            : document.getElementById("modalReglaUnidad4")?.checked || false,
        turnoPreferido,
        turnosPreferidos: turnosAjustados,
        vacacionesInicio,
        vacacionesFin,
        maxTurnos: Math.min(Math.max(1, maxTurnos || 1), 31),
        descanso,
        rotacionLibres,
        diasLibre,
        porcentajeHorasMes: Math.min(Math.max(Number(datosContrato.porcentajeHorasMes) || 0, 0), 100)
    };

    guardarReglas();
    guardarEmpleados();
    historialCambios.length = 0;
    actualizarBotonDeshacer();
    mostrarEmpleados();
    renderizarDiasPorRol();
    abrirModalEmpleado(empleado);
    alert("Cambios guardados correctamente");
}

function esRolPersonalizado(codigo) {
    return rolesPersonalizadosGuardados.some((rol) => rol.codigo === codigo);
}

function eliminarRolPersonalizado(codigo, empleadoActual) {
    const rol = rolesPersonalizadosGuardados.find((item) => item.codigo === codigo);
    if (!rol || !window.confirm(`¿Quieres eliminar el rol ${codigo} de toda la aplicación?`)) return;

    quitarRolPersonalizadoDelCatalogo(codigo);
    Object.values(configuracionUnidades).forEach((configuracion) => {
        configuracion.turnos = configuracion.turnos.filter((turno) => turno !== codigo);
    });
    localStorage.setItem(STORAGE_UNIDADES_CONFIG_KEY, JSON.stringify(configuracionUnidades));
    renderizarConfiguracionUnidades();
    actualizarSelectorUnidades();
    mostrarEmpleados();
    renderizarReglasEmpleadoModal(empleadoActual);
}

function quitarRolPersonalizadoDelCatalogo(codigo) {
    diasPorRol = diasPorRol.filter((regla) => regla.codigo !== codigo);
    guardarDiasPorRol();
    renderizarDiasPorRol();
    rolesPersonalizadosGuardados = rolesPersonalizadosGuardados.filter((item) => item.codigo !== codigo);
    Object.values(reglasPorEmpleado).forEach((regla) => {
        if (Array.isArray(regla.reglasPersonalizadas)) {
            regla.reglasPersonalizadas = regla.reglasPersonalizadas.filter((item) => item.codigo !== codigo);
        }
        if (Array.isArray(regla.turnosPreferidos)) {
            regla.turnosPreferidos = regla.turnosPreferidos.filter((item) => item !== codigo);
        }
        if (regla.turnoPreferido === codigo) regla.turnoPreferido = "M1";
    });
    guardarRolesPersonalizados();
    guardarReglas();
}

function eliminarHorarioTrabajo(horario, empleadoActual) {
    const rolesHorario = rolesPersonalizadosGuardados.filter((rol) => rol.horario === horario);
    if (!rolesHorario.length || !window.confirm(`¿Quieres eliminar el horario ${horario} y sus roles personalizados?`)) return;
    const codigos = new Set(rolesHorario.map((rol) => rol.codigo));
    diasPorRol = diasPorRol.filter((regla) => !codigos.has(regla.codigo));
    guardarDiasPorRol();
    renderizarDiasPorRol();
    rolesPersonalizadosGuardados = rolesPersonalizadosGuardados.filter((rol) => !codigos.has(rol.codigo));
    Object.values(reglasPorEmpleado).forEach((regla) => {
        if (Array.isArray(regla.reglasPersonalizadas)) regla.reglasPersonalizadas = regla.reglasPersonalizadas.filter((rol) => !codigos.has(rol.codigo));
        if (Array.isArray(regla.turnosPreferidos)) regla.turnosPreferidos = regla.turnosPreferidos.filter((codigo) => !codigos.has(codigo));
        if (codigos.has(regla.turnoPreferido)) regla.turnoPreferido = "M1";
    });
    guardarRolesPersonalizados();
    guardarReglas();
    renderizarReglasEmpleadoModal(empleadoActual);
}

function eliminarUnidadTrabajo(unidad, empleadoActual) {
    if (UNIDADES_BASE.some((item) => unidadesSonIguales(item, unidad))) return;
    if (!window.confirm(`¿Quieres eliminar la unidad ${unidad} de toda la aplicación?`)) return;

    const configuracion = Object.keys(configuracionUnidades).find((item) => unidadesSonIguales(item, unidad));
    if (configuracion) delete configuracionUnidades[configuracion];
    Object.values(reglasPorEmpleado).forEach((regla) => {
        if (!regla.rotacionUnidades) return;
        regla.rotacionUnidades = regla.rotacionUnidades
            .split(/[,;]+/)
            .map((item) => item.trim())
            .filter((item) => item && !unidadesSonIguales(item, unidad))
            .join(", ");
    });
    localStorage.setItem(STORAGE_UNIDADES_CONFIG_KEY, JSON.stringify(configuracionUnidades));
    guardarReglas();
    actualizarSelectorUnidades();
    renderizarReglasEmpleadoModal(empleadoActual);
}

function obtenerCodigosTurnoGuardados() {
    const codigos = [...catalogoTurnos.map((turno) => turno.codigo), ...rolesPersonalizadosGuardados.map((turno) => turno.codigo)];
    Object.values(reglasPorEmpleado).forEach((regla) => {
        if (!Array.isArray(regla?.reglasPersonalizadas)) return;
        regla.reglasPersonalizadas.forEach((turno) => {
            if (turno.codigo && !codigos.includes(turno.codigo)) codigos.push(turno.codigo);
        });
    });
    return codigos.sort(ordenarCodigosTurno);
}

function obtenerUnidadesTrabajoDisponibles(unidadActual) {
    const unidades = [];
    const agregarUnidad = (unidad) => {
        const texto = String(unidad || "").trim();
        if (texto && !unidades.some((item) => unidadesSonIguales(item, texto))) unidades.push(texto);
    };

    Object.keys(configuracionUnidades).forEach(agregarUnidad);
    nombresUnidades.forEach(agregarUnidad);
    empleados.forEach((empleado) => agregarUnidad(reglasPorEmpleado[empleado]?.rotacionUnidades));
    agregarUnidad(unidadActual);

    return ordenarUnidades(unidades.filter((unidad) => !esUnidadConLetra(unidad)), (unidad) => unidad);
}

function guardarReglaAutomatica(nombre, contenedor) {
    const codigo = contenedor.querySelector("#nuevoCodigoTurno")?.value.trim();
    const nombreTurno = contenedor.querySelector("#nuevoNombreTurno")?.value.trim();
    const horario = contenedor.querySelector("#nuevoHorarioTurno")?.value.trim();
    if (!codigo || !nombreTurno || !horario) return;
    agregarReglaTurnoEmpleado(nombre, false);
}

function agregarReglaTurnoEmpleado(nombre, mostrarAviso = true, contenedor = document) {
    const codigo = contenedor.querySelector("#nuevoCodigoTurno")?.value.trim().toUpperCase();
    const nombreTurno = contenedor.querySelector("#nuevoNombreTurno")?.value.trim();
    const horario = contenedor.querySelector("#nuevoHorarioTurno")?.value.trim();
    const descripcion = contenedor.querySelector("#nuevaDescripcionTurno")?.value.trim() || "Rol personalizado";

    if (!codigo || !nombreTurno || !horario) {
        if (mostrarAviso) alert("Completa el código, nombre y horario del nuevo rol");
        return;
    }
    if (!/^[MT][A-Z0-9-]{1,7}$/.test(codigo)) {
        if (mostrarAviso) alert("El código debe empezar por M o T y tener entre 2 y 8 caracteres");
        return;
    }
    if (!/^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}$/.test(horario)) {
        if (mostrarAviso) alert("El horario debe tener el formato 07:45 - 14:45");
        return;
    }
    if (catalogoTurnos.some((turno) => turno.codigo === codigo) || rolesPersonalizadosGuardados.some((turno) => turno.codigo === codigo)) {
        if (mostrarAviso) alert("Ese código ya existe en la aplicación");
        return;
    }

    const regla = reglasPorEmpleado[nombre] || {};
    const reglasPersonalizadas = Array.isArray(regla.reglasPersonalizadas) ? regla.reglasPersonalizadas : [];
    if (reglasPersonalizadas.some((turno) => turno.codigo === codigo)) {
        if (mostrarAviso) alert("Ese código ya existe para este empleado");
        return;
    }

    reglasPersonalizadas.push({ codigo, nombre: nombreTurno, horario, descripcion });
    reglasPorEmpleado[nombre] = {
        ...regla,
        reglasPersonalizadas,
        turnosPreferidos: [...new Set([...(regla.turnosPreferidos || []), codigo])],
        turnoPreferido: regla.turnoPreferido || codigo
    };
    const indiceRolGlobal = rolesPersonalizadosGuardados.findIndex((rol) => rol.codigo === codigo);
    const rolPersonalizado = { codigo, nombre: nombreTurno, horario, descripcion };
    if (indiceRolGlobal >= 0) {
        rolesPersonalizadosGuardados[indiceRolGlobal] = rolPersonalizado;
    } else {
        rolesPersonalizadosGuardados.push(rolPersonalizado);
    }
    guardarRolesPersonalizados();
    // Sin esto la unidad del empleado no lo consideraría asignable y nunca saldría en el cuadro.
    const claveUnidad = Object.keys(configuracionUnidades).find((unidad) => unidadesSonIguales(unidad, obtenerUnidadAsignada(reglasPorEmpleado[nombre], "")));
    if (claveUnidad && Array.isArray(configuracionUnidades[claveUnidad].turnos) && !configuracionUnidades[claveUnidad].turnos.includes(codigo)) {
        configuracionUnidades[claveUnidad].turnos.push(codigo);
        localStorage.setItem(STORAGE_UNIDADES_CONFIG_KEY, JSON.stringify(configuracionUnidades));
        renderizarConfiguracionUnidades();
    }
    guardarReglas();
    renderizarReglasEmpleadoModal(nombre);
    renderizarDiasPorRol();
    if (mostrarAviso) alert(`Rol ${codigo} añadido para ${nombre}`);
}

function imprimirEmpleado() {
    if (!empleadoActivo.nombre) {
        alert("Selecciona un empleado antes de imprimir");
        return;
    }
    window.print();
}

function descargarEmpleado() {
    if (!empleadoActivo.nombre) {
        alert("Selecciona un empleado antes de descargar");
        return;
    }

    const empleado = empleadoActivo.nombre;
    const contenido = JSON.stringify({ empleado, datos: reglasPorEmpleado[empleado] || {} }, null, 2);
    const blob = new Blob([contenido], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `empleado-${empleado.replace(/\s+/g, "-").toLowerCase()}.json`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
}

function eliminarEmpleado() {
    if (!empleadoActivo.nombre) {
        alert("Selecciona un empleado para quitarlo");
        return;
    }

    const nombre = empleadoActivo.nombre;
    const confirmado = window.confirm(`¿Quieres quitar a ${nombre} de la lista?`);
    if (!confirmado) return;

    empleados = empleados.filter((empleado) => empleado !== nombre);
    diasPorRol = diasPorRol.filter((regla) => regla.empleado !== nombre);
    guardarDiasPorRol();
    delete reglasPorEmpleado[nombre];
    Object.keys(cambiosTurnosManuales).forEach((clave) => {
        if (clave.startsWith(`${nombre}::`)) delete cambiosTurnosManuales[clave];
    });
    Object.keys(horariosManualesTurnos).forEach((clave) => {
        if (clave.startsWith(`${nombre}::`)) delete horariosManualesTurnos[clave];
    });
    Object.keys(detallesCambiosManuales).forEach((clave) => {
        if (clave.startsWith(`${nombre}::`)) delete detallesCambiosManuales[clave];
    });
    guardarEmpleados();
    guardarReglas();
    guardarCambiosManuales();
    guardarHorariosManuales();
    guardarDetallesCambiosManuales();
    cerrarModal();
    mostrarEmpleados();
    alert("Empleado quitado correctamente");
}

function manejarArchivoExcel(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const extension = archivo.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(extension)) {
        alert("Selecciona un archivo Excel o CSV válido");
        return;
    }

    const lector = new FileReader();
    lector.onload = function (e) {
        const datos = e.target.result;
        const libro = XLSX.read(datos, { type: "array" });
        const hoja = libro.Sheets[libro.SheetNames[0]];
        const filas = XLSX.utils.sheet_to_json(hoja, { defval: "" });
        if (!filas.length) {
            alert("El archivo no tiene datos");
            return;
        }

        const nombresNuevos = [];
        filas.forEach((fila) => {
            if (!fila || typeof fila !== "object") return;
            Object.values(fila).forEach((valor) => {
                if (typeof valor === "string" || typeof valor === "number") {
                    const texto = String(valor).trim();
                    if (texto && !nombresNuevos.includes(texto)) nombresNuevos.push(texto);
                }
            });
        });

        const nombresValidos = nombresNuevos.filter((nombre) => {
            const normalizado = nombre.trim();
            return normalizado && !empleados.some((empleado) => empleado.toLowerCase() === normalizado.toLowerCase());
        });

        if (!nombresValidos.length) {
            alert("No se encontraron empleados nuevos en el archivo");
            return;
        }

        nombresValidos.forEach((nombre) => {
            empleados.push(nombre);
            reglasPorEmpleado[nombre] = {
                turnoPreferido: "M1",
                turnosPreferidos: ["M1"],
                diasLibre: [],
                maxTurnos: 5,
                descanso: true,
                rotacionLibres: true,
                participaRotacion: true,
                porcentajeHorasMes: 100,
                rotacionUnidades: nombresUnidades[0] || "Unidad 1",
                tipoContrato: "Fijo",
                jornada: "Completa",
                fechaAlta: "",
                transportePropio: "No",
                observaciones: ""
            };
        });

        guardarEmpleados();
        guardarReglas();
        mostrarEmpleados();
        alert("Empleados cargados correctamente desde Excel");
        archivoExcel.value = "";
    };

    lector.readAsArrayBuffer(archivo);
}

function generarTurnos() {
    if (!cuadrosTurnos) return;
    if (empleados.length === 0) {
        alert("Añade al menos un empleado para generar turnos");
        return;
    }

    const empleadosActivos = empleados.filter((empleado) => {
        const regla = reglasPorEmpleado[empleado] || {};
        return regla.participaRotacion !== false;
    });
    if (empleadosActivos.length === 0) {
        alert("Activa al menos un empleado para generar la rotación");
        return;
    }

    const fechaInicio = fechaInicioTurnos?.value || obtenerFechaInicioSemana();
    const fechaFin = fechaFinTurnos?.value || obtenerFechaFinSemana();
    if (fechaFin < fechaInicio) {
        alert("La fecha final no puede ser anterior a la fecha inicial");
        return;
    }

    const fechasPeriodo = obtenerFechasPeriodo(fechaInicio, fechaFin);
    fechasPeriodoActual = fechasPeriodo;
    cuadrosTurnos.innerHTML = "";
    const asignaciones = ejecutarConCacheGeneracion(() => construirAsignaciones(empleadosActivos, fechasPeriodo));
    semillasContinuidad = null;

    asignacionesActuales = asignaciones;
    prepararTurnosIndividuales();
    renderizarCuadrosVisibles();
}

// La generación calcula a todo el personal (cobertura coherente); solo se muestra la profesión seleccionada.
function renderizarCuadrosVisibles() {
    if (!cuadrosTurnos) return;
    cuadrosTurnos.innerHTML = "";
    const visibles = cargoFiltroActual
        ? asignacionesActuales.filter((asignacion) => cargoDeEmpleado(asignacion.empleado) === cargoFiltroActual)
        : asignacionesActuales;
    renderizarPanelProfesiones();
    actualizarResumenCuadro(visibles, fechasPeriodoActual, cargoFiltroActual ? `profesión ${cargoFiltroActual}` : "todas");

    if (!visibles.length) {
        const vacio = document.createElement("p");
        vacio.className = "grupo-turnos-vacio";
        vacio.textContent = `No hay empleados de ${cargoFiltroActual} en este cuadro.`;
        cuadrosTurnos.appendChild(vacio);
        return;
    }
    ordenCuadros.forEach((grupo) => {
        if (grupo !== "tardes" && grupo !== "otros") {
            renderizarCuadroGrupo(grupo, visibles, fechasPeriodoActual);
        }
    });
}

function construirAsignaciones(empleadosActivos, fechasPeriodo) {
    avisosCobertura = new Map();
    const empleadosPorUnidad = new Map();
    empleadosActivos.forEach((empleado) => {
        const unidad = obtenerUnidadAsignada(reglasPorEmpleado[empleado]);
        if (!empleadosPorUnidad.has(unidad)) empleadosPorUnidad.set(unidad, []);
        empleadosPorUnidad.get(unidad).push(empleado);
    });

    const asignaciones = [];
    const registrosPorUnidad = [];
    const todosRegistros = [];
    let indiceEmpleado = 0;
    ordenarUnidades(Array.from(empleadosPorUnidad.entries()), ([unidad]) => unidad).forEach(([unidad, empleadosUnidad]) => {
        const registrosUnidad = [];
        empleadosUnidad.forEach((empleado) => {
            const regla = reglasPorEmpleado[empleado] || {
                turnoPreferido: "M1",
                turnosPreferidos: ["M1"],
                diasLibre: [],
                maxTurnos: 5,
                descanso: true,
                rotacionLibres: true
            };
            const unidadEmpleado = obtenerUnidadAsignada(regla, "");
            const turnosEmpleado = filtrarTurnosPorPerfil(obtenerTurnosResponsabilidad(unidadEmpleado, regla), regla);
            const turnosProgramables = turnosEmpleado.filter((turno) => turno !== "Vacaciones");
            const turnosOriginalesPorFecha = [];
            let diasConsecutivos = 0;

            for (let indiceDia = 0; indiceDia < fechasPeriodo.length; indiceDia++) {
                const fechaDia = fechasPeriodo[indiceDia].valor;
                const estaDeVacaciones = regla.vacacionesInicio && regla.vacacionesFin &&
                    fechaDia >= regla.vacacionesInicio && fechaDia <= regla.vacacionesFin;
                let turno = semillasContinuidad?.[empleado] !== undefined && turnosProgramables.length
                    ? turnosProgramables[(semillasContinuidad[empleado] + indiceDia) % turnosProgramables.length]
                    : obtenerTurnoResponsabilidad(unidadEmpleado, regla, fechasPeriodo[indiceDia].valor, indiceDia, indiceEmpleado);
                if (!turno) {
                    turno = turnosProgramables.length
                        ? turnosProgramables[indiceDia % turnosProgramables.length]
                        : "Descanso";
                }
                if (turnosProgramables.length && !turnosProgramables.includes(turno) && !["Descanso", "Libre", "Vacaciones"].includes(turno)) {
                    turno = turnosProgramables[indiceDia % turnosProgramables.length];
                }

                if (estaDeVacaciones && turnosEmpleado.includes("Vacaciones") && reglasGenerales.vacacionesImpidenTurno.activa) {
                    turno = "Vacaciones";
                } else if (regla.diasLibre && regla.diasLibre.includes(fechasPeriodo[indiceDia].nombre) && regla.descanso !== false) {
                    turno = "Descanso";
                } else if (regla.descanso !== false && obtenerMaxConsecutivosEfectivo(regla) && diasConsecutivos >= Math.max(1, obtenerMaxConsecutivosEfectivo(regla))) {
                    turno = "Descanso";
                }

                turnosOriginalesPorFecha.push(turno);

                // El contador de días consecutivos usa siempre la planificación automática,
                // así un cambio manual en un día no altera los días asignados en otras fechas.
                if (turno === "Descanso" || turno === "Vacaciones" || turno === "Libre") {
                    diasConsecutivos = 0;
                } else {
                    diasConsecutivos += 1;
                }

            }

            const porcentaje = obtenerPorcentajeJornada(regla);
            const limiteHoras = reglasGenerales.maxHorasAnuales.valor * (porcentaje / 100) * (fechasPeriodo.length / 365);
            aplicarReglasDescanso(turnosOriginalesPorFecha, regla, limiteHoras, fechasPeriodo, porcentaje, indiceEmpleado);
            const registro = { empleado, unidad, regla, porcentaje, limiteHoras, indiceRotacion: indiceEmpleado, turnosOriginalesPorFecha, unidadesPorDia: {} };
            registrosUnidad.push(registro);
            todosRegistros.push(registro);
            indiceEmpleado += 1;
        });
        registrosPorUnidad.push([unidad, registrosUnidad]);
    });

    registrosPorUnidad.forEach(([unidad, registrosUnidad]) => {
        aplicarParejasTurno(unidad, registrosUnidad, todosRegistros, fechasPeriodo);
    });

    registrosPorUnidad.forEach(([unidad]) => {
        aplicarTurnosUnicosPorUnidad(unidad, todosRegistros, fechasPeriodo);
    });

    registrosPorUnidad.forEach(([unidad, registrosUnidad]) => {
        aplicarPuestosRequeridos(unidad, registrosUnidad, todosRegistros, fechasPeriodo);
    });

    aplicarDiasPorRol(todosRegistros, fechasPeriodo);

    todosRegistros.forEach(({ empleado, unidad, regla, porcentaje, limiteHoras, turnosOriginalesPorFecha, unidadesPorDia }) => {
        {
            const turnosPorFecha = [];
            turnosOriginalesPorFecha.forEach((turnoOriginal, indiceDia) => {
                const claveManual = claveCambioTurno(empleado, fechasPeriodo[indiceDia].valor);
                const cambioManual = cambiosTurnosManuales[claveManual];
                const vacacionesProtegidas = reglasGenerales.vacacionesImpidenTurno.activa && turnoOriginal === "Vacaciones";
                const esCopiaContinuidad = detallesCambiosManuales[claveManual]?.origen === "continuidad-semanal";
                if (cambioManual && (!vacacionesProtegidas || esCopiaContinuidad)) {
                    // El cambio manual solo afecta a esta celda: libera el puesto automático y fija
                    // la unidad del día sin tocar la unidad base ni a los demás empleados.
                    const unidadManual = detallesCambiosManuales[claveManual]?.unidadNueva;
                    const descansa = ["Descanso", "Libre", "Vacaciones"].includes(cambioManual);
                    if (descansa || !unidadManual || unidadesSonIguales(unidadManual, unidad)) {
                        delete unidadesPorDia[indiceDia];
                    } else {
                        unidadesPorDia[indiceDia] = unidadManual;
                    }
                    turnosPorFecha.push(cambioManual);
                } else {
                    turnosPorFecha.push(turnoOriginal);
                }
            });

            const horas = calcularHorasTurnos(turnosPorFecha, regla);
            asignaciones.push({
                empleado,
                unidad,
                color: obtenerColorUnidad(unidad, regla.colorUnidad),
                regla,
                porcentaje,
                horas,
                superaHoras: reglasGenerales.maxHorasAnuales.activa && horas > limiteHoras,
                turnos: turnosPorFecha,
                turnosOriginales: turnosOriginalesPorFecha,
                unidadesPorDia
            });
        }
    });

    return asignaciones;
}

function aplicarTurnosUnicosPorUnidad(unidad, todosRegistros, fechasPeriodo) {
    const turnosConfigurados = obtenerConfiguracionUnidad(unidad)?.turnos || [];
    const turnosUnicos = [...new Set(turnosConfigurados.filter((turno) =>
        turno !== "Vacaciones" && ["mañanas", "tardes"].includes(clasificarTurno(turno))
    ))];
    if (!turnosUnicos.length) return;

    const festivos = obtenerFestivos();
    fechasPeriodo.forEach((_, dia) => {
        const especial = esDiaEspecial(fechasPeriodo[dia], festivos);
        const ordenEspecial = (a, b) => libreFijo(a.registro, dia, fechasPeriodo) - libreFijo(b.registro, dia, fechasPeriodo) ||
            contarDiasEspecialesTrabajados(a.registro, fechasPeriodo, festivos) - contarDiasEspecialesTrabajados(b.registro, fechasPeriodo, festivos);
        const turnoDia = (registro) => registro.turnosOriginalesPorFecha[dia];
        const trabajaEnUnidad = (registro) => unidadesSonIguales(registro.unidadesPorDia[dia] || registro.unidad, unidad);
        const asignados = todosRegistros.filter((registro) => trabajaEnUnidad(registro) &&
            !["Descanso", "Libre", "Vacaciones"].includes(turnoDia(registro))
        );
        const ocupados = new Set();

        asignados.forEach((registro) => {
            const turno = turnoDia(registro);
            if (!turnosUnicos.includes(turno) || ocupados.has(turno)) {
                registro.turnosOriginalesPorFecha[dia] = "Descanso";
                delete registro.unidadesPorDia[dia];
                return;
            }
            ocupados.add(turno);
        });

        turnosUnicos.forEach((turno) => {
            if (ocupados.has(turno)) return;
            const grupo = clasificarTurno(turno);
            const candidatos = todosRegistros
                .filter((registro) => ["Descanso", "Libre"].includes(turnoDia(registro)) && !registro.unidadesPorDia[dia])
                .filter((registro) => especial || !(registro.regla.descanso !== false && registro.regla.diasLibre?.includes(fechasPeriodo[dia].nombre)))
                .filter((registro) => {
                    const preferidos = expandirTurnosAgrupados(obtenerTurnosPreferidos(registro.regla));
                    return preferidos.includes(turno) || nivelCobertura(registro, unidad) < 2 || !reglasGenerales.respetarPuesto.activa;
                })
                .map((registro) => ({
                    registro,
                    nivel: nivelCobertura(registro, unidad),
                    rol: fueraDeRol(registro, turno),
                    horas: calcularHorasTurnos(registro.turnosOriginalesPorFecha, registro.regla)
                }))
                .sort((a, b) => a.nivel - b.nivel || a.rol - b.rol || (especial ? ordenEspecial(a, b) : 0) || a.horas - b.horas);

            const asignado = candidatos.some(({ registro }) => intentarAsignarCobertura(registro, dia, turno, unidad, fechasPeriodo));
            if (asignado) {
                ocupados.add(turno);
            } else {
                const clave = `${unidad} (${turno})`;
                avisosCobertura.set(clave, (avisosCobertura.get(clave) || 0) + 1);
            }
        });
    });
}

function aplicarPuestosRequeridos(unidad, registros, todosRegistros, fechasPeriodo) {
    const puestos = obtenerConfiguracionUnidad(unidad)?.puestos;
    if (!puestos || !registros.length) return;
    const limite = (valor) => (valor === null || valor === undefined || valor === "" || !Number.isFinite(Number(valor)) ? null : Math.max(0, Number(valor)));
    const maxManana = limite(puestos.manana);
    const maxTarde = limite(puestos.tarde);
    const minDescanso = limite(puestos.descanso);
    if (maxManana === null && maxTarde === null && minDescanso === null) return;
    const maximos = { "mañanas": maxManana, tardes: maxTarde };

    const festivos = obtenerFestivos();
    fechasPeriodo.forEach((_, dia) => {
        const especial = esDiaEspecial(fechasPeriodo[dia], festivos);
        const ordenEspecial = (a, b) => libreFijo(a.registro, dia, fechasPeriodo) - libreFijo(b.registro, dia, fechasPeriodo) ||
            contarDiasEspecialesTrabajados(a.registro, fechasPeriodo, festivos) - contarDiasEspecialesTrabajados(b.registro, fechasPeriodo, festivos);
        const turnoDia = (registro) => registro.turnosOriginalesPorFecha[dia];
        const trabajaEn = (registro) => registro.unidadesPorDia[dia] || registro.unidad;
        const delGrupo = (grupo) => todosRegistros.filter((registro) => unidadesSonIguales(trabajaEn(registro), unidad) && clasificarTurno(turnoDia(registro)) === grupo);
        // Rota el orden cada día para repartir los descansos entre el equipo.
        const rotar = (lista) => lista.map((_, indice) => lista[(indice + dia) % lista.length]);

        ["mañanas", "tardes"].forEach((grupo) => {
            const maximo = maximos[grupo];
            if (maximo === null) return;
            rotar(delGrupo(grupo))
                .sort((a, b) => fueraDeRol(a, turnoDia(a)) - fueraDeRol(b, turnoDia(b)))
                .slice(maximo).filter((registro) => !registro.parejaDias?.has(dia)).forEach((registro) => {
                registro.turnosOriginalesPorFecha[dia] = "Descanso";
                delete registro.unidadesPorDia[dia];
            });
        });

        if (minDescanso !== null) {
            let descansando = registros.filter((registro) => ["Descanso", "Libre"].includes(turnoDia(registro))).length;
            while (descansando < minDescanso) {
                const manana = delGrupo("mañanas");
                const tarde = delGrupo("tardes");
                const origen = manana.length >= tarde.length ? manana : tarde;
                if (!origen.length) break;
                const elegido = rotar(origen)
                    .sort((a, b) => fueraDeRol(b, turnoDia(b)) - fueraDeRol(a, turnoDia(a)))
                    .find((registro) => !registro.parejaDias?.has(dia));
                if (!elegido) break;
                elegido.turnosOriginalesPorFecha[dia] = "Descanso";
                delete elegido.unidadesPorDia[dia];
                descansando += 1;
            }
        }

        const maximoTrabajando = minDescanso === null
            ? Infinity
            : Math.max(0, registros.length - minDescanso);
        ["mañanas", "tardes"].forEach((grupo) => {
            const maximo = maximos[grupo];
            if (maximo === null) return;
            let faltan = maximo - delGrupo(grupo).length;
            if (faltan <= 0) return;
            const usados = new Map();
            delGrupo(grupo).forEach((registro) => usados.set(turnoDia(registro), (usados.get(turnoDia(registro)) || 0) + 1));
            const candidatos = todosRegistros
                .filter((registro) => ["Descanso", "Libre"].includes(turnoDia(registro)) && !registro.unidadesPorDia[dia])
                .filter((registro) => especial || !(registro.regla.descanso !== false && registro.regla.diasLibre?.includes(fechasPeriodo[dia].nombre)))
                .map((registro) => ({ registro, nivel: nivelCobertura(registro, unidad), afinidad: afinidadRolGrupo(registro, unidad, grupo), horas: calcularHorasTurnos(registro.turnosOriginalesPorFecha, registro.regla) }))
                .sort((a, b) => a.nivel - b.nivel || a.afinidad - b.afinidad || (especial ? ordenEspecial(a, b) : 0) || a.horas - b.horas);
            for (const { registro } of candidatos) {
                if (faltan <= 0) break;
                const trabajando = registros.filter((item) => !["Descanso", "Libre", "Vacaciones"].includes(turnoDia(item))).length;
                if (trabajando >= maximoTrabajando) break;
                const turno = elegirTurnoCobertura(registro, unidad, grupo, usados);
                if (turno && intentarAsignarCobertura(registro, dia, turno, unidad, fechasPeriodo)) {
                    usados.set(turno, (usados.get(turno) || 0) + 1);
                    faltan -= 1;
                }
            }
        });

        ["mañanas", "tardes"].forEach((grupo) => {
            const maximo = maximos[grupo];
            if (maximo !== null && delGrupo(grupo).length < maximo) {
                const clave = `${unidad} (${grupo === "mañanas" ? "mañana" : "tarde"})`;
                avisosCobertura.set(clave, (avisosCobertura.get(clave) || 0) + 1);
            }
        });
    });
}

function libreFijo(registro, dia, fechasPeriodo) {
    return registro.regla.descanso !== false && registro.regla.diasLibre?.includes(fechasPeriodo[dia].nombre) ? 1 : 0;
}

// Roles propios del empleado: sus turnos preferidos más los de sus reglas de días por rol.
function obtenerRolesPropios(registro) {
    if (registro.rolesPropios) return registro.rolesPropios;
    const roles = new Set(expandirTurnosAgrupados(obtenerTurnosPreferidos(registro.regla)));
    diasPorRol.filter((item) => item.empleado === registro.empleado).forEach((item) => roles.add(item.codigo));
    registro.rolesPropios = roles;
    return roles;
}

// 0 si el turno forma parte de los roles del empleado; 1 si sería una asignación fuera de rol.
function fueraDeRol(registro, turno) {
    if (["Descanso", "Libre", "Vacaciones"].includes(turno)) return 0;
    return obtenerRolesPropios(registro).has(turno) ? 0 : 1;
}

// 0 si el empleado tiene algún rol propio disponible en el grupo (mañanas/tardes) de la unidad.
function afinidadRolGrupo(registro, unidad, grupo) {
    const grupos = obtenerGruposTurnosUnidad(unidad, registro.regla);
    if (!grupos) return 0;
    const opciones = grupo === "mañanas" ? grupos.manana : grupos.tarde;
    const roles = obtenerRolesPropios(registro);
    return opciones.some((turno) => roles.has(turno) && turnoCompatibleConProfesion(registro.regla, turno)) ? 0 : 1;
}

// 0: pertenece a la unidad, 1: la incluye en su rotaci\u00f3n, 2: otra unidad.
function nivelCobertura(registro, unidad) {
    if (registro.unidad === unidad) return 0;
    const enRotacion = obtenerUnidadesIndividuales(registro.regla.rotacionUnidades).some((item) => unidadesSonIguales(item, unidad));
    return enRotacion ? 1 : 2;
}

function elegirTurnoCobertura(registro, unidad, grupo, usados) {
    const grupos = obtenerGruposTurnosUnidad(unidad, registro.regla);
    const opcionesUnidad = grupos ? (grupo === "ma\u00f1anas" ? grupos.manana : grupos.tarde) : [];
    const propios = expandirTurnosAgrupados(obtenerTurnosPreferidos(registro.regla));
    let opciones = opcionesUnidad.filter((turno) => propios.includes(turno));
    const perteneceAUnidad = nivelCobertura(registro, unidad) < 2;
    if (!opciones.length && (perteneceAUnidad || !reglasGenerales.respetarPuesto.activa)) opciones = opcionesUnidad;
    const turnosUnicos = new Set((obtenerConfiguracionUnidad(unidad)?.turnos || []).filter((turno) =>
        turno !== "Vacaciones" && ["mañanas", "tardes"].includes(clasificarTurno(turno))
    ));
    opciones = opciones.filter((turno) => turnoCompatibleConProfesion(registro.regla, turno) && (!turnosUnicos.has(turno) || !usados.get(turno)));
    if (!opciones.length) return null;
    return opciones.slice().sort((a, b) => (usados.get(a) || 0) - (usados.get(b) || 0))[0];
}

function intentarAsignarCobertura(registro, dia, turno, unidad, fechasPeriodo) {
    if (!turnoAsignableEnUnidad(unidad, turno) || !turnoCompatibleConProfesion(registro.regla, turno)) return false;
    const original = registro.turnosOriginalesPorFecha;
    const previo = original[dia];
    const normalizar = (turnos) => {
        const copia = [...turnos];
        aplicarReglasDescanso(copia, registro.regla, registro.limiteHoras, fechasPeriodo, registro.porcentaje, registro.indiceRotacion);
        return copia;
    };
    const base = normalizar(original);

    original[dia] = turno;
    const resultado = normalizar(original);
    // Los d\u00edas posteriores a\u00fan no revisados pueden pasar a descanso; los anteriores no deben cambiar.
    const sinConflicto = resultado.every((valor, indice) => {
        if (indice === dia) return valor === turno;
        // Los días ya fijados por una pareja no pueden alterarse.
        if (registro.parejaDias?.has(indice)) return valor === base[indice];
        if (indice > dia && valor === "Descanso") return true;
        return valor === base[indice];
    });

    let seguidos = 0;
    const trabaja = (valor) => !["Descanso", "Libre", "Vacaciones"].includes(valor);
    for (let i = dia; i >= 0 && trabaja(resultado[i]); i--) seguidos++;
    for (let i = dia + 1; i < resultado.length && trabaja(resultado[i]); i++) seguidos++;
    const maxSeguidos = Math.max(1, Number(registro.regla.maxTurnos) || 0);
    const excedeSeguidos = registro.regla.descanso !== false && registro.regla.maxTurnos && seguidos > maxSeguidos;

    if (!sinConflicto || excedeSeguidos) {
        original[dia] = previo;
        return false;
    }
    resultado.forEach((valor, indice) => { original[indice] = valor; });
    if (registro.unidad !== unidad) registro.unidadesPorDia[dia] = unidad;
    return true;
}

function renderizarCuadroGrupo(grupo, asignaciones, fechasPeriodo) {
    const gruposMostrados = grupo === "mañanas" ? ["mañanas", "tardes", "sin-turno"] : [grupo];
    const sinTurnoAlguno = (asignacion) => !asignacion.turnos.some((turno) => ["mañanas", "tardes", "noches"].includes(clasificarTurno(turno)));
    const tieneVacanteEnGrupo = (asignacion) => (asignacion.turnosOriginales || []).some((turnoOriginal, indice) => {
        if (!gruposMostrados.includes(clasificarTurno(turnoOriginal))) return false;
        const claveDia = claveCambioTurno(asignacion.empleado, fechasPeriodo[indice]?.valor);
        return Boolean(detallesCambiosManuales[claveDia]);
    });
    const asignacionesGrupo = asignaciones.filter((asignacion) => {
        if (grupo === "mañanas" && sinTurnoAlguno(asignacion)) return true;
        return asignacion.turnos.some((turno) => gruposMostrados.includes(clasificarTurno(turno))) || tieneVacanteEnGrupo(asignacion);
    });
    const nombresGrupo = {
        mañanas: "☀️ / 🌇 Turnos por unidad",
        tardes: "🌇 Tardes",
        noches: "🌙 Noches"
    };
    const bloque = document.createElement("section");
    bloque.className = "bloque-turnos";
    bloque.draggable = true;
    bloque.dataset.grupoTurnos = grupo;
    bloque.title = "Arrastra este cuadro para cambiar su orden";
    const titulo = document.createElement("h3");
    titulo.textContent = nombresGrupo[grupo];
    bloque.appendChild(titulo);

    const resumenGrupo = document.createElement("p");
    resumenGrupo.className = "resumen-grupo-turnos";
    resumenGrupo.textContent = `${asignacionesGrupo.length} ${asignacionesGrupo.length === 1 ? "persona" : "personas"} · ${fechasPeriodo.length} ${fechasPeriodo.length === 1 ? "día" : "días"}`;
    bloque.appendChild(resumenGrupo);

    if (!asignacionesGrupo.length) {
        bloque.classList.add("grupo-sin-datos");
        const vacio = document.createElement("p");
        vacio.className = "grupo-turnos-vacio";
        vacio.textContent = "No hay empleados asignados a este tipo de turno en el periodo seleccionado.";
        bloque.appendChild(vacio);
        cuadrosTurnos.appendChild(bloque);
        return;
    }

    const contenedor = document.createElement("div");
    contenedor.className = "tabla-contenedor";
    const crearTablaUnidad = () => {
        const tabla = document.createElement("table");
        const encabezado = document.createElement("tr");
        encabezado.innerHTML = "<th>Empleado</th>";
        fechasPeriodo.forEach((fecha) => {
            const celda = document.createElement("th");
            celda.textContent = fecha.etiqueta;
            encabezado.appendChild(celda);
        });
        const thead = document.createElement("thead");
        thead.appendChild(encabezado);
        tabla.appendChild(thead);
        const cuerpo = document.createElement("tbody");
        return { tabla, cuerpo };
    };
    const unidades = new Map();

    asignacionesGrupo.forEach((asignacion) => {
        if (!unidades.has(asignacion.unidad)) unidades.set(asignacion.unidad, []);
        unidades.get(asignacion.unidad).push(asignacion);
    });

    ordenarUnidades(Array.from(unidades.entries()), ([unidad]) => unidad).forEach(([unidad, empleadosUnidad]) => {
        const { tabla, cuerpo } = crearTablaUnidad();
        const filaUnidad = document.createElement("tr");
        filaUnidad.className = "fila-unidad";
        const celdaUnidad = document.createElement("th");
        celdaUnidad.colSpan = fechasPeriodo.length + 1;
        celdaUnidad.textContent = `Unidad: ${unidad}`;
        celdaUnidad.style.setProperty("--color-unidad", empleadosUnidad[0].color);
        filaUnidad.appendChild(celdaUnidad);
        cuerpo.appendChild(filaUnidad);

        gruposMostrados.forEach((grupoMostrado) => {
            const empleadosTurno = empleadosUnidad.filter((asignacion) => {
                if (grupoMostrado === "sin-turno") return sinTurnoAlguno(asignacion);
                return asignacion.turnos.some((turno) => clasificarTurno(turno) === grupoMostrado) ||
                    (asignacion.turnosOriginales || []).some((turnoOriginal, indice) => {
                        const claveDia = claveCambioTurno(asignacion.empleado, fechasPeriodo[indice]?.valor);
                        return clasificarTurno(turnoOriginal) === grupoMostrado && Boolean(detallesCambiosManuales[claveDia]);
                    });
            });
            if (!empleadosTurno.length) return;

            const filaGrupoTurno = document.createElement("tr");
            filaGrupoTurno.className = "fila-grupo-turno";
            const celdaGrupoTurno = document.createElement("th");
            celdaGrupoTurno.colSpan = fechasPeriodo.length + 1;
            celdaGrupoTurno.textContent = { mañanas: "Mañanas", tardes: "Tardes", "sin-turno": "Sin turno asignado (pulsa una celda para asignar)" }[grupoMostrado];
            filaGrupoTurno.appendChild(celdaGrupoTurno);
            cuerpo.appendChild(filaGrupoTurno);

            empleadosTurno.forEach((asignacion) => {
            const fila = document.createElement("tr");
            fila.className = "fila-empleado-cuadrante";
            const empleado = document.createElement("td");
            empleado.textContent = asignacion.empleado;
            fila.appendChild(empleado);
            asignacion.turnos.forEach((turno, indiceFecha) => {
                const celda = document.createElement("td");
                celda.className = "celda-turno-editable";
                celda.dataset.empleado = asignacion.empleado;
                celda.dataset.fecha = fechasPeriodo[indiceFecha].valor;
                celda.title = "Pulsa para editar · arrastra para copiar (Alt: intercambiar) · clic derecho para borrar";

                const claveDia = claveCambioTurno(asignacion.empleado, fechasPeriodo[indiceFecha].valor);
                const detalleCambio = detallesCambiosManuales[claveDia];

                if (clasificarTurno(turno) === grupoMostrado) {
                    const datos = obtenerDatosTurno(turno, asignacion.unidad, asignacion.regla);
                    if (datos) {
                        celda.draggable = true;
                        const codigo = document.createElement("strong");
                        codigo.className = "codigo-turno-cuadrante";
                        codigo.textContent = datos.codigo;
                        const horario = document.createElement("small");
                        horario.className = "horario-turno-cuadrante";
                        const horarioManual = horariosManualesTurnos[claveDia];
                        horario.textContent = horarioManual || datos.horario;
                        celda.append(codigo, horario);
                        const unidadDelDia = asignacion.unidadesPorDia?.[indiceFecha] || asignacion.unidad;
                        const referenciaUnidad = document.createElement("small");
                        referenciaUnidad.className = "unidad-turno-cuadrante";
                        referenciaUnidad.textContent = unidadDelDia;
                        celda.appendChild(referenciaUnidad);
                        if (asignacion.porcentaje < 100) {
                            const parcial = document.createElement("small");
                            parcial.className = "jornada-parcial-cuadrante";
                            parcial.textContent = `Jornada ${asignacion.porcentaje}%`;
                            celda.appendChild(parcial);
                        }
                    } else {
                        celda.textContent = turno;
                    }
                    if (detalleCambio) {
                        celda.classList.add("celda-turno-modificado");
                    }
                } else {
                    celda.textContent = "-";
                    celda.classList.add("celda-sin-turno");
                }
                fila.appendChild(celda);
            });
            cuerpo.appendChild(fila);
            });
        });

        tabla.appendChild(cuerpo);
        const diapositiva = document.createElement("div");
        diapositiva.className = "diapositiva-unidad";
        diapositiva.appendChild(tabla);
        contenedor.appendChild(diapositiva);
    });

    contenedor.classList.add("ventana-carrusel");

    const desplazar = (sentido) => {
        contenedor.scrollBy({ left: sentido * contenedor.clientWidth, behavior: "smooth" });
    };
    const controles = document.createElement("div");
    controles.className = "controles-carrusel";
    [["\u25c0", -1, "Unidad anterior"], ["\u25b6", 1, "Unidad siguiente"]].forEach(([texto, sentido, etiqueta]) => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "boton boton-secundario boton-carrusel";
        boton.textContent = texto;
        boton.title = etiqueta;
        boton.setAttribute("aria-label", etiqueta);
        boton.addEventListener("click", () => desplazar(sentido));
        controles.appendChild(boton);
    });
    bloque.appendChild(controles);
    bloque.appendChild(contenedor);
    cuadrosTurnos.appendChild(bloque);
}

// ---- Modo manual: guardar, imprimir, descargar e informe ----
const NO_TRABAJA = ["Descanso", "Libre", "Vacaciones"];

function calcularInformeCuadro() {
    const festivos = obtenerFestivos();
    const filas = asignacionesActuales.filter((asignacion) => !cargoFiltroActual || cargoDeEmpleado(asignacion.empleado) === cargoFiltroActual).map((asignacion) => {
        const turnos = asignacion.turnos;
        const fila = { empleado: asignacion.empleado, unidad: asignacion.unidad, jornada: asignacion.porcentaje,
            horas: asignacion.horas, maximo: null, dias: 0, descansos: 0, vacaciones: 0, especiales: 0, mananas: 0, tardes: 0, cambios: 0 };
        const regla = reglasGenerales.maxHorasAnuales;
        if (regla.activa) fila.maximo = regla.valor * (asignacion.porcentaje / 100) * (fechasPeriodoActual.length / 365);
        turnos.forEach((turno, i) => {
            const fecha = fechasPeriodoActual[i];
            if (turno === "Vacaciones") fila.vacaciones++;
            else if (NO_TRABAJA.includes(turno)) fila.descansos++;
            else {
                fila.dias++;
                if (esDiaEspecial(fecha, festivos)) fila.especiales++;
                const grupo = clasificarTurno(turno);
                if (grupo === "mañanas") fila.mananas++;
                else if (grupo === "tardes") fila.tardes++;
            }
            if (cambiosTurnosManuales[claveCambioTurno(asignacion.empleado, fecha.valor)]) fila.cambios++;
        });
        return fila;
    });
    return filas;
}

let informeGenerado = false;

function mostrarVistaCuadro(vista) {
    const informe = vista === "informe";
    document.getElementById("informeCuadro").hidden = !informe;
    cuadrosTurnos.hidden = informe;
    [["pestanaVistaCuadro", !informe], ["pestanaVistaInforme", informe]].forEach(([id, activa]) => {
        const boton = document.getElementById(id);
        boton.classList.toggle("activa", activa);
        boton.setAttribute("aria-selected", String(activa));
    });
}

function actualizarEstadoInforme() {
    const hay = asignacionesActuales.length > 0;
    document.getElementById("botonGenerarInforme").disabled = !hay;
    document.getElementById("botonDescargarInforme").disabled = !hay || !informeGenerado;
    document.getElementById("resultadoInforme").hidden = !informeGenerado || !hay;
    document.getElementById("textoInformeVacio").hidden = informeGenerado && hay;
}

function renderizarInformeCuadro() {
    const tabla = document.getElementById("tablaInforme");
    if (!tabla) return;
    if (!asignacionesActuales.length) {
        informeGenerado = false;
        actualizarEstadoInforme();
        return;
    }
    informeGenerado = true;
    const filas = calcularInformeCuadro();
    const formato = (valor) => (Number.isFinite(valor) ? (Math.round(valor * 10) / 10).toLocaleString("es-ES") : "-");
    const cabeceras = ["Empleado", "Unidad", "Jornada", "Horas trabajadas", "Máx. periodo", "Diferencia", "Días trabajados", "Descansos", "Vacaciones", "Fin de semana / festivo", "Mañanas", "Tardes", "Cambios manuales"];
    tabla.innerHTML = "";
    const cabecera = tabla.createTHead().insertRow();
    cabeceras.forEach((texto) => cabecera.appendChild(Object.assign(document.createElement("th"), { textContent: texto })));
    const cuerpo = tabla.createTBody();
    filas.forEach((f) => {
        const fila = cuerpo.insertRow();
        const diferencia = f.maximo === null ? null : f.maximo - f.horas;
        [f.empleado, f.unidad, `${f.jornada}%`, formato(f.horas), formato(f.maximo), formato(diferencia), f.dias, f.descansos, f.vacaciones, f.especiales, f.mananas, f.tardes, f.cambios]
            .forEach((valor) => fila.insertCell().textContent = valor);
        if (diferencia !== null && diferencia < 0) fila.classList.add("fila-excedida");
    });
    const total = filas.reduce((acc, f) => {
        ["horas", "dias", "descansos", "vacaciones", "especiales", "mananas", "tardes", "cambios"].forEach((k) => { acc[k] += f[k]; });
        return acc;
    }, { horas: 0, dias: 0, descansos: 0, vacaciones: 0, especiales: 0, mananas: 0, tardes: 0, cambios: 0 });
    const pie = tabla.createTFoot().insertRow();
    ["Total", "", "", formato(total.horas), "", "", total.dias, total.descansos, total.vacaciones, total.especiales, total.mananas, total.tardes, total.cambios]
        .forEach((valor) => pie.insertCell().textContent = valor);

    const avisos = document.getElementById("avisosInforme");
    avisos.innerHTML = "";
    filas.filter((f) => f.maximo !== null && f.horas > f.maximo)
        .forEach((f) => avisos.appendChild(Object.assign(document.createElement("li"), { textContent: `${f.empleado} supera el máximo de horas del periodo por ${formato(f.horas - f.maximo)} h.` })));
    avisosCobertura.forEach((dias, clave) => avisos.appendChild(Object.assign(document.createElement("li"), { textContent: `Sin cubrir: ${clave} durante ${dias} día(s).` })));
    actualizarEstadoInforme();
}

function descargarInformeCsv() {
    if (!asignacionesActuales.length || !fechasPeriodoActual.length) return;
    const filas = [["Empleado", "Unidad", "Jornada %", "Horas trabajadas", "Máx. periodo", "Días trabajados", "Descansos", "Vacaciones", "Fin de semana / festivo", "Mañanas", "Tardes", "Cambios manuales"]];
    calcularInformeCuadro().forEach((f) => filas.push([f.empleado, f.unidad, f.jornada, f.horas, f.maximo === null ? "" : Math.round(f.maximo * 10) / 10, f.dias, f.descansos, f.vacaciones, f.especiales, f.mananas, f.tardes, f.cambios]));
    const contenido = filas.map((fila) => fila.map((valor) => `"${String(valor ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(new Blob(["\ufeff", contenido], { type: "text/csv;charset=utf-8" }));
    enlace.download = `informe-${fechasPeriodoActual[0].valor}-${fechasPeriodoActual.at(-1).valor}.csv`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
}

// Imprime siempre la vista del cuadro, sin el informe.
function imprimirSoloCuadro() {
    mostrarVistaCuadro("cuadro");
    window.print();
}

document.getElementById("pestanaVistaCuadro")?.addEventListener("click", () => mostrarVistaCuadro("cuadro"));
document.getElementById("pestanaVistaInforme")?.addEventListener("click", () => mostrarVistaCuadro("informe"));
document.getElementById("botonGenerarInforme")?.addEventListener("click", renderizarInformeCuadro);
document.getElementById("botonDescargarInforme")?.addEventListener("click", descargarInformeCsv);

function cargarCuadrosGuardados() {
    try {
        const datos = JSON.parse(localStorage.getItem(STORAGE_CUADROS_GUARDADOS_KEY) || "[]");
        return Array.isArray(datos) ? datos : [];
    } catch (error) {
        return [];
    }
}

let cuadrosGuardados = cargarCuadrosGuardados();

function renderizarCuadrosGuardados() {
    const selector = document.getElementById("cuadrosGuardados");
    if (!selector) return;
    selector.innerHTML = "";
    if (!cuadrosGuardados.length) selector.appendChild(new Option("Sin cuadros guardados", ""));
    cuadrosGuardados.forEach((cuadro) => selector.appendChild(new Option(cuadro.nombre, cuadro.id)));
    document.getElementById("botonRecuperarCuadro").disabled = !cuadrosGuardados.length;
    document.getElementById("botonEliminarCuadro").disabled = !cuadrosGuardados.length;
    actualizarBotonContinuidadSemanal();
}

function formatearFechaLocal(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

function sumarDiasAFecha(fechaValor, dias) {
    const fecha = new Date(`${fechaValor}T00:00:00`);
    fecha.setDate(fecha.getDate() + dias);
    return formatearFechaLocal(fecha);
}

function diferenciaDiasEntreFechas(inicio, fin) {
    return Math.round((new Date(`${fin}T00:00:00`) - new Date(`${inicio}T00:00:00`)) / 86400000);
}

function esCuadroSemanalCompleto(cuadro) {
    if (!cuadro?.inicio || !cuadro?.fin || !cuadro?.turnos || typeof cuadro.turnos !== "object") return false;
    const dias = diferenciaDiasEntreFechas(cuadro.inicio, cuadro.fin) + 1;
    const inicioSemana = new Date(`${cuadro.inicio}T00:00:00`).getDay();
    const finSemana = new Date(`${cuadro.fin}T00:00:00`).getDay();
    return dias === 7 && inicioSemana === 1 && finSemana === 0;
}

function obtenerCuadrosParaContinuidadSemanal() {
    const semanales = cuadrosGuardados
        .filter(esCuadroSemanalCompleto)
        .sort((cuadroA, cuadroB) => cuadroA.inicio.localeCompare(cuadroB.inicio));
    if (semanales.length < 2) return null;

    const anterior = semanales.at(-2);
    const reciente = semanales.at(-1);
    return diferenciaDiasEntreFechas(anterior.inicio, reciente.inicio) === 7 ? [anterior, reciente] : null;
}

function construirSecuenciasContinuas(cuadroA, cuadroB) {
    const empleadosConSecuencia = new Set([
        ...Object.keys(cuadroA.turnos),
        ...Object.keys(cuadroB.turnos)
    ]);
    const secuencias = new Map();

    empleadosConSecuencia.forEach((empleado) => {
        const semanaA = cuadroA.turnos[empleado];
        const semanaB = cuadroB.turnos[empleado];
        if (!Array.isArray(semanaA) || !Array.isArray(semanaB) || semanaA.length !== 7 || semanaB.length !== 7) return;
        secuencias.set(empleado, [...semanaA, ...semanaB]);
    });
    return secuencias;
}

function obtenerDatoSecuenciaSemanal(cuadroA, cuadroB, campo, empleado, indice) {
    const cuadro = indice < 7 ? cuadroA : cuadroB;
    const valores = cuadro[campo]?.[empleado];
    return Array.isArray(valores) ? valores[indice % 7] : "";
}

function crearBotonContinuidadSemanal() {
    const barraManual = document.querySelector("#panelManual .barra-manual");
    if (!barraManual || document.getElementById("botonContinuidadSemanal")) return;

    const boton = document.createElement("button");
    boton.id = "botonContinuidadSemanal";
    boton.type = "button";
    boton.className = "boton boton-primario";
    boton.textContent = "Continuidad desde 2 cuadros";
    boton.title = "Repite la secuencia de dos cuadros semanales guardados";
    boton.addEventListener("click", generarContinuidadSemanalDesdeCuadros);
    barraManual.insertBefore(boton, document.getElementById("botonGuardarCuadro"));
}

function actualizarBotonContinuidadSemanal() {
    const boton = document.getElementById("botonContinuidadSemanal");
    if (!boton) return;
    boton.disabled = !obtenerCuadrosParaContinuidadSemanal();
}

function generarContinuidadSemanalDesdeCuadros() {
    const cuadrosOrigen = obtenerCuadrosParaContinuidadSemanal();
    if (!cuadrosOrigen) {
        alert("Guarda dos cuadros consecutivos de lunes a domingo para generar la continuidad semanal.");
        return;
    }

    const [cuadroA, cuadroB] = cuadrosOrigen;
    const secuencias = construirSecuenciasContinuas(cuadroA, cuadroB);
    if (!secuencias.size) {
        alert("Los cuadros guardados no contienen secuencias completas de lunes a domingo.");
        return;
    }

    const inicioActual = fechasPeriodoActual[0]?.valor;
    const finReferencia = fechasPeriodoActual.at(-1)?.valor;
    const cuadroActualEsPosterior = fechasPeriodoActual.length === 7 &&
        inicioActual > cuadroB.fin &&
        new Date(`${inicioActual}T00:00:00`).getDay() === 1;
    const ultimoDia = cuadroActualEsPosterior && finReferencia ? finReferencia : cuadroB.fin;
    const inicio = sumarDiasAFecha(ultimoDia, 1);
    const fin = sumarDiasAFecha(inicio, 6);
    if (!confirm(`Se generará la semana continua del ${inicio} al ${fin} repitiendo la secuencia de «${cuadroA.nombre}» y «${cuadroB.nombre}». ¿Continuar?`)) return;

    const fechasDestino = obtenerFechasPeriodo(inicio, fin);
    const desplazamientoInicial = ((diferenciaDiasEntreFechas(cuadroA.inicio, inicio) % 14) + 14) % 14;
    registrarHistorialCambios();
    empleados.forEach((empleado) => fechasDestino.forEach((fecha) => {
        const clave = claveCambioTurno(empleado, fecha.valor);
        delete cambiosTurnosManuales[clave];
        delete horariosManualesTurnos[clave];
        delete detallesCambiosManuales[clave];
    }));
    guardarCambiosManuales();
    guardarHorariosManuales();
    guardarDetallesCambiosManuales();

    fechaInicioTurnos.value = inicio;

    fechasPeriodoManuales = true;
    fechaFinTurnos.value = fin;
    generarTurnos();

    const empleadosSinSecuencia = [];
    asignacionesActuales.forEach((asignacion) => {
        const secuencia = secuencias.get(asignacion.empleado);
        if (!secuencia) {
            empleadosSinSecuencia.push(asignacion.empleado);
            return;
        }
        fechasDestino.forEach((fecha, indice) => {
            const indiceSecuencia = (desplazamientoInicial + indice) % secuencia.length;
            const turno = secuencia[indiceSecuencia];
            const clave = claveCambioTurno(asignacion.empleado, fecha.valor);
            const unidad = obtenerDatoSecuenciaSemanal(cuadroA, cuadroB, "unidades", asignacion.empleado, indiceSecuencia) || asignacion.unidad;
            const horario = obtenerDatoSecuenciaSemanal(cuadroA, cuadroB, "horarios", asignacion.empleado, indiceSecuencia);
            cambiosTurnosManuales[clave] = turno;
            if (horario) horariosManualesTurnos[clave] = horario;
            detallesCambiosManuales[clave] = {
                turnoAnterior: asignacion.turnos[indice],
                unidadAnterior: asignacion.unidadesPorDia?.[indice] || asignacion.unidad,
                turnoNuevo: turno,
                unidadNueva: ["Descanso", "Libre"].includes(turno) ? asignacion.unidad : unidad,
                observacion: "",
                ordenadoPor: "",
                origen: "continuidad-semanal",
                registradoEl: new Date().toISOString()
            };
        });
    });
    guardarCambiosManuales();
    guardarHorariosManuales();
    guardarDetallesCambiosManuales();
    generarTurnos();
    if (empleadosSinSecuencia.length) {
        alert(`La continuidad se aplicó. Sin secuencia guardada para: ${empleadosSinSecuencia.join(", ")}; se mantiene la propuesta automática para esas personas.`);
    }
}

function guardarCuadroActual() {
    if (!asignacionesActuales.length) return;
    const campoNombre = document.getElementById("nombreCuadroGuardar");
    const nombre = campoNombre.value.trim() || `Cuadrante ${fechasPeriodoActual[0].valor} a ${fechasPeriodoActual.at(-1).valor}`;
    campoNombre.value = "";
    const cuadro = {
        id: String(Date.now()),
        nombre: nombre.trim(),
        inicio: fechasPeriodoActual[0].valor,
        fin: fechasPeriodoActual.at(-1).valor,
        unidad: "todas",
        turnos: Object.fromEntries(asignacionesActuales.map((asignacion) => [asignacion.empleado, asignacion.turnos])),
        unidades: Object.fromEntries(asignacionesActuales.map((asignacion) => [
            asignacion.empleado,
            fechasPeriodoActual.map((_, indice) => asignacion.unidadesPorDia?.[indice] || asignacion.unidad)
        ])),
        horarios: Object.fromEntries(asignacionesActuales.map((asignacion) => [
            asignacion.empleado,
            fechasPeriodoActual.map((fecha) => horariosManualesTurnos[claveCambioTurno(asignacion.empleado, fecha.valor)] || "")
        ]))
    };
    cuadrosGuardados.push(cuadro);
    try {
        localStorage.setItem(STORAGE_CUADROS_GUARDADOS_KEY, JSON.stringify(cuadrosGuardados));
    } catch (error) {
        cuadrosGuardados.pop();
        alert("No se pudo guardar el cuadro: el almacenamiento del navegador está lleno.");
        return;
    }
    renderizarCuadrosGuardados();
    document.getElementById("cuadrosGuardados").value = cuadro.id;
    alert(`Cuadro «${cuadro.nombre}» guardado`);
}

// Recupera un cuadro guardado: genera la base automática y registra como cambios manuales las diferencias.
function recuperarCuadroGuardado() {
    const cuadro = cuadrosGuardados.find((item) => item.id === document.getElementById("cuadrosGuardados").value);
    if (!cuadro) return;
    if (fechaInicioTurnos) fechaInicioTurnos.value = cuadro.inicio;
    fechasPeriodoManuales = true;
    if (fechaFinTurnos) fechaFinTurnos.value = cuadro.fin;
    registrarHistorialCambios();
    const fechas = obtenerFechasPeriodo(cuadro.inicio, cuadro.fin);
    Object.keys(cuadro.turnos).forEach((empleado) => fechas.forEach((fecha) => {
        delete cambiosTurnosManuales[claveCambioTurno(empleado, fecha.valor)];
    }));
    generarTurnos();
    asignacionesActuales.forEach((asignacion) => {
        const guardados = cuadro.turnos[asignacion.empleado];
        if (!guardados) return;
        guardados.forEach((turno, i) => {
            if (turno !== asignacion.turnos[i] && fechasPeriodoActual[i]) {
                cambiosTurnosManuales[claveCambioTurno(asignacion.empleado, fechasPeriodoActual[i].valor)] = turno;
            }
        });
    });
    guardarCambiosManuales();
    generarTurnos();
}

// Deja todas las celdas del cuadro en "Libre" para asignar los turnos a mano (las vacaciones se respetan).
function limpiarCuadro() {
    if (!asignacionesActuales.length) generarTurnos();
    if (!asignacionesActuales.length || !fechasPeriodoActual.length) return;
    if (!confirm("¿Limpiar el cuadro? Todas las celdas quedarán libres para asignarlas manualmente (se puede deshacer).")) return;
    registrarHistorialCambios();
    asignacionesActuales.forEach((asignacion) => {
        fechasPeriodoActual.forEach((fecha, indice) => {
            if (asignacion.turnos[indice] === "Vacaciones") return;
            const clave = claveCambioTurno(asignacion.empleado, fecha.valor);
            cambiosTurnosManuales[clave] = "Libre";
            delete horariosManualesTurnos[clave];
            delete detallesCambiosManuales[clave];
        });
    });
    guardarCambiosManuales();
    guardarHorariosManuales();
    guardarDetallesCambiosManuales();
    generarTurnos();
}

function generarContinuidadTurnos() {
    if (!asignacionesActuales.length || !fechasPeriodoActual.length) {
        alert("Genera o carga primero el cuadro manual que quieres continuar.");
        return;
    }

    const ultimoDia = fechasPeriodoActual.at(-1);
    const cantidadDias = fechasPeriodoActual.length;
    const siguienteInicio = new Date(`${ultimoDia.valor}T00:00:00`);
    siguienteInicio.setDate(siguienteInicio.getDate() + 1);
    const formatearFecha = (fecha) => {
        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, "0");
        const dia = String(fecha.getDate()).padStart(2, "0");
        return `${anio}-${mes}-${dia}`;
    };
    const siguienteFin = new Date(siguienteInicio);
    siguienteFin.setDate(siguienteFin.getDate() + cantidadDias - 1);
    const inicio = formatearFecha(siguienteInicio);
    const fin = formatearFecha(siguienteFin);

    if (!confirm(`Se generará la continuidad del ${inicio} al ${fin} usando el último turno manual de cada trabajador. ¿Continuar?`)) return;

    const semillas = {};
    asignacionesActuales.forEach((asignacion) => {
        const turnosPermitidos = obtenerTurnosResponsabilidad(asignacion.unidad, asignacion.regla)
            .filter((turno) => !["Vacaciones", "Descanso", "Libre"].includes(turno));
        if (!turnosPermitidos.length) return;

        const ultimoTurno = [...asignacion.turnos].reverse()
            .find((turno) => turnosPermitidos.includes(turno));
        const posicion = turnosPermitidos.indexOf(ultimoTurno);
        if (posicion >= 0) semillas[asignacion.empleado] = (posicion + 1) % turnosPermitidos.length;
    });

    const fechasSiguientes = obtenerFechasPeriodo(inicio, fin);
    registrarHistorialCambios();
    empleados.forEach((empleado) => fechasSiguientes.forEach((fecha) => {
        const clave = claveCambioTurno(empleado, fecha.valor);
        delete cambiosTurnosManuales[clave];
        delete horariosManualesTurnos[clave];
        delete detallesCambiosManuales[clave];
    }));
    guardarCambiosManuales();
    guardarHorariosManuales();
    guardarDetallesCambiosManuales();

    fechaInicioTurnos.value = inicio;

    fechasPeriodoManuales = true;
    fechaFinTurnos.value = fin;
    semillasContinuidad = semillas;
    generarTurnos();
}

function eliminarCuadroGuardado() {
    const id = document.getElementById("cuadrosGuardados").value;
    const cuadro = cuadrosGuardados.find((item) => item.id === id);
    if (!cuadro || !confirm(`¿Eliminar el cuadro «${cuadro.nombre}»?`)) return;
    cuadrosGuardados = cuadrosGuardados.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_CUADROS_GUARDADOS_KEY, JSON.stringify(cuadrosGuardados));
    renderizarCuadrosGuardados();
}

function aplicarEstadoMapaAsignacion(activo) {
    const bloque = document.getElementById("bloqueMapaAsignacion");
    const boton = document.getElementById("alternarMapaAsignacion");
    if (!bloque || !boton) return;
    localStorage.setItem(STORAGE_MAPA_ASIGNACION_KEY, activo ? "1" : "0");
    bloque.hidden = !activo;
    boton.textContent = activo ? "Desactivar bloque" : "Activar bloque";
    boton.setAttribute("aria-expanded", String(activo));
    boton.classList.toggle("boton-activo", activo);
}

document.getElementById("alternarMapaAsignacion")?.addEventListener("click", () => {
    const bloque = document.getElementById("bloqueMapaAsignacion");
    aplicarEstadoMapaAsignacion(Boolean(bloque?.hidden));
});

function aplicarModoManual(activo) {
    localStorage.setItem(STORAGE_MODO_MANUAL_KEY, activo ? "1" : "0");
    const boton = document.getElementById("botonModoManual");
    boton.textContent = `Modo manual: ${activo ? "activado" : "desactivado"}`;
    boton.setAttribute("aria-pressed", String(activo));
    boton.classList.toggle("boton-activo", activo);
    document.getElementById("panelManual").hidden = !activo;
    [botonGenerar, botonGenerarPeriodo, botonActualizarCuadro].forEach((item) => { if (item) item.hidden = activo; });
}

function actualizarBotonesModoManual() {
    const hayCuadro = asignacionesActuales.length > 0;
    ["botonGuardarCuadro", "botonImprimirManual", "botonDescargarManual", "botonContinuidadTurnos"].forEach((id) => {
        const boton = document.getElementById(id);
        if (boton) boton.disabled = !hayCuadro;
    });
    actualizarBotonContinuidadSemanal();
}

document.getElementById("botonModoManual")?.addEventListener("click", () => {
    const activar = document.getElementById("panelManual").hidden;
    aplicarModoManual(activar);
    // Al entrar en modo manual se parte de un cuadro generado si todavía no hay ninguno.
    if (activar && !asignacionesActuales.length && empleados.length) generarTurnos();
});
// Vuelve a la propuesta automática del periodo descartando los cambios manuales de ese periodo.
function cargarCuadroBase() {
    const inicio = fechaInicioTurnos?.value || obtenerFechaInicioSemana();
    const fin = fechaFinTurnos?.value || obtenerFechaFinSemana();
    if (fin >= inicio) {
        const fechas = obtenerFechasPeriodo(inicio, fin);
        const claves = empleados.flatMap((empleado) => fechas.map((fecha) => claveCambioTurno(empleado, fecha.valor)))
            .filter((clave) => cambiosTurnosManuales[clave] !== undefined);
        if (claves.length) {
            if (!confirm("Se cargará la propuesta automática y se descartarán los cambios manuales del periodo (se puede deshacer). ¿Continuar?")) return;
            registrarHistorialCambios();
            claves.forEach((clave) => {
                delete cambiosTurnosManuales[clave];
                delete horariosManualesTurnos[clave];
                delete detallesCambiosManuales[clave];
            });
            guardarCambiosManuales();
            guardarHorariosManuales();
            guardarDetallesCambiosManuales();
        }
    }
    generarTurnos();
}
document.getElementById("botonCuadroBase")?.addEventListener("click", cargarCuadroBase);
document.getElementById("botonLimpiarCuadro")?.addEventListener("click", limpiarCuadro);
document.getElementById("botonContinuidadTurnos")?.addEventListener("click", generarContinuidadTurnos);
document.getElementById("botonGuardarCuadro")?.addEventListener("click", guardarCuadroActual);
document.getElementById("botonImprimirManual")?.addEventListener("click", imprimirSoloCuadro);
document.getElementById("botonDescargarManual")?.addEventListener("click", descargarCuadroCsv);
document.getElementById("botonRecuperarCuadro")?.addEventListener("click", recuperarCuadroGuardado);
document.getElementById("botonEliminarCuadro")?.addEventListener("click", eliminarCuadroGuardado);
crearBotonContinuidadSemanal();
renderizarCuadrosGuardados();
aplicarEstadoMapaAsignacion(localStorage.getItem(STORAGE_MAPA_ASIGNACION_KEY) !== "0");
aplicarModoManual(localStorage.getItem(STORAGE_MODO_MANUAL_KEY) === "1");

function actualizarResumenCuadro(asignaciones, fechasPeriodo, filtroUnidad) {
    const unidades = new Set(asignaciones.map((asignacion) => asignacion.unidad));
    const cambiosEnPeriodo = asignaciones.reduce((total, asignacion) => {
        return total + fechasPeriodo.filter((fecha, indice) => {
            return cambiosTurnosManuales[claveCambioTurno(asignacion.empleado, fecha.valor)] &&
                cambiosTurnosManuales[claveCambioTurno(asignacion.empleado, fecha.valor)] !== asignacion.turnos[indice];
        }).length;
    }, 0);
    const etiquetaUnidad = filtroUnidad === "todas" ? "todas las unidades" : filtroUnidad;
    const inicio = fechasPeriodo[0]?.etiqueta || "";
    const fin = fechasPeriodo[fechasPeriodo.length - 1]?.etiqueta || "";

    if (tituloCuadro) tituloCuadro.textContent = `Cuadrante del ${inicio} al ${fin}`;
    const excedidos = asignaciones.filter((asignacion) => asignacion.superaHoras).map((asignacion) => asignacion.empleado);
    const avisoHoras = excedidos.length ? ` · Aviso: superan el máximo de horas anuales (proporcional al periodo): ${excedidos.join(", ")}.` : "";
    const avisoCobertura = avisosCobertura.size
        ? ` · Puestos sin cubrir (días): ${Array.from(avisosCobertura, ([clave, dias]) => `${clave} ${dias}`).join(", ")}.`
        : "";
    if (detalleCuadro) detalleCuadro.textContent = `${etiquetaUnidad} · Pulsa cualquier celda para editar un turno.${avisoHoras}${avisoCobertura}`;
    if (estadoCuadro) {
        estadoCuadro.textContent = "Generado";
        estadoCuadro.className = "estado-cuadro estado-generado";
    }
    if (botonImprimirCuadro) botonImprimirCuadro.disabled = false;
    if (botonDescargarCuadro) botonDescargarCuadro.disabled = false;
    if (botonImagenCuadro) botonImagenCuadro.disabled = false;
    if (informeGenerado) renderizarInformeCuadro(); else actualizarEstadoInforme();
    actualizarBotonesModoManual();
    if (metricaEmpleados) metricaEmpleados.textContent = asignaciones.length;
    if (metricaUnidades) metricaUnidades.textContent = unidades.size;
    if (metricaDias) metricaDias.textContent = fechasPeriodo.length;
    if (metricaCambios) metricaCambios.textContent = cambiosEnPeriodo;
}

function descargarCuadroCsv() {
    if (!asignacionesActuales.length || !fechasPeriodoActual.length) return;

    const filas = [["Empleado", "Unidad", ...fechasPeriodoActual.map((fecha) => fecha.etiqueta)]];
    asignacionesActuales.forEach((asignacion) => {
        filas.push([asignacion.empleado, asignacion.unidad, ...asignacion.turnos]);
    });

    const contenido = filas.map((fila) => fila.map((valor) => {
        const texto = String(valor ?? "").replace(/"/g, '""');
        return `"${texto}"`;
    }).join(";")).join("\n");
    const blob = new Blob(["\ufeff", contenido], { type: "text/csv;charset=utf-8" });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `cuadrante-${fechasPeriodoActual[0].valor}-${fechasPeriodoActual.at(-1).valor}.csv`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
}

async function descargarCuadroImagen() {
    if (!asignacionesActuales.length || !fechasPeriodoActual.length) return;
    if (typeof html2canvas !== "function") {
        alert("No se pudo preparar la imagen. Comprueba la conexión a internet y vuelve a intentarlo.");
        return;
    }

    const textoOriginal = botonImagenCuadro?.textContent;
    if (botonImagenCuadro) {
        botonImagenCuadro.disabled = true;
        botonImagenCuadro.textContent = "Preparando...";
    }

    try {
        const canvas = await html2canvas(cuadrosTurnos, {
            backgroundColor: "#f7f9fc",
            scale: 2,
            useCORS: true
        });
        const enlace = document.createElement("a");
        enlace.href = canvas.toDataURL("image/jpeg", 0.92);
        enlace.download = `cuadrante-${fechasPeriodoActual[0].valor}-${fechasPeriodoActual.at(-1).valor}.jpg`;
        enlace.click();
    } finally {
        if (botonImagenCuadro) {
            botonImagenCuadro.disabled = false;
            botonImagenCuadro.textContent = textoOriginal;
        }
    }
}

function iniciarArrastreCuadro(event) {
    const celdaOrigen = event.target.closest?.(".celda-turno-editable");
    if (celdaOrigen?.draggable) {
        arrastreTurno = { empleado: celdaOrigen.dataset.empleado, fecha: celdaOrigen.dataset.fecha };
        celdaOrigen.classList.add("celda-arrastrada");
        event.dataTransfer.effectAllowed = "copyMove";
        event.dataTransfer.setData("text/plain", "turno");
        return;
    }
    const bloque = event.target.closest(".bloque-turnos");
    if (!bloque) return;
    bloque.classList.add("arrastrando-cuadro");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", bloque.dataset.grupoTurnos);
}

function permitirSoltarCuadro(event) {
    if (arrastreTurno) {
        const celda = event.target.closest(".celda-turno-editable");
        if (!celda) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = event.altKey ? "move" : "copy";
        cuadrosTurnos.querySelectorAll(".celda-destino").forEach((item) => item.classList.remove("celda-destino"));
        celda.classList.add("celda-destino");
        return;
    }
    const bloque = event.target.closest(".bloque-turnos");
    if (!bloque) return;
    event.preventDefault();
    bloque.classList.add("destino-cuadro");
    event.dataTransfer.dropEffect = "move";
}

function intercambiarTurnos(origen, destino) {
    const asignacionA = asignacionesActuales.find((item) => item.empleado === origen.empleado);
    const asignacionB = asignacionesActuales.find((item) => item.empleado === destino.empleado);
    const indiceA = fechasPeriodoActual.findIndex((fecha) => fecha.valor === origen.fecha);
    const indiceB = fechasPeriodoActual.findIndex((fecha) => fecha.valor === destino.fecha);
    if (!asignacionA || !asignacionB || indiceA < 0 || indiceB < 0) return;
    if (origen.empleado === destino.empleado && origen.fecha === destino.fecha) return;

    const turnoA = asignacionA.turnos[indiceA];
    const turnoB = asignacionB.turnos[indiceB];
    if (turnoA === turnoB) return;

    if (reglasGenerales.vacacionesImpidenTurno.activa && (turnoA === "Vacaciones" || turnoB === "Vacaciones")) {
        alert("No se puede mover un día de vacaciones. Puedes desactivar la regla en Configuración de reglas.");
        return;
    }
    if (reglasGenerales.respetarPuesto.activa) {
        const permitido = (asignacion, turno, indiceDia) => turnoPermitidoParaEmpleado(asignacion.unidad, asignacion.regla, turno, asignacion.turnos[indiceDia]);
        if (!permitido(asignacionA, turnoB, indiceA) || !permitido(asignacionB, turnoA, indiceB)) {
            alert("El intercambio no es posible: algún turno no corresponde al puesto/cualificación del empleado.");
            return;
        }
    }

    registrarHistorialCambios();
    const unidadDia = (asignacion, indice) => asignacion.unidadesPorDia?.[indice] || asignacion.unidad;
    const unidadA = unidadDia(asignacionA, indiceA);
    const unidadB = unidadDia(asignacionB, indiceB);
    // Cada celda recibe el turno y la unidad de la otra; sus horarios manuales anteriores dejan de aplicar.
    [[origen, asignacionA, turnoA, turnoB, unidadA, unidadB], [destino, asignacionB, turnoB, turnoA, unidadB, unidadA]]
        .forEach(([celda, asignacion, anterior, nuevo, unidadAnterior, unidadNueva]) => {
            const clave = claveCambioTurno(celda.empleado, celda.fecha);
            cambiosTurnosManuales[clave] = nuevo;
            delete horariosManualesTurnos[clave];
            detallesCambiosManuales[clave] = {
                turnoAnterior: anterior,
                unidadAnterior,
                turnoNuevo: nuevo,
                unidadNueva: ["Descanso", "Libre"].includes(nuevo) ? asignacion.unidad : unidadNueva,
                observacion: "",
                ordenadoPor: "",
                registradoEl: new Date().toISOString()
            };
        });
    guardarCambiosManuales();
    guardarHorariosManuales();
    guardarDetallesCambiosManuales();

    const posiciones = new Map();
    cuadrosTurnos.querySelectorAll(".bloque-turnos").forEach((bloque) => {
        posiciones.set(bloque.dataset.grupoTurnos, bloque.querySelector(".ventana-carrusel")?.scrollLeft || 0);
    });
    generarTurnos();
    cuadrosTurnos.querySelectorAll(".bloque-turnos").forEach((bloque) => {
        bloque.querySelector(".ventana-carrusel")?.scrollTo({ left: posiciones.get(bloque.dataset.grupoTurnos) || 0, behavior: "instant" });
    });
}

function aplicarCambioCelda(empleado, fecha, turno, unidad, observacion) {
    const asignacion = asignacionesActuales.find((item) => item.empleado === empleado);
    const indice = fechasPeriodoActual.findIndex((item) => item.valor === fecha);
    if (!asignacion || indice < 0) return;
    const clave = claveCambioTurno(empleado, fecha);
    detallesCambiosManuales[clave] = {
        turnoAnterior: asignacion.turnos[indice],
        unidadAnterior: asignacion.unidadesPorDia?.[indice] || asignacion.unidad,
        turnoNuevo: turno,
        unidadNueva: ["Descanso", "Libre"].includes(turno) ? asignacion.unidad : unidad,
        observacion,
        ordenadoPor: "",
        registradoEl: new Date().toISOString()
    };
    cambiosTurnosManuales[clave] = turno;
    delete horariosManualesTurnos[clave];
}

function guardarYRegenerarManual() {
    guardarCambiosManuales();
    guardarHorariosManuales();
    guardarDetallesCambiosManuales();
    const posiciones = new Map();
    cuadrosTurnos.querySelectorAll(".bloque-turnos").forEach((bloque) => {
        posiciones.set(bloque.dataset.grupoTurnos, bloque.querySelector(".ventana-carrusel")?.scrollLeft || 0);
    });
    generarTurnos();
    cuadrosTurnos.querySelectorAll(".bloque-turnos").forEach((bloque) => {
        bloque.querySelector(".ventana-carrusel")?.scrollTo({ left: posiciones.get(bloque.dataset.grupoTurnos) || 0, behavior: "instant" });
    });
}

// Copia el turno (y la unidad del día) de la celda origen a la de destino; el origen se mantiene.
function copiarTurno(origen, destino) {
    const asignacionA = asignacionesActuales.find((item) => item.empleado === origen.empleado);
    const asignacionB = asignacionesActuales.find((item) => item.empleado === destino.empleado);
    const indiceA = fechasPeriodoActual.findIndex((fecha) => fecha.valor === origen.fecha);
    const indiceB = fechasPeriodoActual.findIndex((fecha) => fecha.valor === destino.fecha);
    if (!asignacionA || !asignacionB || indiceA < 0 || indiceB < 0) return;
    if (origen.empleado === destino.empleado && origen.fecha === destino.fecha) return;

    const turno = asignacionA.turnos[indiceA];
    if (turno === asignacionB.turnos[indiceB]) return;
    if (reglasGenerales.vacacionesImpidenTurno.activa && asignacionB.turnos[indiceB] === "Vacaciones") {
        alert("No se puede sobrescribir un día de vacaciones. Puedes desactivar la regla en Configuración de reglas.");
        return;
    }
    const unidad = asignacionA.unidadesPorDia?.[indiceA] || asignacionA.unidad;
    if (reglasGenerales.respetarPuesto.activa &&
        !turnoPermitidoParaEmpleado(unidad, asignacionB.regla, turno, asignacionB.turnos[indiceB])) {
        alert("La copia no es posible: el turno no corresponde al puesto/cualificación del empleado de destino.");
        return;
    }
    const ocupante = obtenerOcupanteRolUnidad(unidad, turno, indiceB, [destino.empleado]);
    if (ocupante && !confirm(`${ocupante} ya tiene ${turno} en ${unidad} ese día. ¿Copiarlo igualmente a ${destino.empleado}?`)) return;

    registrarHistorialCambios();
    aplicarCambioCelda(destino.empleado, destino.fecha, turno, unidad, "");
    guardarYRegenerarManual();
}

// Borra el turno de una celda dejándola libre sin tocar al resto.
function borrarTurnoCelda(empleado, fecha) {
    const asignacion = asignacionesActuales.find((item) => item.empleado === empleado);
    const indice = fechasPeriodoActual.findIndex((item) => item.valor === fecha);
    if (!asignacion || indice < 0) return;
    const actual = asignacion.turnos[indice];
    if (["Libre", "Descanso"].includes(actual)) return;
    if (reglasGenerales.vacacionesImpidenTurno.activa && actual === "Vacaciones") {
        alert("No se puede borrar un día de vacaciones. Puedes desactivar la regla en Configuración de reglas.");
        return;
    }
    registrarHistorialCambios();
    aplicarCambioCelda(empleado, fecha, "Libre", asignacion.unidad, "Turno borrado");
    delete detallesCambiosManuales[claveCambioTurno(empleado, fecha)];
    guardarYRegenerarManual();
}

function soltarCuadro(event) {
    event.preventDefault();
    if (arrastreTurno) {
        const origen = arrastreTurno;
        const celda = event.target.closest(".celda-turno-editable");
        arrastreTurno = null;
        if (celda) {
            const destino = { empleado: celda.dataset.empleado, fecha: celda.dataset.fecha };
            // Por defecto se copia; con Alt se intercambian las dos celdas.
            if (event.altKey) intercambiarTurnos(origen, destino);
            else copiarTurno(origen, destino);
        }
        limpiarEstadoArrastreCuadros();
        return;
    }
    const origen = event.dataTransfer.getData("text/plain");
    const destino = event.target.closest(".bloque-turnos");
    if (!origen || !destino || origen === destino.dataset.grupoTurnos) {
        limpiarEstadoArrastreCuadros();
        return;
    }

    const indiceOrigen = ordenCuadros.indexOf(origen);
    const indiceDestino = ordenCuadros.indexOf(destino.dataset.grupoTurnos);
    if (indiceOrigen < 0 || indiceDestino < 0) return;

    ordenCuadros.splice(indiceOrigen, 1);
    ordenCuadros.splice(indiceDestino, 0, origen);
    guardarOrdenCuadros();

    const bloqueOrigen = cuadrosTurnos.querySelector(`[data-grupo-turnos="${origen}"]`);
    if (indiceOrigen < indiceDestino) {
        destino.after(bloqueOrigen);
    } else {
        destino.before(bloqueOrigen);
    }
    limpiarEstadoArrastreCuadros();
}

function limpiarEstadoArrastreCuadros() {
    arrastreTurno = null;
    cuadrosTurnos?.querySelectorAll(".celda-arrastrada, .celda-destino").forEach((celda) => {
        celda.classList.remove("celda-arrastrada", "celda-destino");
    });
    cuadrosTurnos?.querySelectorAll(".bloque-turnos").forEach((bloque) => {
        bloque.classList.remove("arrastrando-cuadro", "destino-cuadro");
    });
}

function manejarClickCuadroTurnos(event) {
    const celda = event.target.closest(".celda-turno-editable");
    if (!celda) return;
    abrirEditorCambioTurno(celda.dataset.empleado, celda.dataset.fecha);
}

function abrirEditorCambioTurno(empleado, fecha) {
    if (!modalCambioTurno || !nuevoTurnoIndividual) return;

    const asignacion = asignacionesActuales.find((item) => item.empleado === empleado);
    const indiceFecha = fechasPeriodoActual.findIndex((item) => item.valor === fecha);
    if (!asignacion || indiceFecha < 0) return;

    cambioTurnoActivo = { empleado, fecha, indiceFecha };
    const fechaTexto = fechasPeriodoActual[indiceFecha].etiqueta;
    detalleCambioTurno.textContent = `${empleado} · ${fechaTexto} · Turno actual: ${asignacion.turnos[indiceFecha]}`;
    nuevoTurnoIndividual.innerHTML = "";

    const reglaAsignacion = reglasPorEmpleado[empleado];
    [...obtenerCatalogoTurnosEmpleado(reglaAsignacion).map((turno) => turno.codigo), "Descanso", "Libre"].forEach((turno) => {
        const opcion = document.createElement("option");
        opcion.value = turno;
        opcion.textContent = turno;
        opcion.selected = turno === asignacion.turnos[indiceFecha];
        nuevoTurnoIndividual.appendChild(opcion);
    });

    if (unidadCambioTurno) {
        unidadCambioTurno.innerHTML = "";
        const unidadDelDia = asignacion.unidadesPorDia?.[indiceFecha] || asignacion.unidad;
        obtenerUnidadesTrabajoDisponibles(asignacion.unidad).forEach((unidad) => {
            const opcion = document.createElement("option");
            opcion.value = unidad;
            opcion.textContent = unidad;
            opcion.selected = unidadesSonIguales(unidad, unidadDelDia);
            unidadCambioTurno.appendChild(opcion);
        });
    }

    if (horarioManualCambioTurno) {
        const claveHorario = claveCambioTurno(empleado, fecha);
        horarioManualCambioTurno.value = horariosManualesTurnos[claveHorario] || obtenerHorarioFormatoTurno(asignacion.turnos[indiceFecha]);
    }

    const detalleExistente = detallesCambiosManuales[claveCambioTurno(empleado, fecha)];
    if (observacionCambioTurno) observacionCambioTurno.value = detalleExistente?.observacion || "";
    if (ordenadoPorCambioTurno) ordenadoPorCambioTurno.value = detalleExistente?.ordenadoPor || "";

    renderizarSugerenciasCobertura(empleado, fecha, indiceFecha, nuevoTurnoIndividual.value);
    nuevoTurnoIndividual.onchange = () => {
        renderizarSugerenciasCobertura(empleado, fecha, indiceFecha, nuevoTurnoIndividual.value);
        if (horarioManualCambioTurno) {
            horarioManualCambioTurno.value = obtenerHorarioFormatoTurno(nuevoTurnoIndividual.value);
        }
    };
    modalCambioTurno.classList.remove("oculto");
    modalCambioTurno.setAttribute("aria-hidden", "false");
}

function cerrarEditorCambioTurno() {
    if (!modalCambioTurno) return;
    modalCambioTurno.classList.add("oculto");
    modalCambioTurno.setAttribute("aria-hidden", "true");
    cambioTurnoActivo = null;
}

function obtenerHorarioFormatoTurno(codigo) {
    if (codigo === "Descanso" || codigo === "Libre") return "No trabaja";
    const datos = obtenerCatalogoTurnosEmpleado(reglasPorEmpleado[cambioTurnoActivo?.empleado] || {}).find((item) => item.codigo === codigo);
    return datos?.horario || "";
}

function renderizarSugerenciasCobertura(empleadoObjetivo, fecha, indiceFecha, turnoSolicitado) {
    if (!listaSugerenciasCobertura) return;
    listaSugerenciasCobertura.innerHTML = "";

    const objetivo = asignacionesActuales.find((item) => item.empleado === empleadoObjetivo);
    const salidaSolicitada = obtenerHoraSalida(turnoSolicitado);
    const candidatos = asignacionesActuales
        .filter((item) => item.empleado !== empleadoObjetivo)
        .filter((item) => !reglasGenerales.respetarPuesto.activa || turnoPermitidoParaEmpleado(item.unidad, item.regla, turnoSolicitado))
        .map((item) => {
            const turnoActual = item.turnos[indiceFecha];
            const libre = ["Descanso", "Vacaciones", "Libre"].includes(turnoActual);
            const mismaUnidad = objetivo && item.unidad === objetivo.unidad;
            const mismaFranja = clasificarTurno(turnoActual) === clasificarTurno(turnoSolicitado);
            const mismaHoraSalida = salidaSolicitada && salidaSolicitada === obtenerHoraSalida(turnoActual);
            const conflicto = !libre && (mismaFranja || turnoActual === turnoSolicitado);
            const capacidadSuficiente = item.porcentaje >= (objetivo?.porcentaje || 100);
            return { item, turnoActual, libre, mismaUnidad, mismaHoraSalida, capacidadSuficiente, conflicto };
        })
        .filter((candidato) => !candidato.conflicto)
        .sort((a, b) => Number(b.libre) - Number(a.libre) || Number(b.mismaHoraSalida) - Number(a.mismaHoraSalida) || Number(b.mismaUnidad) - Number(a.mismaUnidad) || Number(b.capacidadSuficiente) - Number(a.capacidadSuficiente));

    if (!candidatos.length) {
        listaSugerenciasCobertura.textContent = "No hay candidatos libres sin conflicto para este día.";
        return;
    }

    candidatos.slice(0, 6).forEach(({ item, turnoActual, libre, mismaUnidad, mismaHoraSalida }) => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "sugerencia-cobertura";
        boton.textContent = `${item.empleado} · ${libre ? "Libre" : turnoActual}${mismaHoraSalida ? " · misma salida" : ""}${mismaUnidad ? " · misma unidad" : ""}`;
        boton.addEventListener("click", () => {
            registrarHistorialCambios();
            cambiosTurnosManuales[claveCambioTurno(item.empleado, fecha)] = turnoSolicitado;
            guardarCambiosManuales();
            alert(`${item.empleado} ha sido propuesto para cubrir ${turnoSolicitado}.`);
        });
        listaSugerenciasCobertura.appendChild(boton);
    });
}

function obtenerIntervaloTurno(turno, regla, dia) {
    const entrada = (obtenerCatalogoTurnosEmpleado(regla), cacheGeneracion?.catalogos.get(regla || SIN_REGLA));
    let horas = entrada?.intervalos.get(turno);
    if (horas === undefined) {
        const datos = obtenerCatalogoTurnosEmpleado(regla).find((item) => item.codigo === turno);
        const m = datos?.horario?.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        horas = m ? [Number(m[1]) * 60 + Number(m[2]), Number(m[3]) * 60 + Number(m[4])] : null;
        entrada?.intervalos.set(turno, horas);
    }
    if (!horas) return null;
    const inicio = dia * 1440 + horas[0];
    let fin = dia * 1440 + horas[1];
    if (fin <= inicio) fin += 1440;
    return { inicio, fin };
}

function calcularHorasTurnos(turnos, regla) {
    const minutos = turnos.reduce((total, turno, dia) => {
        const intervalo = obtenerIntervaloTurno(turno, regla, dia);
        return total + (intervalo ? intervalo.fin - intervalo.inicio : 0);
    }, 0);
    return minutos / 60;
}

function obtenerIniciosSemanasCompletas(fechasPeriodo) {
    return fechasPeriodo
        .map((fecha, indice) => ({ fecha, indice }))
        .filter(({ fecha, indice }) =>
            obtenerDiaSemanaFecha(fecha.valor) === 1 && indice + 7 <= fechasPeriodo.length
        )
        .map(({ indice }) => indice);
}

function ordenarIndicesParaDescanso(indices, fechasPeriodo, indiceRotacion) {
    // Prioriza mover el descanso a días laborables y rota la elección entre empleados.
    const entreSemana = [];
    const finDeSemana = [];
    indices.forEach((indice) => {
        const dia = obtenerDiaSemanaFecha(fechasPeriodo[indice].valor);
        (dia === 0 || dia === 6 ? finDeSemana : entreSemana).push(indice);
    });
    const rotar = (lista) => {
        if (!lista.length) return lista;
        const desplazamiento = Math.abs(indiceRotacion) % lista.length;
        return lista.map((_, indice) => lista[(indice + desplazamiento) % lista.length]);
    };
    return [...rotar(entreSemana), ...rotar(finDeSemana)];
}

function aplicarReglasDescanso(turnos, regla, limiteHoras, fechasPeriodo, porcentaje, indiceRotacion = 0) {
    const { descansoEntreTurnos, descansoSemanal, maxHorasAnuales, maxHorasSemanales, maxHorasMensuales } = reglasGenerales;
    const iniciosSemanas = obtenerIniciosSemanasCompletas(fechasPeriodo);

    if (descansoEntreTurnos.activa) {
        const minimo = descansoEntreTurnos.valor * 60;
        let finPrevio = null;
        turnos.forEach((turno, dia) => {
            const intervalo = obtenerIntervaloTurno(turno, regla, dia);
            if (!intervalo) return;
            if (finPrevio !== null && intervalo.inicio - finPrevio < minimo) {
                turnos[dia] = "Descanso";
                return;
            }
            finPrevio = intervalo.fin;
        });
    }

    if (descansoSemanal.activa) {
        const minimo = descansoSemanal.valor * 60;
        iniciosSemanas.forEach((inicio, indiceSemana) => {
            for (let intento = 0; intento < 7; intento++) {
                let cursor = inicio * 1440;
                let mejorDescanso = 0;
                for (let dia = inicio; dia < inicio + 7; dia++) {
                    const intervalo = obtenerIntervaloTurno(turnos[dia], regla, dia);
                    if (!intervalo) continue;
                    mejorDescanso = Math.max(mejorDescanso, intervalo.inicio - cursor);
                    cursor = intervalo.fin;
                }
                mejorDescanso = Math.max(mejorDescanso, (inicio + 7) * 1440 - cursor);
                if (mejorDescanso >= minimo) break;

                const diasSemana = Array.from({ length: 7 }, (_, indice) => inicio + indice);
                const candidato = ordenarIndicesParaDescanso(diasSemana, fechasPeriodo, indiceRotacion + indiceSemana)
                    .find((dia) => obtenerIntervaloTurno(turnos[dia], regla, dia));
                if (candidato === undefined) break;
                turnos[candidato] = "Descanso";
            }
        });
    }

    const horasEnDias = (indices) => indices.reduce((total, dia) => {
        const intervalo = obtenerIntervaloTurno(turnos[dia], regla, dia);
        return total + (intervalo ? intervalo.fin - intervalo.inicio : 0);
    }, 0) / 60;
    // Quita un día trabajado por bloque de 7 días, de forma rotatoria, hasta cumplir el límite.
    const recortarHoras = (indices, limite) => {
        for (let ronda = 0; horasEnDias(indices) > limite && ronda < indices.length; ronda++) {
            let huboCambio = false;
            for (let inicio = 0; inicio < indices.length; inicio += 7) {
                if (horasEnDias(indices) <= limite) break;
                const bloque = indices.slice(inicio, inicio + 7);
                const candidato = ordenarIndicesParaDescanso(bloque, fechasPeriodo, indiceRotacion + ronda + inicio / 7)
                    .find((dia) => obtenerIntervaloTurno(turnos[dia], regla, dia));
                if (candidato === undefined) continue;
                turnos[candidato] = "Descanso";
                huboCambio = true;
            }
            if (!huboCambio) break;
        }
    };
    const proporcion = (porcentaje ?? 100) / 100;

    if (maxHorasSemanales.activa) {
        iniciosSemanas.forEach((inicio) => {
            recortarHoras(Array.from({ length: 7 }, (_, k) => inicio + k), maxHorasSemanales.valor * proporcion);
        });
    }

    if (maxHorasMensuales.activa && fechasPeriodo) {
        const diasPorMes = new Map();
        fechasPeriodo.forEach((fecha, dia) => {
            const mes = fecha.valor.slice(0, 7);
            if (!diasPorMes.has(mes)) diasPorMes.set(mes, []);
            diasPorMes.get(mes).push(dia);
        });
        diasPorMes.forEach((indices, mes) => {
            const [anio, numeroMes] = mes.split("-").map(Number);
            const diasDelMes = new Date(anio, numeroMes, 0).getDate();
            recortarHoras(indices, maxHorasMensuales.valor * proporcion * (indices.length / diasDelMes));
        });
    }

    if (maxHorasAnuales.activa && Number.isFinite(limiteHoras)) {
        recortarHoras(turnos.map((_, dia) => dia), limiteHoras);
    }
}

function obtenerPorcentajeJornada(regla) {
    const porcentaje = Number(regla?.porcentajeHorasMes);
    return Number.isFinite(porcentaje) ? Math.min(Math.max(porcentaje, 0), 100) : 100;
}

function obtenerHoraSalida(turno) {
    const datos = obtenerCatalogoTurnosEmpleado({}).find((item) => item.codigo === turno);
    if (!datos || !datos.horario.includes("-")) return "";
    return datos.horario.split("-")[1].trim();
}

// Devuelve quién ocupa ya el rol (único por unidad y día) en la unidad indicada, si lo hay.
function obtenerOcupanteRolUnidad(unidad, turno, indiceDia, excluidos = []) {
    const turnosUnidad = obtenerConfiguracionUnidad(unidad)?.turnos || [];
    if (!turnosUnidad.includes(turno) || !["mañanas", "tardes"].includes(clasificarTurno(turno))) return null;
    const ocupante = asignacionesActuales.find((item) =>
        !excluidos.includes(item.empleado) &&
        item.turnos[indiceDia] === turno &&
        unidadesSonIguales(item.unidadesPorDia?.[indiceDia] || item.unidad, unidad)
    );
    return ocupante?.empleado || null;
}

function guardarCambioTurnoIndividual() {
    if (!cambioTurnoActivo || !nuevoTurnoIndividual) return;
    const { empleado, fecha, indiceFecha } = cambioTurnoActivo;
    const asignacion = asignacionesActuales.find((item) => item.empleado === empleado);
    const turnoAnterior = asignacion?.turnos[indiceFecha] || "";
    const unidadAnterior = asignacion?.unidadesPorDia?.[indiceFecha] || asignacion?.unidad || "";

    const unidadSeleccionada = unidadCambioTurno?.value.trim();
    if (reglasGenerales.respetarPuesto.activa && asignacion) {
        const unidadDestino = unidadSeleccionada || asignacion.unidad;
        if (!turnoPermitidoParaEmpleado(unidadDestino, asignacion.regla, nuevoTurnoIndividual.value, turnoAnterior)) {
            alert(`El turno ${nuevoTurnoIndividual.value} no corresponde al puesto/cualificación de ${empleado}. Puedes desactivar la regla en Configuración de reglas.`);
            return;
        }
    }

    const unidadFinal = unidadSeleccionada || asignacion?.unidadesPorDia?.[indiceFecha] || asignacion?.unidad;
    const ocupante = obtenerOcupanteRolUnidad(unidadFinal, nuevoTurnoIndividual.value, indiceFecha, [empleado]);
    if (ocupante && !confirm(`${ocupante} ya tiene ${nuevoTurnoIndividual.value} en ${unidadFinal} ese día. ¿Asignarlo igualmente a ${empleado}?`)) return;

    registrarHistorialCambios();
    cambiosTurnosManuales[claveCambioTurno(empleado, fecha)] = nuevoTurnoIndividual.value;
    guardarCambiosManuales();

    const claveHorario = claveCambioTurno(empleado, fecha);
    const horarioTexto = horarioManualCambioTurno?.value.trim() || "";
    const horarioPredeterminado = obtenerHorarioFormatoTurno(nuevoTurnoIndividual.value);
    if (horarioTexto && horarioTexto !== horarioPredeterminado) {
        horariosManualesTurnos[claveHorario] = horarioTexto;
    } else {
        delete horariosManualesTurnos[claveHorario];
    }
    guardarHorariosManuales();

    const claveDetalle = claveCambioTurno(empleado, fecha);
    const observacion = observacionCambioTurno?.value.trim() || "";
    const ordenadoPor = ordenadoPorCambioTurno?.value.trim() || "";
    // La unidad elegida vale solo para este día; la unidad base del empleado no cambia.
    const unidadNueva = unidadSeleccionada || unidadAnterior;
    const huboCambio = nuevoTurnoIndividual.value !== turnoAnterior || !unidadesSonIguales(unidadNueva, unidadAnterior);
    if (observacion || ordenadoPor || huboCambio) {
        detallesCambiosManuales[claveDetalle] = {
            turnoAnterior,
            unidadAnterior,
            turnoNuevo: nuevoTurnoIndividual.value,
            unidadNueva,
            observacion,
            ordenadoPor,
            registradoEl: new Date().toISOString()
        };
    } else {
        delete detallesCambiosManuales[claveDetalle];
    }
    guardarDetallesCambiosManuales();

    cerrarEditorCambioTurno();
    generarTurnos();
}

function clasificarTurno(turno) {
    if (/^M|^CD|^RF/.test(turno)) return "mañanas";
    if (/^T/.test(turno)) return "tardes";
    if (/^N/.test(turno)) return "noches";
    return "otros";
}

// Los turnos preferidos nunca incluyen códigos que no correspondan a la profesión; si no queda ninguno se busca uno válido.
function obtenerTurnosPreferidos(regla) {
    const turnos = obtenerTurnosPreferidosBase(regla);
    if (regla?.perfilProfesionActivo === false) return turnos;
    const validos = turnos.filter((turno) => turnoCompatibleConProfesion(regla, turno));
    if (validos.length) return validos;
    const perfil = obtenerPerfilProfesion(regla?.cargo);
    const alternativo = [...perfil.preferidos, ...obtenerCatalogoTurnosEmpleado(regla).map((turno) => turno.codigo)]
        .find((codigo) => codigo !== "Vacaciones" && turnoCompatibleConProfesion(regla, codigo));
    return alternativo ? [alternativo] : turnos;
}

function obtenerTurnosPreferidosBase(regla) {
    if (Array.isArray(regla.turnosPreferidos) && regla.turnosPreferidos.length) {
        const catalogoEmpleado = obtenerCatalogoTurnosEmpleado(regla);
        const turnosValidos = expandirTurnosAgrupados(regla.turnosPreferidos).filter((turno) =>
            catalogoEmpleado.some((item) => item.codigo === turno)
        );
        if (turnosValidos.length) return turnosValidos;
    }

    if (regla.turnoPreferido) {
        if (regla.turnoPreferido === "Mañana") return ["M1"];
        if (regla.turnoPreferido === "Tarde") return ["T1"];
        if (regla.turnoPreferido === "M1 / M2") return ["M1", "M2"];
        if (regla.turnoPreferido === "M4 / M5") return ["M4", "M5"];
        if (regla.turnoPreferido === "T1 / T2") return ["T1", "T2"];
        if (obtenerCatalogoTurnosEmpleado(regla).some((item) => item.codigo === regla.turnoPreferido)) {
            return [regla.turnoPreferido];
        }
    }

    return ["M1"];
}

function ordenarCodigosTurno(codigoA, codigoB) {
    const grupoA = String(codigoA).match(/^[A-Za-z]+/)?.[0] || "";
    const grupoB = String(codigoB).match(/^[A-Za-z]+/)?.[0] || "";
    const numeroA = Number(String(codigoA).match(/\d+/)?.[0] || 0);
    const numeroB = Number(String(codigoB).match(/\d+/)?.[0] || 0);
    return grupoA.localeCompare(grupoB, "es") || numeroA - numeroB || String(codigoA).localeCompare(String(codigoB), "es");
}

function obtenerCatalogoTurnosEmpleado(regla) {
    const cache = cacheGeneracion?.catalogos;
    const clave = regla || SIN_REGLA;
    const guardado = cache?.get(clave);
    if (guardado) return guardado.lista;

    const personalizados = Array.isArray(regla?.reglasPersonalizadas) ? regla.reglasPersonalizadas : [];
    const vistos = new Set();
    const lista = [...catalogoTurnos, ...rolesPersonalizadosGuardados, ...personalizados].filter((turno) => {
        if (vistos.has(turno.codigo)) return false;
        vistos.add(turno.codigo);
        return true;
    });
    cache?.set(clave, { lista, intervalos: new Map() });
    return lista;
}

const SIN_REGLA = {};

function normalizarTurnosParaUnidad(unidad, turnos) {
    const grupos = obtenerGruposTurnosUnidad(unidad, {
        reglaResponsableUnidad4: true,
        reglaResponsableUnidad5: true
    });
    if (!grupos) return turnos;

    const reglasEmpleado = empleadoActivo.nombre ? reglasPorEmpleado[empleadoActivo.nombre] : {};
    const personalizados = Array.isArray(reglasEmpleado?.reglasPersonalizadas)
        ? reglasEmpleado.reglasPersonalizadas.map((turno) => turno.codigo)
        : [];
    const permitidos = new Set([...grupos.manana, ...grupos.tarde, ...personalizados, "Vacaciones"]);
    const compatibles = turnos.filter((turno) => permitidos.has(turno));
    if (compatibles.length) return compatibles;

    return [grupos.manana[0]];
}

function turnoPermitidoParaEmpleado(unidad, regla, turno, turnoActual = "") {
    if (["Descanso", "Libre", "Vacaciones"].includes(turno) || turno === turnoActual) return true;
    if (!turnoAsignableEnUnidad(unidad, turno)) return false;
    if (obtenerTurnosResponsabilidad(unidad, regla).includes(turno)) return true;
    if (diasPorRol.some((item) => item.codigo === turno && reglasPorEmpleado[item.empleado] === regla)) return true;
    // Los empleados de la unidad pueden cubrir cualquier turno configurado en ella.
    const grupos = obtenerGruposTurnosUnidad(unidad, regla);
    return Boolean(grupos && [...grupos.manana, ...grupos.tarde].includes(turno));
}

function turnoAsignableEnUnidad(unidad, turno) {
    if (["Descanso", "Libre", "Vacaciones"].includes(turno)) return true;
    const configuracion = obtenerConfiguracionUnidad(unidad);
    if (!configuracion || !Array.isArray(configuracion.turnos)) return true;
    return configuracion.turnos.includes(turno);
}

function obtenerTurnosResponsabilidad(unidad, regla) {
    const grupos = obtenerGruposTurnosUnidad(unidad, regla);
    const preferidos = obtenerTurnosPreferidos(regla);
    if (!grupos) return preferidos;

    const rolesPersonalizados = Array.isArray(regla?.reglasPersonalizadas)
        ? regla.reglasPersonalizadas
            .map((turno) => turno.codigo)
            .filter((codigo) => turnoAsignableEnUnidad(unidad, codigo))
        : [];
    const turnosPermitidos = new Set([...grupos.manana, ...grupos.tarde, ...rolesPersonalizados, "Vacaciones"]);
    const preferidosCompatibles = preferidos.filter((turno) => turnosPermitidos.has(turno));
    if (preferidosCompatibles.length) return preferidosCompatibles;

    return [...new Set([...preferidos, ...grupos.manana, ...grupos.tarde])]
        .filter((turno) => turnosPermitidos.has(turno));
}

function obtenerTurnoResponsabilidad(unidad, regla, fechaValor, indiceDia, indiceEmpleado) {
    const grupos = obtenerGruposTurnosUnidad(unidad, regla);
    const turnosAsignados = obtenerTurnosResponsabilidad(unidad, regla);
    const preferidosCompatibles = grupos
        ? obtenerTurnosPreferidos(regla).filter((turno) => turnosAsignados.includes(turno))
        : turnosAsignados;
    if (preferidosCompatibles.length) {
        return preferidosCompatibles[indiceDia % preferidosCompatibles.length];
    }
    if (!grupos) return null;

    const fecha = new Date(`${fechaValor}T00:00:00`);
    const primerDia = new Date(fecha.getFullYear(), 0, 1);
    const diasTranscurridos = Math.floor((fecha - primerDia) / 86400000);
    const semana = Math.floor((diasTranscurridos + primerDia.getDay()) / 7);
    const trabajaManana = (semana + indiceEmpleado) % 2 === 0;
    const grupo = trabajaManana ? grupos.manana : grupos.tarde;
    return grupo[(indiceDia + indiceEmpleado) % grupo.length];
}

function obtenerGruposTurnosUnidad(unidad, regla) {
    const configuracion = obtenerConfiguracionUnidad(unidad);
    if (Array.isArray(configuracion?.turnos)) {
        const manana = configuracion.turnos.filter((turno) => /^M|^CD|^RF/.test(turno));
        const tarde = configuracion.turnos.filter((turno) => /^T/.test(turno));
        return { manana, tarde };
    }

    if (unidadCoincide(unidad, 5) && regla.reglaResponsableUnidad5 !== false) {
        return {
            manana: ["M4", "M5", "M6"],
            tarde: ["T3", "T4"]
        };
    }

    if (unidadCoincide(unidad, 4) && regla.reglaResponsableUnidad4 !== false) {
        return {
            manana: ["M1", "M2", "M3"],
            tarde: ["T1", "T2"]
        };
    }

    return null;
}

function obtenerConfiguracionUnidad(unidad) {
    for (const unidadIndividual of obtenerUnidadesIndividuales(unidad)) {
        const texto = unidadIndividual.toLowerCase();
        const entrada = Object.entries(configuracionUnidades).find(([nombre]) => {
            const clave = nombre.toLowerCase();
            const numero = clave.match(/\d+/)?.[0];
            return clave === texto || (numero && unidadCoincide(unidadIndividual, numero));
        });
        if (entrada) return entrada[1];
    }
    return null;
}

function obtenerUnidadesIndividuales(unidad) {
    return String(unidad || "")
        .split(/[,;]+/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function obtenerUnidadAsignada(regla, porDefecto = "Sin unidad") {
    const total = String(regla?.rotacionUnidades || "").trim();
    const activa = obtenerUnidadesIndividuales(total).find((unidad) => unidadesSonIguales(unidad, regla?.unidadActiva));
    return activa || total || porDefecto;
}

function obtenerColorUnidad(unidad, colorIndividual) {
    const configuracion = obtenerConfiguracionUnidad(unidad);
    return normalizarColor(configuracion?.color || colorIndividual);
}

function obtenerDatosTurno(codigo) {
    const asignacion = asignacionesActuales.find((item) => item.turnos.includes(codigo));
    const datosTurno = obtenerCatalogoTurnosEmpleado(asignacion?.regla || {}).find((item) => item.codigo === codigo);
    if (!datosTurno) return null;
    return datosTurno;
}

function unidadCoincide(unidad, numero) {
    return obtenerUnidadesIndividuales(unidad).some((unidadIndividual) => {
        const texto = unidadIndividual.trim();
        return texto === String(numero) || new RegExp(`^(?:unidad|u)\\s*${numero}$`, "i").test(texto);
    });
}

function expandirTurnosAgrupados(turnos) {
    const turnosExpandidos = [];
    const equivalencias = {
        "M1 / M2": ["M1", "M2"],
        "M4 / M5": ["M4", "M5"],
        "T1 / T2": ["T1", "T2"]
    };

    turnos.forEach((turno) => {
        const equivalentes = equivalencias[turno] || [turno];
        equivalentes.forEach((equivalente) => {
            if (!turnosExpandidos.includes(equivalente)) turnosExpandidos.push(equivalente);
        });
    });

    return turnosExpandidos;
}

function obtenerFechaDia(indiceDia) {
    const fecha = new Date();
    const diaActual = fecha.getDay() === 0 ? 6 : fecha.getDay() - 1;
    fecha.setDate(fecha.getDate() + indiceDia - diaActual);
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function prepararTurnosIndividuales() {
    const selector = document.getElementById("empleadoIndividual");
    if (!selector) return;
    const seleccionado = selector.value;
    selector.innerHTML = "";
    const nombres = asignacionesActuales.map((asignacion) => asignacion.empleado).sort((a, b) => a.localeCompare(b, "es"));
    nombres.forEach((nombre) => {
        const opcion = document.createElement("option");
        opcion.value = nombre;
        opcion.textContent = nombre;
        selector.appendChild(opcion);
    });
    if (nombres.includes(seleccionado)) selector.value = seleccionado;

    const inicio = document.getElementById("fechaInicioIndividual");
    const fin = document.getElementById("fechaFinIndividual");
    const primera = fechasPeriodoActual[0]?.valor || "";
    const ultima = fechasPeriodoActual[fechasPeriodoActual.length - 1]?.valor || "";
    [inicio, fin].forEach((campo) => {
        if (!campo) return;
        campo.min = primera;
        campo.max = ultima;
    });
    if (inicio && (!inicio.value || inicio.value < primera || inicio.value > ultima)) inicio.value = primera;
    if (fin && (!fin.value || fin.value < primera || fin.value > ultima)) fin.value = ultima;
}

function mostrarTurnosIndividuales() {
    const resultado = document.getElementById("resultadoIndividual");
    const empleado = document.getElementById("empleadoIndividual")?.value;
    const inicio = document.getElementById("fechaInicioIndividual")?.value;
    const fin = document.getElementById("fechaFinIndividual")?.value;
    if (!resultado) return;
    resultado.innerHTML = "";

    if (!empleado || !inicio || !fin) {
        resultado.textContent = "Selecciona un empleado y un periodo.";
        return;
    }
    if (fin < inicio) {
        resultado.textContent = "La fecha final no puede ser anterior a la fecha inicial.";
        return;
    }

    const asignacion = asignacionesActuales.find((item) => item.empleado === empleado);
    if (!asignacion) {
        resultado.textContent = "Genera primero el cuadrante para ver los turnos de un empleado.";
        return;
    }

    const catalogo = obtenerCatalogoTurnosEmpleado(asignacion.regla);
    const indices = fechasPeriodoActual
        .map((fecha, indice) => (fecha.valor >= inicio && fecha.valor <= fin ? indice : -1))
        .filter((indice) => indice >= 0);
    if (!indices.length) {
        resultado.textContent = "El periodo elegido queda fuera del cuadrante generado.";
        return;
    }

    const diaSemana = (valor) => (new Date(`${valor}T00:00:00`).getDay() + 6) % 7;
    const tabla = document.createElement("table");
    tabla.className = "calendario-individual";
    tabla.innerHTML = `<thead><tr>${["Lun", "Mar", "Mi\u00e9", "Jue", "Vie", "S\u00e1b", "Dom"].map((dia) => `<th>${dia}</th>`).join("")}</tr></thead>`;
    const cuerpo = document.createElement("tbody");
    let fila = null;
    let diasTrabajados = 0;
    let minutos = 0;

    indices.forEach((indice, posicion) => {
        const fecha = fechasPeriodoActual[indice];
        const columna = diaSemana(fecha.valor);
        if (!fila || (columna === 0 && posicion > 0)) {
            fila = document.createElement("tr");
            for (let vacias = 0; vacias < (posicion === 0 ? columna : 0); vacias++) fila.appendChild(document.createElement("td"));
            cuerpo.appendChild(fila);
        }

        const turno = asignacion.turnos[indice];
        const datos = catalogo.find((item) => item.codigo === turno);
        const horario = horariosManualesTurnos[claveCambioTurno(empleado, fecha.valor)] || datos?.horario || "";
        const intervalo = obtenerIntervaloTurno(turno, asignacion.regla, 0);
        if (datos && turno !== "Vacaciones") diasTrabajados++;
        if (intervalo) minutos += intervalo.fin - intervalo.inicio;

        const celda = document.createElement("td");
        const numero = document.createElement("small");
        numero.textContent = fecha.valor.slice(8) + "/" + fecha.valor.slice(5, 7);
        const codigo = document.createElement("strong");
        codigo.textContent = turno;
        celda.append(numero, codigo);
        if (horario) {
            const detalle = document.createElement("small");
            detalle.textContent = horario;
            celda.appendChild(detalle);
        }
        fila.appendChild(celda);
    });
    tabla.appendChild(cuerpo);

    const resumen = document.createElement("p");
    resumen.className = "resumen-grupo-turnos";
    resumen.textContent = `${empleado} \u00b7 ${asignacion.unidad} \u00b7 ${diasTrabajados} d\u00edas trabajados \u00b7 ${(minutos / 60).toFixed(1)} h`;
    const contenedor = document.createElement("div");
    contenedor.className = "tabla-contenedor";
    contenedor.appendChild(tabla);
    resultado.append(resumen, contenedor);
}

function imprimirTurnosIndividuales() {
    mostrarTurnosIndividuales();
    if (!document.querySelector("#resultadoIndividual .calendario-individual")) return;
    document.body.classList.add("imprimiendo-individual");
    window.addEventListener("afterprint", () => document.body.classList.remove("imprimiendo-individual"), { once: true });
    window.print();
}

document.getElementById("botonMostrarIndividual")?.addEventListener("click", mostrarTurnosIndividuales);
document.getElementById("botonImprimirIndividual")?.addEventListener("click", imprimirTurnosIndividuales);

function obtenerFechasPeriodo(fechaInicio, fechaFin) {
    const fechas = [];
    const inicio = new Date(`${fechaInicio}T00:00:00`);
    const fin = new Date(`${fechaFin}T00:00:00`);

    for (const fecha = new Date(inicio); fecha <= fin; fecha.setDate(fecha.getDate() + 1)) {
        fechas.push({
            valor: convertirFechaLocal(fecha),
            nombre: fecha.toLocaleDateString("es-ES", { weekday: "long" }),
            etiqueta: fecha.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "2-digit" })
        });
    }

    return fechas;
}

function convertirFechaLocal(fecha) {
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${fecha.getFullYear()}-${mes}-${dia}`;
}

let fechasPeriodoManuales = false;

// Si el usuario no ha elegido fechas propias (o están vacías o son inválidas), se sitúan en la semana del calendario actual.
function sincronizarFechasConCalendario() {
    if (!fechaInicioTurnos || !fechaFinTurnos) return;
    const incompletas = !fechaInicioTurnos.value || !fechaFinTurnos.value || fechaFinTurnos.value < fechaInicioTurnos.value;
    if (fechasPeriodoManuales && !incompletas) return;
    establecerPeriodoActual();
}

// El período arranca en la fecha de hoy y cubre 7 días.
function establecerPeriodoActual() {
    if (!fechaInicioTurnos || !fechaFinTurnos) return;
    const hoy = new Date();
    const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 6);
    fechaInicioTurnos.value = convertirFechaLocal(hoy);
    fechaFinTurnos.value = convertirFechaLocal(fin);
    fechasPeriodoManuales = false;
}

// Evita que el navegador restaure fechas antiguas al recargar o volver a la pestaña.
window.addEventListener("pageshow", () => {
    if (!fechasPeriodoManuales) establecerPeriodoActual();
});
document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !fechasPeriodoManuales) establecerPeriodoActual();
});

function generarTurnosDesdeBoton() {
    sincronizarFechasConCalendario();
    generarTurnos();
}

function obtenerFechaInicioSemana() {
    const fecha = new Date();
    const diaActual = fecha.getDay() === 0 ? 6 : fecha.getDay() - 1;
    fecha.setDate(fecha.getDate() - diaActual);
    return convertirFechaLocal(fecha);
}

function obtenerFechaFinSemana() {
    const fecha = new Date(`${obtenerFechaInicioSemana()}T00:00:00`);
    fecha.setDate(fecha.getDate() + 6);
    return convertirFechaLocal(fecha);
}

function normalizarColor(color) {
    return /^#[0-9a-f]{6}$/i.test(color || "") ? color : COLOR_UNIDAD_PREDETERMINADO;
}

function inicializarValores() {
    if (fechaInicioTurnos) fechaInicioTurnos.autocomplete = "off";
    if (fechaFinTurnos) fechaFinTurnos.autocomplete = "off";
    establecerPeriodoActual();
    renderizarConfiguracionUnidades();
    actualizarSelectorUnidades();
    mostrarEmpleados();
}

inicializarValores();
