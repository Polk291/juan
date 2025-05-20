const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  exportTareaReport,
  exportUsuariosReport,
} = require("../controllers/reportController");

const router = express.Router();

router.get("/export/tareas", protect, adminOnly, exportTareaReport);
router.get("/export/usuarios", protect, adminOnly, exportUsuariosReport);

module.exports = router;
