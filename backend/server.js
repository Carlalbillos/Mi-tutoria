const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");

// Cargar variables de entorno (útil si se corre sin Docker)
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Middleware para asegurar el Charset UTF-8 en todas las respuestas
app.use((req, res, next) => {
  res.set("Content-Type", "application/json; charset=utf-8");
  next();
});

// Rutas importadas
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const tutoringRoutes = require("./routes/tutoringRoutes");
const extrasRoutes = require("./routes/extrasRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const commentRoutes = require("./routes/commentRoutes");

// Usar rutas
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/tutorings", tutoringRoutes);
app.use("/api/extras", extrasRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/comments", commentRoutes);

// Endpoint básico de prueba
app.get("/", (req, res) => {
  res.json({ message: "Bienvenido a la API de Mi Tutoría" });
});

const pool = require("./config/db");

// Endpoint para probar conexión a BD
app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 as result");
    res.json({
      status: "ok",
      db: "Conexión a base de datos exitosa",
      data: rows,
    });
  } catch (error) {
    console.error("Error de BD:", error);
    res
      .status(500)
      .json({
        status: "error",
        message: "Error conectando a la base de datos",
      });
  }
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:${port}`);
});
