const STORAGE_KEY = "empleadosTurnos";
const STORAGE_RULES_KEY = "reglasTurnos";
const STORAGE_UNIDADES_KEY = "unidadesTurnos";
const STORAGE_MANUALES_KEY = "cambiosTurnosManuales";
const STORAGE_UNIDADES_CONFIG_KEY = "configuracionUnidadesTurnos";
const STORAGE_ORDEN_CUADROS_KEY = "ordenCuadrosTurnos";
const STORAGE_ROLES_PERSONALIZADOS_KEY = "rolesPersonalizadosTurnos";
const STORAGE_HORARIOS_MANUALES_KEY = "horariosManualesTurnos";
const STORAGE_DETALLES_CAMBIOS_KEY = "detallesCambiosTurnos";
const DEFAULT_UNIDADES = ["Unidad A", "Unidad B", "Unidad C"];
const UNIDADES_BASE = ["Unidad 1", "Unidad 2", "Unidad 4", "Unidad 5", ...DEFAULT_UNIDADES];

let empleados = cargarEmpleadosGuardados();
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
        return Array.isArray(array) && array.length ? array : [...DEFAULT_UNIDADES];
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
        const numero = extraerNumeroUnidad(nombre);
        const nombreNormalizado = numero === null ? nombre.trim() : `Unidad ${numero}`;
        const actual = resultado[nombreNormalizado];
        const turnos = Array.isArray(datos?.turnos) ? datos.turnos : [];

        resultado[nombreNormalizado] = actual
            ? {
                color: datos?.color || actual.color,
                turnos: [...new Set([...actual.turnos, ...turnos])]
            }
            : {
                color: datos?.color || COLOR_UNIDAD_PREDETERMINADO,
                turnos: [...new Set(turnos)]
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
            turnos: Array.from(bloque.querySelectorAll("input[data-config-turno]:checked")).map((input) => input.value)
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
}

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

    const datos = reglasPorEmpleado[nombre] || {};
    if (tipoContrato) tipoContrato.value = datos.tipoContrato || "Fijo";
    if (jornada) jornada.value = datos.jornada || "Completa";
    if (porcentajeHorasEmpleado) porcentajeHorasEmpleado.value = datos.porcentajeHorasMes ?? 100;
    if (unidadActual) unidadActual.value = datos.rotacionUnidades || nombresUnidades[0] || "Unidad A";
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
    if (rotacionUnidades) rotacionUnidades.value = nombresUnidades[0] || "Unidad A";

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
        const colorUnidad = obtenerColorUnidad(regla.rotacionUnidades, regla.colorUnidad);
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
    botonGuardarRegla.title = "Guardar este rol y añadirlo al seleccionador";
    botonGuardarRegla.textContent = "Guardar rol creado";
    botonGuardarRegla.addEventListener("click", () => agregarReglaTurnoEmpleado(nombre, true, nuevaRegla));
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

