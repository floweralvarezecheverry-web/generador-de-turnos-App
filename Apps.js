const STORAGE_KEY = "empleadosTurnos";
const STORAGE_RULES_KEY = "reglasTurnos";
const STORAGE_UNIDADES_KEY = "unidadesTurnos";
const STORAGE_MANUALES_KEY = "cambiosTurnosManuales";
const STORAGE_UNIDADES_CONFIG_KEY = "configuracionUnidadesTurnos";
const STORAGE_ORDEN_CUADROS_KEY = "ordenCuadrosTurnos";
const STORAGE_ROLES_PERSONALIZADOS_KEY = "rolesPersonalizadosTurnos";
const STORAGE_HORARIOS_MANUALES_KEY = "horariosManualesTurnos";
const STORAGE_DETALLES_CAMBIOS_KEY = "detallesCambiosTurnos";
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
let rolesPersonalizadosGuardados = cargarRolesPersonalizadosGuardados();
let horariosManualesTurnos = cargarHorariosManualesGuardados();
let detallesCambiosManuales = cargarDetallesCambiosManuales();
let empleadoActivo = { nombre: null };
let asignacionesActuales = [];
let fechasPeriodoActual = [];
let cambioTurnoActivo = null;
let arrastreTurno = null;
let avisosCobertura = new Map();
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
const unidadQuitar = document.getElementById("unidadQuitar");
const quitarUnidadBoton = document.getElementById("quitarUnidadBoton");
const unidadCuadro = document.getElementById("unidadCuadro");
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
const COLOR_UNIDAD_PREDETERMINADO = "#2563eb";
const RESPONSABILIDADES_POR_CARGO = {
    Coordinador: ["Organizar la actividad del equipo", "Supervisar cobertura y unidades", "Resolver incidencias operativas"],
    Auxiliar: ["Apoyar la atención y las tareas asignadas", "Preparar materiales y espacios", "Informar de incidencias al responsable"],
    Limpieza: ["Mantener la higiene de espacios y materiales", "Reponer productos de limpieza", "Comunicar incidencias de mantenimiento"],
    Enfermero: ["Realizar cuidados y seguimiento sanitario", "Registrar la atención prestada", "Comunicar cambios clínicos"],
    Médico: ["Valorar y planificar la atención médica", "Registrar diagnósticos e indicaciones", "Coordinar decisiones clínicas"],
    Otros: ["Definir responsabilidades específicas del puesto", "Cumplir las tareas asignadas", "Comunicar incidencias al responsable"]
};

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
    botonGenerar.addEventListener("click", generarTurnos);
}

if (botonGenerarPeriodo) {
    botonGenerarPeriodo.addEventListener("click", generarTurnos);
}

if (botonActualizarCuadro) {
    botonActualizarCuadro.addEventListener("click", generarTurnos);
}

if (guardarConfiguracionUnidadesBoton) {
    guardarConfiguracionUnidadesBoton.addEventListener("click", guardarConfiguracionUnidades);
}

if (agregarUnidadBoton) {
    agregarUnidadBoton.addEventListener("click", agregarNuevaUnidad);
}

if (quitarUnidadBoton) {
    quitarUnidadBoton.addEventListener("click", quitarUnidadConfigurada);
}

if (archivoExcel) {
    archivoExcel.addEventListener("change", manejarArchivoExcel);
}

if (botonTodosEmpleados) {
    botonTodosEmpleados.addEventListener("click", alternarTodosLosEmpleados);
}

if (buscadorEmpleados) {
    buscadorEmpleados.addEventListener("input", mostrarEmpleados);
}

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
}

if (cerrarModalCambioTurno) {
    cerrarModalCambioTurno.addEventListener("click", cerrarEditorCambioTurno);
}

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
    botonImprimirCuadro.addEventListener("click", () => window.print());
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

function construirDescripcionCambioManual(detalle) {
    if (!detalle) return "";
    const partes = [];
    if (detalle.turnoAnterior) partes.push(`Turno anterior: ${detalle.turnoAnterior}`);
    if (detalle.unidadAnterior) partes.push(`Unidad anterior: ${detalle.unidadAnterior}`);
    if (detalle.observacion) partes.push(`Motivo: ${detalle.observacion}`);
    if (detalle.ordenadoPor) partes.push(`Ordenado por: ${detalle.ordenadoPor}`);
    return partes.join(" · ");
}

