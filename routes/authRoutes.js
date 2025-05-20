const express = require("express");
const {
  loginUsuario,
  getUsuarioPerfil,
  updateUsuarioPerfil,
  registroUsuario,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Rutas de autenticación
router.post("/registro", registroUsuario);
router.post("/login", loginUsuario);
router.get("/perfil", protect, getUsuarioPerfil);
router.put("/perfil", protect, updateUsuarioPerfil);

// Carga de imágenes
router.post("/upload-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Archivo no cargado" });
  }

  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;
  res.status(200).json({ imageUrl });
});

module.exports = router;
