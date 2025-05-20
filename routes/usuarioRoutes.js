const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { getUsuarioPerfil } = require("../controllers/authController");
const {
  getUsuarioPorId,
  getUsuario,
  eliminarUsuario,
} = require("../controllers/usuarioController");

const router = express.Router();

router.get("/", protect, adminOnly, getUsuario);
router.get("/:id", protect, adminOnly, getUsuarioPorId);
router.delete("/:id", protect, adminOnly, eliminarUsuario);

module.exports = router;
