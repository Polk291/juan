const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
  texto: { type: String, required: true },
  completado: { type: Boolean, default: false },
});

const tareaSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true },
    descripcion: { type: String },
    prioridad: {
      type: String,
      enum: ["Bajo", "Moderado", "Alto"],
      default: "Moderado",
    },
    estatus: {
      type: String,
      enum: ["Pendiente", "En Progreso", "Completado"],
      default: "Pendiente",
    },
    vencimiento: { type: Date, required: true },
    asignadoA: [{ type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }],
    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
    adjuntos: [{ type: String }],
    chequeoLista: [todoSchema],
    progreso: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Tarea", tareaSchema);
