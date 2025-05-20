const mongoose = require("mongoose");

const UsuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    usuario: { type: String, required: true, unique: true },
    clave: { type: String, required: true },
    profileImageUrl: { type: String, default: null },
    role: { type: String, enum: ["admin", "member"], default: "member" },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Usuario", UsuarioSchema);
