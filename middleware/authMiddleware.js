const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (token && token.startsWith("Bearer")) {
      token = token.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decodificado:", decoded);

      req.usuario = await Usuario.findById(decoded.id).select("-clave");
      console.log("Usuario encontrado:", req.usuario);

      if (!req.usuario) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }

      next();
    } else {
      return res.status(401).json({ message: "No autorizado, sin token" });
    }
  } catch (error) {
    console.error("Error middleware protect:", error);
    return res
      .status(401)
      .json({ message: "Falla del Token", error: error.message });
  }
};