function guardarCambiosEmpleado() {
    if (!empleadoActivo.nombre) return;

    const empleado = empleadoActivo.nombre;
    const reglaActual = reglasPorEmpleado[empleado] || {};
    const turnosPreferidos = Array.from(document.querySelectorAll("#contenedorReglasEmpleado input[data-tipo-turno='preferido']"))
        .filter((input) => input.checked)
        .map((input) => input.value);
    if (!turnosPreferidos.length) {
        alert("Selecciona al menos un turno preferido");
        return;
    }

    const unidadTrabajo = document.getElementById("modalUnidadTrabajo")?.value.trim() || "Sin unidad";
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
        rotacionUnidades: unidadActual?.value || nombresUnidades[0] || "Unidad A",
        fechaAlta: fechaAlta?.value || "",
        sexo: sexoEmpleado?.value || "",
        transportePropio: transportePropio?.value || "No",
        cargo: cargoEmpleadoModal?.value || "Otros",
        observaciones: observacionesEmpleado?.value || ""
    };

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

    return ordenarUnidades(unidades, (unidad) => unidad);
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
                rotacionUnidades: nombresUnidades[0] || "Unidad A",
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
        const unidad = (regla.rotacionUnidades || "Sin unidad").trim() || "Sin unidad";
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
    const empleadosPorUnidad = new Map();
    empleadosActivos.forEach((empleado) => {
        const unidad = (reglasPorEmpleado[empleado]?.rotacionUnidades || "Sin unidad").trim() || "Sin unidad";
        if (!empleadosPorUnidad.has(unidad)) empleadosPorUnidad.set(unidad, []);
        empleadosPorUnidad.get(unidad).push(empleado);
    });

    const asignaciones = [];
    let indiceEmpleado = 0;
    ordenarUnidades(Array.from(empleadosPorUnidad.entries()), ([unidad]) => unidad).forEach(([unidad, empleadosUnidad]) => {
        empleadosUnidad.forEach((empleado) => {
            const regla = reglasPorEmpleado[empleado] || {
                turnoPreferido: "M1",
                turnosPreferidos: ["M1"],
                diasLibre: [],
                maxTurnos: 5,
                descanso: true,
                rotacionLibres: true
            };
            const unidadEmpleado = (regla.rotacionUnidades || "").trim();
            const turnosEmpleado = obtenerTurnosResponsabilidad(unidadEmpleado, regla);
            const turnosProgramables = turnosEmpleado.filter((turno) => turno !== "Vacaciones");
            const turnosPorFecha = [];
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

                if (estaDeVacaciones && turnosEmpleado.includes("Vacaciones")) {
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

                const cambioManual = cambiosTurnosManuales[claveCambioTurno(empleado, fechaDia)];
                if (cambioManual) turno = cambioManual;
                turnosPorFecha.push(turno);
            }

            const configuracionUnidad = obtenerConfiguracionUnidad(unidad);
            asignaciones.push({
                empleado,
                unidad,
                color: obtenerColorUnidad(unidad, regla.colorUnidad),
                regla,
                porcentaje: obtenerPorcentajeJornada(regla),
                turnos: turnosPorFecha,
                turnosOriginales: turnosOriginalesPorFecha
            });
            indiceEmpleado += 1;
        });
    });

    asignacionesActuales = asignaciones;
    actualizarResumenCuadro(asignaciones, fechasPeriodo, filtroUnidad);

    ordenCuadros.forEach((grupo) => {
        if (grupo !== "tardes") {
            renderizarCuadroGrupo(grupo, asignaciones, fechasPeriodo);
        }
    });
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
    const unidades = new Map();

    asignacionesGrupo.forEach((asignacion) => {
        if (!unidades.has(asignacion.unidad)) unidades.set(asignacion.unidad, []);
        unidades.get(asignacion.unidad).push(asignacion);
    });

    ordenarUnidades(Array.from(unidades.entries()), ([unidad]) => unidad).forEach(([unidad, empleadosUnidad]) => {
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
                        const codigo = document.createElement("strong");
                        codigo.className = "codigo-turno-cuadrante";
                        codigo.textContent = datos.codigo;
                        const horario = document.createElement("small");
                        horario.className = "horario-turno-cuadrante";
                        const horarioManual = horariosManualesTurnos[claveDia];
                        horario.textContent = horarioManual || datos.horario;
                        celda.append(codigo, horario);
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
    });

    tabla.appendChild(cuerpo);
    contenedor.appendChild(tabla);
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
    if (detalleCuadro) detalleCuadro.textContent = `${etiquetaUnidad} · Pulsa cualquier celda para editar un turno.`;
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
    const bloque = event.target.closest(".bloque-turnos");
    if (!bloque) return;
    bloque.classList.add("arrastrando-cuadro");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", bloque.dataset.grupoTurnos);
}

function permitirSoltarCuadro(event) {
    const bloque = event.target.closest(".bloque-turnos");
    if (!bloque) return;
    event.preventDefault();
    bloque.classList.add("destino-cuadro");
    event.dataTransfer.dropEffect = "move";
}

function soltarCuadro(event) {
    event.preventDefault();
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
            cambiosTurnosManuales[claveCambioTurno(item.empleado, fecha)] = turnoSolicitado;
            guardarCambiosManuales();
            alert(`${item.empleado} ha sido propuesto para cubrir ${turnoSolicitado}.`);
        });
        listaSugerenciasCobertura.appendChild(boton);
    });
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

    const unidadSeleccionada = unidadCambioTurno?.value.trim();
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
