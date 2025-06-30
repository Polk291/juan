const Tarea = require("../models/Tarea");
const Usuario = require("../models/Usuario");
const excelJS = require("exceljs");

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
        // Para incluir todo el día hasta las 23:59:59
        const hastaFinDia = new Date(hasta);
        hastaFinDia.setHours(23, 59, 59, 999);
        filtroFecha.createdAt.$lte = hastaFinDia;
      }
    }

    const tareas = await Tarea.find(filtroFecha).populate(
      "asignadoA",
      "nombre usuario"
    );

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reporte de Tareas");

    worksheet.columns = [
      { header: "ID Tarea", key: "_id", width: 25 },
      { header: "Titulo", key: "titulo", width: 30 },
      { header: "Descripcion", key: "descripcion", width: 50 },
      { header: "Prioridad", key: "prioridad", width: 15 },
      { header: "Estatus", key: "estatus", width: 20 },
      { header: "Fecha de Vencimiento", key: "vencimiento", width: 20 },
      { header: "Usuarios Asignados", key: "asignadoA", width: 30 },
    ];

    tareas.forEach((tarea) => {
      const asignadoA = tarea.asignadoA
        .map((usuario) => `${usuario.nombre} (${usuario.usuario})`)
        .join(", ");
      worksheet.addRow({
        _id: tarea._id,
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        prioridad: tarea.prioridad,
        estatus: tarea.estatus,
        vencimiento: tarea.vencimiento?.toISOString().split("T")[0] || "",
        asignadoA: asignadoA || "Sin Asignacion",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="reporte_de_tarea.xlsx"'
    );

    return workbook.xlsx.write(res).then(() => {
      res.end();
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al exportar las tareas!",
      error: error.message,
    });
  }
};

const Tarea = require("../models/Tarea");
const Usuario = require("../models/Usuario");
const excelJS = require("exceljs");

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
        // Para incluir todo el día hasta las 23:59:59
        const hastaFinDia = new Date(hasta);
        hastaFinDia.setHours(23, 59, 59, 999);
        filtroFecha.createdAt.$lte = hastaFinDia;
      }
    }

    const tareas = await Tarea.find(filtroFecha).populate(
      "asignadoA",
      "nombre usuario"
    );

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reporte de Tareas");

    worksheet.columns = [
      { header: "ID Tarea", key: "_id", width: 25 },
      { header: "Titulo", key: "titulo", width: 30 },
      { header: "Descripcion", key: "descripcion", width: 50 },
      { header: "Prioridad", key: "prioridad", width: 15 },
      { header: "Estatus", key: "estatus", width: 20 },
      { header: "Fecha de Vencimiento", key: "vencimiento", width: 20 },
      { header: "Usuarios Asignados", key: "asignadoA", width: 30 },
    ];

    tareas.forEach((tarea) => {
      const asignadoA = tarea.asignadoA
        .map((usuario) => `${usuario.nombre} (${usuario.usuario})`)
        .join(", ");
      worksheet.addRow({
        _id: tarea._id,
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        prioridad: tarea.prioridad,
        estatus: tarea.estatus,
        vencimiento: tarea.vencimiento?.toISOString().split("T")[0] || "",
        asignadoA: asignadoA || "Sin Asignacion",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="reporte_de_tarea.xlsx"'
    );

    return workbook.xlsx.write(res).then(() => {
      res.end();
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al exportar las tareas!",
      error: error.message,
    });
  }
};

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
         // Puedes cambiar esto si tienes una lógica real
      };
    });

    usuarioTareas.forEach((tarea) => {
      if (tarea.asignadoA && Array.isArray(tarea.asignadoA)) {
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

    // Enviar los datos como JSON al frontend
    const usuariosReporte = Object.values(usuarioTareaMap);
    res.status(200).json(usuariosReporte);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al exportar el reporte!", error: error.message });
  }
};

module.exports = { exportTareaReport, exportUsuariosReport };


