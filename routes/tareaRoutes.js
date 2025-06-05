const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getPrincipalData,
  getUsuarioPrincipalData,
  getTareas,
  getTareasById,
  crearTareas,
  updateTareas,
  deleteTareas,
  updateTareasEstatus,
  updateTareasCheckList,
} = require("../controllers/tareaController");

const router = express.Router();

router.get("/principal-data", protect, getPrincipalData);
router.get("/usuario-data", protect, getUsuarioPrincipalData);
router.get("/", protect, getTareas);
router.get("/:id", protect, getTareasById);
router.post("/", protect, crearTareas);
router.put("/:id", protect, updateTareas);
router.delete("/:id", protect, adminOnly, deleteTareas);
router.put("/:id/estatus", protect, updateTareasEstatus);
router.put("/:id/chequeoLista", updateTareasCheckList);

module.exports = router;
