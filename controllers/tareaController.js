const Tarea = require("../models/Tarea");
const Usuario = require("../models/Usuario");

const getTareas = async (req, res) => {
  console.log("Usuario desde middleware protect:", req.usuario);
  console.log("Query estatus:", req.query.estatus);
  try {
    const { estatus } = req.query;
    let filtro = {};

    if (estatus) {
      filtro.estatus = estatus;
    }

    // Ya no validamos rol, simplemente filtramos tareas asignadas al usuario
    filtro.asignadoA = req.usuario._id;

    let tareas = await Tarea.find(filtro)
      .populate("asignadoA", "nombre usuario profileImageUrl")
      .populate("creadoPor", "nombre profileImageUrl");
    console.log("Tareas encontradas:", tareas.length);

    tareas = await Promise.all(
      tareas.map(async (tarea) => {
        const cuentaCompleta = tarea.chequeoLista.filter(
          (item) => item.completado
        ).length;
        return { ...tarea._doc, completedCount: cuentaCompleta };
      })
    );

    const allTareas = await Tarea.countDocuments({
      asignadoA: { $in: [req.usuario._id] },
    });
    const pendienteTareas = await Tarea.countDocuments({
      ...filtro,
      estatus: "Pendiente",
    });

    const enProgresoTareas = await Tarea.countDocuments({
      ...filtro,
      estatus: "En Progreso",
    });

    const completadoTareas = await Tarea.countDocuments({
      ...filtro,
      estatus: "Completado",
    });

    res.json({
      tareas,
      estatusSummary: {
        all: allTareas,
        pendienteTareas,
        enProgresoTareas,
        completadoTareas,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error de Servidor", error: error.message });
  }
};

const getTareasById = async (req, res) => {
  try {
    const tareaId = req.params.id; // Obtén el ID de la URL
    const tarea = await Tarea.findById(tareaId).populate(
      "asignadoA",
      "nombre usuario profileImageUrl"
    ); // Busca la tarea por ID

    if (!tarea) {
      return res.status(404).json({ message: "Tarea no encontrada" }); // Manejo de caso 404
    }

    res.json(tarea); // Responde con la tarea encontrada
  } catch (error) {
    console.error("Error en getTareasById:", error);
    res
      .status(500)
      .json({ message: "Error de Servidor", error: error.message }); // Manejo de errores
  }
};

const crearTareas = async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      prioridad,
      vencimiento,
      asignadoA,
      adjuntos,
      chequeoLista,
    } = req.body;

    if (!titulo || typeof titulo !== "string") {
      return res
        .status(400)
        .json({ message: "El título es requerido y debe ser una cadena." });
    }

    if (!descripcion || typeof descripcion !== "string") {
      return res.status(400).json({
        message: "La descripción es requerida y debe ser una cadena.",
      });
    }

    if (!Array.isArray(asignadoA)) {
      return res
        .status(400)
        .json({ message: "Error en la asignación: debe ser un array." });
    }

    if (chequeoLista && !Array.isArray(chequeoLista)) {
      return res
        .status(400)
        .json({ message: "Error en la lista de chequeo: debe ser un array." });
    }

    if (vencimiento && isNaN(new Date(vencimiento).getTime())) {
      return res
        .status(400)
        .json({ message: "La fecha de vencimiento es inválida." });
    }

    // Crear la tarea
    const tarea = await Tarea.create({
      titulo,
      descripcion,
      prioridad,
      vencimiento: new Date(vencimiento),
      asignadoA,
      creadoPor: req.usuario._id,
      chequeoLista: chequeoLista || [],
      adjuntos: adjuntos || [],
    });

    // Obtener los datos del usuario que creó la tarea
    const tareaConUsuario = await Tarea.findById(tarea._id).populate(
      "creadoPor",
      "nombre usuario profileImageUrl"
    );

    res.status(201).json({
      message: "Tarea creada correctamente!",
      tarea: tareaConUsuario,
    });
  } catch (error) {
    console.error("Error al crear la tarea:", error);
    res.status(500).json({
      message: "Error de Servidor",
      error: error.message,
    });
  }
};