function cargarOrdenCuadros() {
    const guardado = localStorage.getItem(STORAGE_ORDEN_CUADROS_KEY);
    const ordenPredeterminado = ["mañanas", "tardes", "noches", "otros"];
    if (!guardado) return ordenPredeterminado;

    try {
        const orden = JSON.parse(guardado);
        return Array.isArray(orden) ? [...new Set([...orden, ...ordenPredeterminado])] : ordenPredeterminado;
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
    localStorage.setItem(STORAGE_UNIDADES_CONFIG_KEY, JSON.stringify(configuracionUnidades));
    renderizarConfiguracionUnidades();
    actualizarSelectorUnidades();
    mostrarEmpleados();
    alert("Configuración de unidades guardada");
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
    if (!unidadQuitar) return;

    const unidad = unidadQuitar.value;
    if (!unidad) {
        alert("No hay unidades para quitar");
        return;
    }

    if (!window.confirm(`¿Quieres quitar la unidad ${unidad}? Los empleados que la tengan asignada quedarán sin esa unidad.`)) return;

    const clave = Object.keys(configuracionUnidades).find((item) => unidadesSonIguales(item, unidad));
    if (clave) delete configuracionUnidades[clave];
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
    actualizarSelectorUnidadQuitar();
    mostrarEmpleados();
    alert(`Unidad ${unidad} eliminada`);
}

function actualizarSelectorUnidadQuitar() {
    if (!unidadQuitar) return;
    const valor = unidadQuitar.value;
    unidadQuitar.innerHTML = "";
    const unidades = ordenarUnidades(Object.keys(configuracionUnidades), (unidad) => unidad);
    unidades.forEach((unidad) => {
        const opcion = document.createElement("option");
        opcion.value = unidad;
        opcion.textContent = unidad;
        unidadQuitar.appendChild(opcion);
    });
    if (!unidades.length) {
        const opcion = document.createElement("option");
        opcion.value = "";
        opcion.textContent = "No hay unidades configuradas";
        unidadQuitar.appendChild(opcion);
    }
    const opcionSeleccionada = Array.from(unidadQuitar.options).find((opcion) => opcion.value === valor);
    if (opcionSeleccionada) unidadQuitar.value = valor;
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
        catalogoTurnos.filter((turno) => turno.codigo !== "Vacaciones").forEach((turno) => {
            const label = document.createElement("label");
            label.className = "check-inline";
            label.innerHTML = `<input type="checkbox" data-config-turno value="${turno.codigo}"> ${turno.codigo}`;
            label.querySelector("input").checked = configuracion.turnos.includes(turno.codigo);
            turnos.appendChild(label);
        });
        bloque.appendChild(turnos);
        configuracionUnidadesElemento.appendChild(bloque);
    });
    actualizarSelectorUnidadQuitar();
    renderizarPuestosUnidades();
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
    if (!unidadCuadro) return;
    const valor = unidadCuadro.value || "todas";
    unidadCuadro.innerHTML = '<option value="todas">Todas las unidades</option>';
    const unidades = obtenerUnidadesConfiguradasUnicas();
    ordenarUnidades(unidades, (unidad) => unidad).forEach((unidad) => {
        const opcion = document.createElement("option");
        opcion.value = unidad;
        opcion.textContent = unidad;
        unidadCuadro.appendChild(opcion);
    });
    const opcionSeleccionada = Array.from(unidadCuadro.options).find((opcion) => unidadesSonIguales(opcion.value, valor));
    unidadCuadro.value = opcionSeleccionada ? opcionSeleccionada.value : "todas";
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
    if (!listaEmpleados) return;

    listaEmpleados.innerHTML = "";
    const textoBusqueda = buscadorEmpleados?.value.trim().toLocaleLowerCase("es-ES") || "";
    const empleadosFiltrados = empleados.filter((nombre) => {
        const unidad = reglasPorEmpleado[nombre]?.rotacionUnidades || "";
        return `${nombre} ${unidad}`.toLocaleLowerCase("es-ES").includes(textoBusqueda);
    });

    empleadosFiltrados.sort((nombreA, nombreB) => compararEmpleados(nombreA, nombreB, ordenEmpleadosActual));

    empleadosFiltrados.forEach((nombre) => {
        const regla = reglasPorEmpleado[nombre] || {};
        const item = document.createElement("div");
        item.className = "empleado-item" + (empleadoActivo.nombre === nombre ? " activo" : "");
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
        .map((input) => input.value);
    if (!turnosPreferidos.length) {
        alert("Selecciona al menos un turno preferido");
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
    abrirModalEmpleado(empleado);
    alert("Cambios guardados correctamente");
}

function esRolPersonalizado(codigo) {
    return rolesPersonalizadosGuardados.some((rol) => rol.codigo === codigo);
}

function eliminarRolPersonalizado(codigo, empleadoActual) {
    const rol = rolesPersonalizadosGuardados.find((item) => item.codigo === codigo);
    if (!rol || !window.confirm(`¿Quieres eliminar el rol ${codigo} de toda la aplicación?`)) return;

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
    renderizarReglasEmpleadoModal(empleadoActual);
}

function eliminarHorarioTrabajo(horario, empleadoActual) {
    const rolesHorario = rolesPersonalizadosGuardados.filter((rol) => rol.horario === horario);
    if (!rolesHorario.length || !window.confirm(`¿Quieres eliminar el horario ${horario} y sus roles personalizados?`)) return;
    const codigos = new Set(rolesHorario.map((rol) => rol.codigo));
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
    guardarReglas();
    renderizarReglasEmpleadoModal(nombre);
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

    const filtroUnidad = unidadCuadro?.value || "todas";
    const empleadosActivos = empleados.filter((empleado) => {
        const regla = reglasPorEmpleado[empleado] || {};
        const unidad = obtenerUnidadAsignada(regla);
        return regla.participaRotacion !== false && (filtroUnidad === "todas" || unidadesSonIguales(unidad, filtroUnidad));
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
    const asignaciones = construirAsignaciones(empleadosActivos, fechasPeriodo);

    asignacionesActuales = asignaciones;
    prepararTurnosIndividuales();
    actualizarResumenCuadro(asignaciones, fechasPeriodo, filtroUnidad);

    ordenCuadros.forEach((grupo) => {
        if (grupo !== "tardes") {
            renderizarCuadroGrupo(grupo, asignaciones, fechasPeriodo);
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
            const turnosEmpleado = obtenerTurnosResponsabilidad(unidadEmpleado, regla);
            const turnosProgramables = turnosEmpleado.filter((turno) => turno !== "Vacaciones");
            const turnosOriginalesPorFecha = [];
            let diasConsecutivos = 0;

            for (let indiceDia = 0; indiceDia < fechasPeriodo.length; indiceDia++) {
                const fechaDia = fechasPeriodo[indiceDia].valor;
                const estaDeVacaciones = regla.vacacionesInicio && regla.vacacionesFin &&
                    fechaDia >= regla.vacacionesInicio && fechaDia <= regla.vacacionesFin;
                let turno = obtenerTurnoResponsabilidad(unidadEmpleado, regla, fechasPeriodo[indiceDia].valor, indiceDia, indiceEmpleado);
                if (!turno) {
                    turno = (turnosProgramables.length ? turnosProgramables : turnosEmpleado)[indiceDia % (turnosProgramables.length || turnosEmpleado.length)];
                }

                if (estaDeVacaciones && turnosEmpleado.includes("Vacaciones") && reglasGenerales.vacacionesImpidenTurno.activa) {
                    turno = "Vacaciones";
                } else if (regla.diasLibre && regla.diasLibre.includes(fechasPeriodo[indiceDia].nombre) && regla.descanso !== false) {
                    turno = "Descanso";
                } else if (regla.descanso !== false && regla.maxTurnos && diasConsecutivos >= Math.max(1, Number(regla.maxTurnos))) {
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
            aplicarReglasDescanso(turnosOriginalesPorFecha, regla, limiteHoras, fechasPeriodo, porcentaje);
            const registro = { empleado, unidad, regla, porcentaje, limiteHoras, turnosOriginalesPorFecha, unidadesPorDia: {} };
            registrosUnidad.push(registro);
            todosRegistros.push(registro);
            indiceEmpleado += 1;
        });
        registrosPorUnidad.push([unidad, registrosUnidad]);
    });

    registrosPorUnidad.forEach(([unidad, registrosUnidad]) => {
        aplicarPuestosRequeridos(unidad, registrosUnidad, todosRegistros, fechasPeriodo);
    });

    todosRegistros.forEach(({ empleado, unidad, regla, porcentaje, limiteHoras, turnosOriginalesPorFecha, unidadesPorDia }) => {
        {
            const turnosPorFecha = [];
            turnosOriginalesPorFecha.forEach((turnoOriginal, indiceDia) => {
                const cambioManual = cambiosTurnosManuales[claveCambioTurno(empleado, fechasPeriodo[indiceDia].valor)];
                const vacacionesProtegidas = reglasGenerales.vacacionesImpidenTurno.activa && turnoOriginal === "Vacaciones";
                turnosPorFecha.push(cambioManual && !vacacionesProtegidas ? cambioManual : turnoOriginal);
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

function aplicarPuestosRequeridos(unidad, registros, todosRegistros, fechasPeriodo) {
    const puestos = obtenerConfiguracionUnidad(unidad)?.puestos;
    if (!puestos || !registros.length) return;
    const limite = (valor) => (valor === null || valor === undefined || valor === "" || !Number.isFinite(Number(valor)) ? null : Math.max(0, Number(valor)));
    const maxManana = limite(puestos.manana);
    const maxTarde = limite(puestos.tarde);
    const minDescanso = limite(puestos.descanso);
    if (maxManana === null && maxTarde === null && minDescanso === null) return;
    const maximos = { "mañanas": maxManana, tardes: maxTarde };

    fechasPeriodo.forEach((_, dia) => {
        const turnoDia = (registro) => registro.turnosOriginalesPorFecha[dia];
        const trabajaEn = (registro) => registro.unidadesPorDia[dia] || registro.unidad;
        const delGrupo = (grupo) => todosRegistros.filter((registro) => trabajaEn(registro) === unidad && clasificarTurno(turnoDia(registro)) === grupo);
        // Rota el orden cada día para repartir los descansos entre el equipo.
        const rotar = (lista) => lista.map((_, indice) => lista[(indice + dia) % lista.length]);

        ["mañanas", "tardes"].forEach((grupo) => {
            const maximo = maximos[grupo];
            if (maximo === null) return;
            rotar(delGrupo(grupo)).slice(maximo).forEach((registro) => {
                registro.turnosOriginalesPorFecha[dia] = "Descanso";
                delete registro.unidadesPorDia[dia];
            });

            let faltan = maximo - delGrupo(grupo).length;
            if (faltan <= 0) return;
            const usados = new Map();
            delGrupo(grupo).forEach((registro) => usados.set(turnoDia(registro), (usados.get(turnoDia(registro)) || 0) + 1));
            const candidatos = todosRegistros
                .filter((registro) => ["Descanso", "Libre"].includes(turnoDia(registro)) && !registro.unidadesPorDia[dia])
                .filter((registro) => !(registro.regla.descanso !== false && registro.regla.diasLibre?.includes(fechasPeriodo[dia].nombre)))
                .map((registro) => ({ registro, nivel: nivelCobertura(registro, unidad), horas: calcularHorasTurnos(registro.turnosOriginalesPorFecha, registro.regla) }))
                .sort((a, b) => a.nivel - b.nivel || a.horas - b.horas);
            for (const { registro } of candidatos) {
                if (faltan <= 0) break;
                const turno = elegirTurnoCobertura(registro, unidad, grupo, usados);
                if (turno && intentarAsignarCobertura(registro, dia, turno, unidad, fechasPeriodo)) {
                    usados.set(turno, (usados.get(turno) || 0) + 1);
                    faltan -= 1;
                }
            }
            if (faltan > 0) {
                const clave = `${unidad} (${grupo === "mañanas" ? "mañana" : "tarde"})`;
                avisosCobertura.set(clave, (avisosCobertura.get(clave) || 0) + 1);
            }
        });

        if (minDescanso === null) return;
        let descansando = registros.filter((registro) => ["Descanso", "Libre"].includes(turnoDia(registro))).length;
        while (descansando < minDescanso) {
            const manana = delGrupo("mañanas");
            const tarde = delGrupo("tardes");
            const origen = manana.length >= tarde.length ? manana : tarde;
            if (!origen.length) break;
            const elegido = rotar(origen)[0];
            elegido.turnosOriginalesPorFecha[dia] = "Descanso";
            delete elegido.unidadesPorDia[dia];
            descansando += 1;
        }
    });
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
    if (!opciones.length) return null;
    return opciones.slice().sort((a, b) => (usados.get(a) || 0) - (usados.get(b) || 0))[0];
}

function intentarAsignarCobertura(registro, dia, turno, unidad, fechasPeriodo) {
    const original = registro.turnosOriginalesPorFecha;
    const previo = original[dia];
    const normalizar = (turnos) => {
        const copia = [...turnos];
        aplicarReglasDescanso(copia, registro.regla, registro.limiteHoras, fechasPeriodo, registro.porcentaje);
        return copia;
    };
    const base = normalizar(original);

    original[dia] = turno;
    const resultado = normalizar(original);
    // Los d\u00edas posteriores a\u00fan no revisados pueden pasar a descanso; los anteriores no deben cambiar.
    const sinConflicto = resultado.every((valor, indice) => {
        if (indice === dia) return valor === turno;
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
    const gruposMostrados = grupo === "mañanas" ? ["mañanas", "tardes"] : [grupo];
    const tieneVacanteEnGrupo = (asignacion) => (asignacion.turnosOriginales || []).some((turnoOriginal, indice) => {
        if (!gruposMostrados.includes(clasificarTurno(turnoOriginal))) return false;
        const claveDia = claveCambioTurno(asignacion.empleado, fechasPeriodo[indice]?.valor);
        return Boolean(detallesCambiosManuales[claveDia]);
    });
    const asignacionesGrupo = asignaciones.filter((asignacion) => {
        return asignacion.turnos.some((turno) => gruposMostrados.includes(clasificarTurno(turno))) || tieneVacanteEnGrupo(asignacion);
    });
    if (!asignacionesGrupo.length && grupo === "otros") return;

    const nombresGrupo = {
        mañanas: "☀️ / 🌇 Turnos por unidad",
        tardes: "🌇 Tardes",
        noches: "🌙 Noches",
        otros: "🗒️ Otros turnos"
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
            celdaGrupoTurno.textContent = grupoMostrado === "mañanas" ? "Mañanas" : "Tardes";
            filaGrupoTurno.appendChild(celdaGrupoTurno);
            cuerpo.appendChild(filaGrupoTurno);

            empleadosTurno.forEach((asignacion) => {
            const fila = document.createElement("tr");
            const empleado = document.createElement("td");
            empleado.textContent = asignacion.empleado;
            fila.appendChild(empleado);
            asignacion.turnos.forEach((turno, indiceFecha) => {
                const celda = document.createElement("td");
                celda.className = "celda-turno-editable";
                celda.dataset.empleado = asignacion.empleado;
                celda.dataset.fecha = fechasPeriodo[indiceFecha].valor;
                celda.title = "Pulsa para cambiar este turno y ver sugerencias";

                const claveDia = claveCambioTurno(asignacion.empleado, fechasPeriodo[indiceFecha].valor);
                const detalleCambio = detallesCambiosManuales[claveDia];
                const turnoOriginalDia = asignacion.turnosOriginales?.[indiceFecha];
                const descripcionCambio = construirDescripcionCambioManual(detalleCambio);

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
                        const unidadPrestada = asignacion.unidadesPorDia?.[indiceFecha];
                        if (unidadPrestada) {
                            const apoyo = document.createElement("small");
                            apoyo.className = "jornada-parcial-cuadrante";
                            apoyo.textContent = `Apoyo: ${unidadPrestada}`;
                            celda.appendChild(apoyo);
                        }
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
                        celda.title = `${celda.title} · ${descripcionCambio}`;
                        const nota = document.createElement("small");
                        nota.className = "nota-cambio-manual";
                        nota.textContent = descripcionCambio;
                        celda.appendChild(nota);
                    }
                } else if (detalleCambio && turnoOriginalDia && clasificarTurno(turnoOriginalDia) === grupoMostrado) {
                    celda.classList.add("celda-vacante-observada");
                    celda.title = `Vacante por cambio de rol · ${descripcionCambio}`;
                    const marcador = document.createElement("strong");
                    marcador.className = "marcador-vacante";
                    marcador.textContent = "Vacante";
                    celda.appendChild(marcador);
                    const nota = document.createElement("small");
                    nota.className = "nota-cambio-manual";
                    nota.textContent = descripcionCambio;
                    celda.appendChild(nota);
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
        event.dataTransfer.effectAllowed = "move";
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
        event.dataTransfer.dropEffect = "move";
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
    cambiosTurnosManuales[claveCambioTurno(origen.empleado, origen.fecha)] = turnoB;
    cambiosTurnosManuales[claveCambioTurno(destino.empleado, destino.fecha)] = turnoA;
    guardarCambiosManuales();

    const posiciones = new Map();
    cuadrosTurnos.querySelectorAll(".bloque-turnos").forEach((bloque) => {
        posiciones.set(bloque.dataset.grupoTurnos, bloque.querySelector(".ventana-carrusel")?.scrollLeft || 0);
    });
    generarTurnos();
    cuadrosTurnos.querySelectorAll(".bloque-turnos").forEach((bloque) => {
        bloque.querySelector(".ventana-carrusel")?.scrollTo({ left: posiciones.get(bloque.dataset.grupoTurnos) || 0, behavior: "instant" });
    });
}

function soltarCuadro(event) {
    event.preventDefault();
    if (arrastreTurno) {
        const origen = arrastreTurno;
        const celda = event.target.closest(".celda-turno-editable");
        arrastreTurno = null;
        if (celda) intercambiarTurnos(origen, { empleado: celda.dataset.empleado, fecha: celda.dataset.fecha });
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

    [...catalogoTurnos.map((turno) => turno.codigo), "Descanso", "Libre"].forEach((turno) => {
        const opcion = document.createElement("option");
        opcion.value = turno;
        opcion.textContent = turno;
        opcion.selected = turno === asignacion.turnos[indiceFecha];
        nuevoTurnoIndividual.appendChild(opcion);
    });

    if (unidadCambioTurno) {
        unidadCambioTurno.innerHTML = "";
        obtenerUnidadesTrabajoDisponibles(asignacion.unidad).forEach((unidad) => {
            const opcion = document.createElement("option");
            opcion.value = unidad;
            opcion.textContent = unidad;
            opcion.selected = unidadesSonIguales(unidad, asignacion.unidad);
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
    const datos = obtenerCatalogoTurnosEmpleado(regla).find((item) => item.codigo === turno);
    const m = datos?.horario?.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!m) return null;
    const inicio = dia * 1440 + Number(m[1]) * 60 + Number(m[2]);
    let fin = dia * 1440 + Number(m[3]) * 60 + Number(m[4]);
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

function aplicarReglasDescanso(turnos, regla, limiteHoras, fechasPeriodo, porcentaje) {
    const { descansoEntreTurnos, descansoSemanal, maxHorasAnuales, maxHorasSemanales, maxHorasMensuales } = reglasGenerales;

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
        for (let inicio = 0; inicio + 7 <= turnos.length; inicio += 7) {
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

                let candidato = -1;
                for (let dia = inicio + 6; dia >= inicio; dia--) {
                    if (obtenerIntervaloTurno(turnos[dia], regla, dia)) { candidato = dia; break; }
                }
                if (candidato < 0) break;
                turnos[candidato] = "Descanso";
            }
        }
    }

    const horasEnDias = (indices) => indices.reduce((total, dia) => {
        const intervalo = obtenerIntervaloTurno(turnos[dia], regla, dia);
        return total + (intervalo ? intervalo.fin - intervalo.inicio : 0);
    }, 0) / 60;
    // Quita un día trabajado por bloque de 7 días, de forma rotatoria, hasta cumplir el límite.
    const recortarHoras = (indices, limite) => {
        for (let ronda = 0; horasEnDias(indices) > limite && ronda < indices.length; ronda++) {
            for (let inicio = 0; inicio < indices.length; inicio += 7) {
                if (horasEnDias(indices) <= limite) break;
                const bloque = indices.slice(inicio, inicio + 7);
                for (let k = bloque.length - 1 - ronda; k >= 0; k--) {
                    if (obtenerIntervaloTurno(turnos[bloque[k]], regla, bloque[k])) { turnos[bloque[k]] = "Descanso"; break; }
                }
            }
        }
    };
    const proporcion = (porcentaje ?? 100) / 100;

    if (maxHorasSemanales.activa) {
        for (let inicio = 0; inicio + 7 <= turnos.length; inicio += 7) {
            recortarHoras(Array.from({ length: 7 }, (_, k) => inicio + k), maxHorasSemanales.valor * proporcion);
        }
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
    const datos = catalogoTurnos.find((item) => item.codigo === turno);
    if (!datos || !datos.horario.includes("-")) return "";
    return datos.horario.split("-")[1].trim();
}

function guardarCambioTurnoIndividual() {
    if (!cambioTurnoActivo || !nuevoTurnoIndividual) return;
    const { empleado, fecha, indiceFecha } = cambioTurnoActivo;
    const asignacion = asignacionesActuales.find((item) => item.empleado === empleado);
    const turnoAnterior = asignacion?.turnos[indiceFecha] || "";
    const unidadAnterior = asignacion?.unidad || "";

    const unidadSeleccionada = unidadCambioTurno?.value.trim();
    if (reglasGenerales.respetarPuesto.activa && asignacion) {
        const unidadDestino = unidadSeleccionada || asignacion.unidad;
        if (!turnoPermitidoParaEmpleado(unidadDestino, asignacion.regla, nuevoTurnoIndividual.value, turnoAnterior)) {
            alert(`El turno ${nuevoTurnoIndividual.value} no corresponde al puesto/cualificación de ${empleado}. Puedes desactivar la regla en Configuración de reglas.`);
            return;
        }
    }

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

    if (unidadSeleccionada && asignacion && !unidadesSonIguales(unidadSeleccionada, asignacion.unidad)) {
        reglasPorEmpleado[empleado] = {
            ...reglasPorEmpleado[empleado],
            rotacionUnidades: unidadSeleccionada
        };
        guardarReglas();
    }

    const claveDetalle = claveCambioTurno(empleado, fecha);
    const observacion = observacionCambioTurno?.value.trim() || "";
    const ordenadoPor = ordenadoPorCambioTurno?.value.trim() || "";
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

function obtenerTurnosPreferidos(regla) {
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
    const personalizados = Array.isArray(regla?.reglasPersonalizadas) ? regla.reglasPersonalizadas : [];
    const catalogo = [...catalogoTurnos, ...rolesPersonalizadosGuardados, ...personalizados];
    return catalogo.filter((turno, indice, lista) => {
        return lista.findIndex((item) => item.codigo === turno.codigo) === indice;
    });
}

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
    if (obtenerTurnosResponsabilidad(unidad, regla).includes(turno)) return true;
    // Los empleados de la unidad pueden cubrir cualquier turno configurado en ella.
    const grupos = obtenerGruposTurnosUnidad(unidad, regla);
    return Boolean(grupos && [...grupos.manana, ...grupos.tarde].includes(turno));
}

function obtenerTurnosResponsabilidad(unidad, regla) {
    const grupos = obtenerGruposTurnosUnidad(unidad, regla);
    const preferidos = obtenerTurnosPreferidos(regla);
    if (!grupos) return preferidos;

    const rolesPersonalizados = Array.isArray(regla?.reglasPersonalizadas)
        ? regla.reglasPersonalizadas.map((turno) => turno.codigo)
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
    if (configuracion?.turnos?.length) {
        const manana = configuracion.turnos.filter((turno) => /^M|^CD|^RF/.test(turno));
        const tarde = configuracion.turnos.filter((turno) => /^T/.test(turno));
        if (manana.length || tarde.length) return { manana, tarde };
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
    if (fechaInicioTurnos) fechaInicioTurnos.value = obtenerFechaInicioSemana();
    if (fechaFinTurnos) fechaFinTurnos.value = obtenerFechaFinSemana();
    renderizarConfiguracionUnidades();
    actualizarSelectorUnidades();
    mostrarEmpleados();
}

inicializarValores();
