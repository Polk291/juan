const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

// Middleware para proteger rutas
const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (token && token.startsWith("Bearer")) {
      token = token.split(" ")[1]; // Extraer el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Verificar si el usuario existe y asignar la información al req.usuario
      req.usuario = await Usuario.findById(decoded.id).select("-clave");

      if (!req.usuario) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }

      next();
    } else {
      return res.status(401).json({ message: "No autorizado, sin token" });
    }
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Falla del Token", error: error.message });
  }
};

// Middleware para permitir solo acceso de administradores
const adminOnly = (req, res, next) => {
  if (req.usuario && req.usuario.role === "admin") {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Acceso Denegado: Solo Administradores" });
  }
};

module.exports = { protect, adminOnly };
