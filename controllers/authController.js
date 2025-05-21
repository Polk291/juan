const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

//GENERAR TOKEN JWT

const generateToken = (usuarioId) => {
  return jwt.sign({ id: usuarioId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

//@desc Registro Usuario
//@route POST /api/auth/registro
//@access Public

const registroUsuario = async (req, res) => {
  try {
    const { nombre, usuario, clave, profileImageUrl, adminInviteToken } =
      req.body;

    // Validación de campos obligatorios mejorada
    const camposRequeridos = { nombre, usuario, clave };
    const camposFaltantes = Object.entries(camposRequeridos)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        message: `Campos obligatorios faltantes: ${camposFaltantes.join(", ")}`,
        camposFaltantes,
      });
    }

    // Validación de formato de usuario
    if (!/^[a-zA-Z0-9_]{4,20}$/.test(usuario)) {
      return res.status(400).json({
        message: "El usuario debe tener entre 4-20 caracteres alfanuméricos",
      });
    }

    // Validación de fortaleza de contraseña mejorada
    if (
      clave.length < 8 ||
      !/[A-Z]/.test(clave) ||
      !/[0-9]/.test(clave) ||
      !/[^A-Za-z0-9]/.test(clave)
    ) {
      return res.status(400).json({
        message:
          "La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, números y caracteres especiales",
      });
    }

    // Verificación del usuario existente (case insensitive)
    const usuarioExistente = await Usuario.findOne({
      usuario: { $regex: new RegExp(`^${usuario}$`, "i") },
    });

    if (usuarioExistente) {
      return res.status(409).json({
        message: "El nombre de usuario ya está en uso",
      });
    }

    // Validación reforzada del token de administrador con protección contra timing attacks
    let role = "member";
    if (adminInviteToken) {
      if (!process.env.ADMIN_INVITE_TOKEN_HASH) {
        console.error(
          "ADMIN_INVITE_TOKEN_HASH no configurado en variables de entorno"
        );
        return res.status(500).json({
          message: "Error de configuración del servidor",
        });
      }

      // Comparación segura contra timing attacks
      const isTokenValid = await bcrypt.compare(
        adminInviteToken,
        process.env.ADMIN_INVITE_TOKEN_HASH
      );

      if (!isTokenValid) {
        console.warn(
          `Intento de registro admin con token inválido desde IP: ${req.ip}`
        );
        return res.status(403).json({
          message: "Acceso denegado. Token de administrador inválido",
        });
      }

      role = "admin";
      console.log(`Registro de nuevo administrador: ${usuario}`);
    }

    // Hashear la contraseña con mayor seguridad
    const saltRounds = 12;
    const hashedClave = await bcrypt.hash(clave, saltRounds);

    // Generar imagen de perfil por defecto si no se proporciona
    let finalProfileImageUrl = profileImageUrl || generateInitialsImage(nombre);

    // Crear el nuevo usuario con validación de schema
    const nuevoUsuario = await Usuario.create({
      nombre: nombre.trim(),
      usuario: usuario.toLowerCase(),
      clave: hashedClave,
      profileImageUrl: finalProfileImageUrl,
      role,
      fechaRegistro: new Date(),
      ultimoAcceso: new Date(),
      ipRegistro: req.ip, // Registrar IP de registro
    });

    // Generar token JWT con expiración
    const token = generateToken({
      id: nuevoUsuario._id,
      role: nuevoUsuario.role,
      ip: req.ip,
    });

    // Respuesta segura sin información sensible
    const userResponse = {
      _id: nuevoUsuario._id,
      nombre: nuevoUsuario.nombre,
      usuario: nuevoUsuario.usuario,
      role: nuevoUsuario.role,
      profileImageUrl: nuevoUsuario.profileImageUrl,
      token,
      expiraEn: "24h", // Informar tiempo de expiración del token
    };

    // Auditoría de registro
    console.log(`Nuevo usuario registrado: 
      Usuario: ${userResponse.usuario} 
      Rol: ${userResponse.role}
      IP: ${req.ip}
      Fecha: ${new Date().toISOString()}`);

    return res.status(201).json(userResponse);
  } catch (error) {
    console.error("Error durante el registro:", error);

    // Manejo específico de errores
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: "Error de validación de datos",
        errors,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "El nombre de usuario ya existe",
      });
    }

    // Error general del servidor
    res.status(500).json({
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

//@desc Login Usuario
//@route POST /api/auth/login
//@access Public

const loginUsuario = async (req, res) => {
  try {
    const { usuario, clave } = req.body;

    // Buscar el usuario por su nombre de usuario
    const usuarioEncontrado = await Usuario.findOne({ usuario });

    // Verificar si el usuario existe
    if (!usuarioEncontrado) {
      return res.status(401).json({ message: "Usuario o clave inválida" });
    }

    // Comparar la clave proporcionada con la clave almacenada
    const isMatch = await bcrypt.compare(clave, usuarioEncontrado.clave);
    if (!isMatch) {
      return res.status(401).json({ message: "Usuario o clave inválida" });
    }

    // Si la autenticación es exitosa, devolver datos del usuario y el token
    res.json({
      _id: usuarioEncontrado._id,
      nombre: usuarioEncontrado.nombre,
      usuario: usuarioEncontrado.usuario,
      role: usuarioEncontrado.role,
      imagen: usuarioEncontrado.imagen,
      token: generateToken(usuarioEncontrado._id), // Generar el token
    });
  } catch (error) {
    // Manejo de errores
    res
      .status(500)
      .json({ message: "Error de Servidor", error: error.message });
  }
};

//@desc Get Usuario Perfil
//@route POST /api/auth/perfil
//@access Private (Requires JWT)

const getUsuarioPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select("-clave");
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no Encontrado" });
    }
    res.json(usuario);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error de Servidor", error: error.message });
  }
};

//@desc Update Usuario Perfil
//@route POST /api/auth/perfil
//@access Private (Requires JWT)

const updateUsuarioPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no Encontrado" });
    }

    usuario.nombre = req.body.nombre || usuario.nombre;
    usuario.usuario = req.body.usuario || usuario.usuario;

    if (req.body.clave) {
      const salt = await bcrypt.genSalt(10);
      usuario.clave = await bcrypt.hash(req.doby.clave, salt);
    }

    const updatedUsuario = await usuario.save();

    res.json({
      _id: updatedUsuario._id,
      nombre: updatedUsuario.nombre,
      usuario: updatedUsuario.usuario,
      role: updatedUsuario.role,
      token: generateToken(updatedUsuario._id),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error de Servidor", error: error.message });
  }
};

module.exports = {
  loginUsuario,
  getUsuarioPerfil,
  updateUsuarioPerfil,
  registroUsuario,
};
