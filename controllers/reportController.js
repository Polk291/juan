const Tarea = require("../models/Tarea");
const Usuario = require("../models/Usuario");
const excelJS = require("exceljs");

const exportTareaReport = async (req, res) => {
  try {
    const tareas = await Tarea.find().populate("asignadoA", "nombre usuario");

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
        vencimiento: tarea.vencimiento.toISOString().split("T")[0],
        asignadoA: asignadoA || "Sin Asignacion",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposititon",
      'attachment; filename="reporte_de_tarea.xlsx"'
    );

    return workbook.xlsx.write(res).then(() => {
      res.end();
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al exportar las tareas!", error: error.message });
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
        tareaCount: 0,
        pendienteTareas: 0,
        enProgresoTareas: 0,
        completadasTareas: 0,
      };
    });

    usuarioTareas.forEach((tarea) => {
      if (tarea.asignadoA) {
        tarea.asignadoA.forEach((usuarioAsignado) => {
          if (usuarioTareaMap[usuarioAsignado._id]) {
            usuarioTareaMap[usuarioAsignado._id].tareaCount += 1;
            if (tarea.estatus === "Pendiente") {
              usuarioTareaMap[usuarioAsignado._id].pendienteTareas += 1;
            } else if (tarea.estatus === "En Progreso") {
              usuarioTareaMap[usuarioAsignado._id].enProgresoTareas += 1;
            } else if (tarea.estatus === "Completado") {
              usuarioTareaMap[usuarioAsignado._id].completadasTareas += 1;
            }
          }
        });
      }
    });

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reporte de Usuarios");

    worksheet.columns = [
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "Usuario", key: "usuario", width: 40 },
      { header: "Total de Tareas", key: "tareaCount", width: 20 },
      { header: "Tareas Pendientes", key: "pendienteTareas", width: 20 },
      { header: "Tareas en Progreso", key: "enProgresoTareas", width: 20 },
      { header: "Tareas Completadas", key: "completadasTareas", width: 20 },
    ];

    Object.values(usuarioTareaMap).forEach((usuario) => {
      worksheet.addRow(usuario);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="reporte_de_usuario.xlsx"' // Corrige "Content-Disposititon" a "Content-Disposition"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al exportar el reporte!", error: error.message });
  }
};

module.exports = { exportTareaReport, exportUsuariosReport };