const updateTareas = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      prioridad,
      estatus,
      vencimiento,
      asignadoA,
      adjuntos,
      chequeoLista,
      progreso,
    } = req.body;

    const tarea = await Tarea.findById(id);

    if (!tarea) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }

    // Actualizar los campos de la tarea
    tarea.titulo = titulo !== undefined ? titulo : tarea.titulo;
    tarea.descripcion =
      descripcion !== undefined ? descripcion : tarea.descripcion;
    tarea.prioridad = prioridad !== undefined ? prioridad : tarea.prioridad;
    tarea.estatus = estatus !== undefined ? estatus : tarea.estatus;
    tarea.vencimiento =
      vencimiento !== undefined ? vencimiento : tarea.vencimiento;
    tarea.asignadoA = asignadoA !== undefined ? asignadoA : tarea.asignadoA;
    tarea.adjuntos = adjuntos !== undefined ? adjuntos : tarea.adjuntos;
    tarea.chequeoLista =
      chequeoLista !== undefined ? chequeoLista : tarea.chequeoLista;
    tarea.progreso = progreso !== undefined ? progreso : tarea.progreso;

    // Guardar la tarea actualizada
    const tareaActualizada = await tarea.save();

    // Devolver la tarea actualizada
    res.json(tareaActualizada);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error de Servidor", error: error.message });
  }
};

const deleteTareas = async (req, res) => {
  try {
    const { id } = req.params;

    // Usa findByIdAndDelete para encontrar y eliminar la tarea en una sola operación
    const resultado = await Tarea.findByIdAndDelete(id);

    // Verificar si el resultado es nulo
    if (!resultado) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }

    res.status(200).json({ message: "Tarea eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar la tarea:", error); // Log para depuración
    res
      .status(500)
      .json({ message: "Error de Servidor", error: error.message });
  }
};

const updateTareasEstatus = async (req, res) => {
  try {
    const tarea1 = await Tarea.findById(req.params.id);
    if (tarea1) return res.status(404).json({ message: "Tarea no Encontrada" });

    const isAsignado = tarea.asignadoA.some(
      (usuarioId) => usuarioId.toString() === req.usuario._id.toString()
    );

    tarea.estatus = req.body.estatus || tarea.estatus;

    if (tarea.estatus === "Completado") {
      tarea.chequeoLista.forEach((item) => (item.completado = true));
      tarea.progreso = 100;
    }

    await tarea.save();
    res.json({ message: "Estatus actualizado", tarea });
  } catch (error) {
    console.error("Error en updateTareasEstatus:", error);
    return res
      .status(500)
      .json({ message: "Error de servidor", error: error.message });
  }
};

const updateTareasCheckList = async (req, res) => {
  try {
    const { chequeoLista } = req.body; // Los datos de la lista de chequeo que vienen en el cuerpo de la solicitud

    // Buscar la tarea por el ID
    const tarea = await Tarea.findById(req.params.id);

    // Validar si la tarea existe
    if (!tarea) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }

    // Aseguramos que chequeoLista esté bien formado
    if (!Array.isArray(chequeoLista) || chequeoLista.length === 0) {
      return res
        .status(400)
        .json({ message: "La lista de chequeo no es válida" });
    }

    // Actualizamos cada elemento en la lista de chequeo
    tarea.chequeoLista = tarea.chequeoLista.map((item, index) => {
      if (
        chequeoLista[index] &&
        chequeoLista[index]._id.toString() === item._id.toString()
      ) {
        item.completado = chequeoLista[index].completado; // Actualizamos el estado completado de la tarea
      }
      return item;
    });

    // Contar los elementos completados
    const completedCount = tarea.chequeoLista.filter(
      (item) => item.completado
    ).length;
    const totalItems = tarea.chequeoLista.length;

    // Actualizar el progreso de la tarea
    tarea.progreso =
      totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    // Actualizar el estado de la tarea según el progreso
    if (tarea.progreso === 100) {
      tarea.estatus = "Completado";
    } else if (tarea.progreso > 0) {
      tarea.estatus = "En Progreso";
    } else {
      tarea.estatus = "Pendiente";
    }

    // Guardar la tarea actualizada
    await tarea.save();

    // Devolver la tarea actualizada
    const updatedTarea = await Tarea.findById(req.params.id).populate(
      "asignadoA",
      "nombre usuario profileImageUrl"
    );

    return res.json({ message: "Tarea actualizada", tarea: updatedTarea });
  } catch (error) {
    console.error("Error en updateTareasCheckList:", error);
    return res
      .status(500)
      .json({ message: "Error de servidor", error: error.message });
  }
};

