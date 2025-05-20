require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/bd");
const authRoutes = require("./routes/authRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const tareaRoutes = require("./routes/tareaRoutes");
const reportRoutes = require("./routes/reportRoutes");
const app = express();

//Middleware CORS

app.use(
  cors({
    rigin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
//CONECTAR BD

connectDB();
//MIDDLEWARE

app.use(express.json());

// Ruta raíz
app.get("/", (req, res) => {
  res.send("¡Bienvenido a la API!");
});
//Routes

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/tarea", tareaRoutes);
app.use("/api/reports", reportRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Iniciar Servidor

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Servidor iniciado en el puerto ${PORT}`));
