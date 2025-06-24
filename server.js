require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const axios = require("axios");
const connectDB = require("./config/bd");
const authRoutes = require("./routes/authRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const tareaRoutes = require("./routes/tareaRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

// Middleware CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "https://gestor-tareas-sooty.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Conectar BD
connectDB();

// Middleware
app.use(express.json());

// Ruta raíz
app.get("/", (req, res) => {
  res.send("¡Bienvenido a la API!");
});

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/tarea", tareaRoutes);
app.use("/api/reports", reportRoutes);

// Servir archivos subidos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Iniciar servidor
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`Servidor iniciado en el puerto ${PORT}`)
);

// ⏱️ Auto-ping cada 4 segundos (mantener activo)
const SELF_URL = process.env.SELF_URL || `http://localhost:${PORT}`;
//setInterval(() => {
 // axios
//    .get(SELF_URL)
//    .then(() => console.log("Ping exitoso a la raíz"))
//    .catch((err) => console.error("Error en el ping:", err.message));
//}, 4000); // 4000 ms = 4 segundos