const getPrincipalData = async (req, res) => {
  try {
    const tareas = await Tarea.find()
      .populate("asignadoA", "nombre usuario profileImageUrl")
      .populate("creadoPor", "nombre usuario profileImageUrl");

    if (!tareas || !Array.isArray(tareas) || tareas.length === 0) {
      return res.status(200).json({
        totalTareas: 0,
        tareaDistribucion: {},
        recentTask: [],
      });
    }

    const totalTareas = tareas.length;

    const tareasPendientes = tareas.filter(
      (t) => t.estatus === "Pendiente"
    ).length;
    const tareasCompletadas = tareas.filter(
      (t) => t.estatus === "Completado"
    ).length;
    const tareasEnProgreso = tareas.filter(
      (t) => t.estatus === "En Progreso"
    ).length;

    const tareasBajo = tareas.filter((t) => t.prioridad === "Bajo").length;
    const tareasModerado = tareas.filter(
      (t) => t.prioridad === "Moderado"
    ).length;
    const tareasAlto = tareas.filter((t) => t.prioridad === "Alto").length;

    const datosPrincipales = {
      totalTareas,
      tareaDistribucion: {
        Pendiente: tareasPendientes,
        Completado: tareasCompletadas,
        EnProgreso: tareasEnProgreso,
        Bajo: tareasBajo,
        Moderado: tareasModerado,
        Alto: tareasAlto,
      },
      recentTask: tareas.slice(0, 6),
    };

    res.json(datosPrincipales);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error de Servidor", error: error.message });
  }
};
const getUsuarioPrincipalData = async (req, res) => {
  try {
    const tareas = await Tarea.find()
      .populate("asignadoA", "nombre usuario profileImageUrl")
      .populate("creadoPor", "nombre usuario profileImageUrl");

    if (!tareas.length) {
      return res.status(404).json({ message: "No se encontraron tareas" });
    }

    const totalTareas = tareas.length;

    const tareasPendientes = tareas.filter(
      (t) => t.estatus === "Pendiente"
    ).length;
    const tareasCompletadas = tareas.filter(
      (t) => t.estatus === "Completado"
    ).length;
    const tareasEnProgreso = tareas.filter(
      (t) => t.estatus === "En Progreso"
    ).length;

    const tareasBajo = tareas.filter((t) => t.prioridad === "Bajo").length;
    const tareasModerado = tareas.filter(
      (t) => t.prioridad === "Moderado"
    ).length;
    const tareasAlto = tareas.filter((t) => t.prioridad === "Alto").length;

    const datosPrincipales = {
      totalTareas,
      tareaDistribucion: {
        Pendiente: tareasPendientes,
        Completado: tareasCompletadas,
        EnProgreso: tareasEnProgreso,
        Bajo: tareasBajo,
        Moderado: tareasModerado,
        Alto: tareasAlto,
      },
      recentTask: tareas.slice(0, 6),
    };

    res.json(datosPrincipales);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error de Servidor", error: error.message });
  }
};

module.exports = {
  getTareas,
  getTareasById,
  crearTareas,
  updateTareas,
  deleteTareas,
  updateTareasEstatus,
  updateTareasCheckList,
  getPrincipalData,
  getUsuarioPrincipalData,
};
