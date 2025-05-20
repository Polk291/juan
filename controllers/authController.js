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

    // Verificar que los campos obligatorios estén presentes
    if (!nombre || !usuario || !clave) {
      return res
        .status(400)
        .json({ message: "Nombre, usuario y contraseña son obligatorios." });
    }

    // Verificación del usuario existente
    const usuarioExistente = await Usuario.findOne({ usuario });
    if (usuarioExistente) {
      return res.status(400).json({ message: "Usuario ya existe" });
    }

    let role = "member";
    if (
      adminInviteToken &&
      adminInviteToken == process.env.ADMIN_INVITE_TOKEN
    ) {
      role = "admin";
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedClave = await bcrypt.hash(clave, salt);

    // Si no se sube una imagen de perfil, generamos una imagen con las iniciales
    let finalProfileImageUrl = profileImageUrl;
    if (!profileImageUrl) {
      finalProfileImageUrl = generateInitialsImage(nombre); // Generar imagen con las iniciales
    }

    // Crear el nuevo usuario
    const nuevoUsuario = await Usuario.create({
      nombre,
      usuario,
      clave: hashedClave,
      profileImageUrl: finalProfileImageUrl,
      role: adminInviteToken ? "admin" : "member", // Asignar rol basado en el token
    });

    res.status(201).json({
      _id: nuevoUsuario._id,
      nombre: nuevoUsuario.nombre,
      usuario: nuevoUsuario.usuario,
      role: nuevoUsuario.role,
      profileImageUrl: nuevoUsuario.profileImageUrl,
      token: generateToken(nuevoUsuario._id),
    });
  } catch (error) {
    console.error("Error durante el registro:", error.message);
    res
      .status(500)
      .json({ message: "Error de Servidor", error: error.message });
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
