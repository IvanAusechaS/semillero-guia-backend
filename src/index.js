import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import xss from "xss-clean";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/database.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import projectRoutes from "./routes/projects.js";
import forumRoutes from "./routes/forum.js";
import eventRoutes from "./routes/events.js";
import resourceRoutes from "./routes/resources.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Configuración para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

// Crear app de Express
const app = express();

// Conectar a la base de datos
connectDB();

// Middleware de seguridad
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP en 15 minutos
  message: {
    error:
      "Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos.",
  },
});
app.use("/api/", limiter);

// Middleware de parsing y sanitización
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(xss());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Servir archivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Semillero GUIA API está funcionando correctamente",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/resources", resourceRoutes);

// Ruta para manejar rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: `No se puede encontrar ${req.originalUrl} en este servidor`,
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Configurar puerto
const PORT = process.env.PORT || 4000;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🏥 Health check disponible en http://localhost:${PORT}/health`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}`);
});
