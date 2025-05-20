const Tarea = require("../models/Tarea");
const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");

const getUsuario = async (req, res) => {
  try {
    // Obtener usuarios con rol "member" sin el campo "clave"
    const usuarios = await Usuario.find({ role: "member" }).select("-clave");

    // Obtener el conteo de tareas para cada usuario de manera concurrente
    const usuariosTareas = await Promise.all(
      usuarios.map(async (usuario) => {
        const pendienteTareas = await Tarea.countDocuments({
          asignadoA: usuario._id,
          estatus: "Pendiente",
        });
        const enProgresoTareas = await Tarea.countDocuments({
          asignadoA: usuario._id,
          estatus: "En Progreso",
        });
        const completadasTareas = await Tarea.countDocuments({
          asignadoA: usuario._id,
          estatus: "Completado",
        });

        // Retornar un objeto con la información del usuario y las tareas
        return {
          ...usuario._doc,
          pendienteTareas,
          enProgresoTareas,
          completadasTareas,
        };
      })
    );

    // Devolver la lista de usuarios con el conteo de tareas
    res.json(usuariosTareas);
  } catch (error) {
    // Manejo de errores
    res
      .status(500)
      .json({ message: "Error de Servidor", error: error.message });
  }
};

const getUsuarioPorId = async (req, res) => {
  try {
    // Buscar usuario por ID y excluir el campo "clave"
    const usuario = await Usuario.findById(req.params.id).select("-clave");

    // Comprobar si el usuario fue encontrado
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Retornar la información del usuario encontrado
    res.json(usuario);
  } catch (error) {
    // Manejo de errores
    res
      .status(500)
      .json({ message: "Error de Servidor", error: error.message });
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    // Verificar si el usuario que hace la solicitud es un admin
    if (req.usuario.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Acceso denegado: solo para administradores" });
    }

    // Buscar y eliminar el usuario por ID
    const usuario = await Usuario.findByIdAndDelete(req.params.id);

    // Comprobar si se encontró y eliminó al usuario
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Retornar respuesta de éxito
    res.json({ message: "Usuario eliminado con éxito" });
  } catch (error) {
    // Manejo de errores
    res
      .status(500)
      .json({ message: "Error de Servidor", error: error.message });
  }
};
module.exports = { getUsuario, getUsuarioPorId, eliminarUsuario };
