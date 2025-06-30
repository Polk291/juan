const Tarea = require("../models/Tarea");
const Usuario = require("../models/Usuario");

// Reporte de tareas en formato JSON para frontend
const exportTareaReport = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    const filtroFecha = {};
    if (desde || hasta) {
      filtroFecha.createdAt = {};
      if (desde) {
        filtroFecha.createdAt.$gte = new Date(desde);
      }
      if (hasta) {
        const hastaFinDia = new Date(hasta);
        hastaFinDia.setHours(23, 59, 59, 999);
        filtroFecha.createdAt.$lte = hastaFinDia;
      }
    }

    const tareas = await Tarea.find(filtroFecha).populate(
      "asignadoA",
      "nombre usuario"
    );

    const tareasReporte = tareas.map((tarea) => ({
      id: tarea._id,
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      prioridad: tarea.prioridad,
      estatus: tarea.estatus,
      vencimiento: tarea.vencimiento?.toISOString().split("T")[0] || "",
      asignadoA:
        tarea.asignadoA?.map((u) => `${u.nombre} (${u.usuario})`).join(", ") ||
        "Sin asignación",
    }));

    res.status(200).json(tareasReporte);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener las tareas!",
      error: error.message,
    });
  }
};

// Reporte de usuarios con estadísticas de tareas
const exportUsuariosReport = async (req, res) => {
  try {
    const usuarios = await Usuario.find().select("nombre usuario _id").lean();
    const usuarioTareas = await Tarea.find().populate(
      "asignadoA",
      "nombre usuario _id"
    );

    const usuarioTareaMap = {};
    usuarios.forEach((usuario) => {
      usuarioTareaMap[usuario._id] = {
        nombre: usuario.nombre,
        usuario: usuario.usuario,
        totalTareas: 0,
        tareasPendientes: 0,
        tareasEnProgreso: 0,
        tareasCompletadas: 0,
        estatus: "Activo", // Puedes ajustar esta lógica según tu app
      };
    });

    usuarioTareas.forEach((tarea) => {
      if (Array.isArray(tarea.asignadoA)) {
        tarea.asignadoA.forEach((usuarioAsignado) => {
          const entry = usuarioTareaMap[usuarioAsignado._id];
          if (entry) {
            entry.totalTareas += 1;
            switch (tarea.estatus) {
              case "Pendiente":
                entry.tareasPendientes += 1;
                break;
              case "En Progreso":
                entry.tareasEnProgreso += 1;
                break;
              case "Completado":
                entry.tareasCompletadas += 1;
                break;
            }
          }
        });
      }
    });

    const usuariosReporte = Object.values(usuarioTareaMap);
    res.status(200).json(usuariosReporte);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener el reporte!",
      error: error.message,
    });
  }
};

module.exports = {
  exportTareaReport,
  exportUsuariosReport,
};
