const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getUsuarioPorId,
  getUsuario,
  eliminarUsuario,
} = require("../controllers/usuarioController");

const router = express.Router();

router.get("/", protect, getUsuario);
router.get("/:id", protect, getUsuarioPorId);
router.delete("/:id", protect, adminOnly, eliminarUsuario);

module.exports = router;
