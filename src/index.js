import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/database.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import projectRoutes from "./routes/projects.js";
import forumRoutes from "./routes/forum.js";
import eventRoutes from "./routes/events.js";
import resourceRoutes from "./routes/resources.js";
import assignmentRoutes from "./routes/assignments.js";
import submissionRoutes from "./routes/submissions.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { handleMulterError } from "./middleware/upload.js";

// Configuración para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

// Crear app de Express
const app = express();

// Conectar a la base de datos
connectDB();

// Configurar trust proxy para Heroku
app.set('trust proxy', 1);

// Rate limiting - DESACTIVADO para testing intensivo
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
//   max: process.env.NODE_ENV === 'production' 
//     ? parseInt(process.env.RATE_LIMIT_MAX) || 100 
//     : 10000,
//   message: {
//     error: "Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos.",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   skip: (req) => {
//     return req.path === '/health' || 
//            req.path === '/' || 
//            req.path.startsWith('/uploads/');
//   }
// });

// const authLimiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
//   max: process.env.NODE_ENV === 'production' ? 20 : 1000,
//   message: {
//     error: "Demasiados intentos de autenticación, intenta de nuevo en 15 minutos.",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// Middleware de seguridad
app.use(helmet());

// Configurar CORS para múltiples orígenes
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://semillero-guia-front.vercel.app',
  'https://semillero-guia-frontend.vercel.app',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL
].filter(Boolean);

// Remover duplicados y limpiar
const uniqueOrigins = [...new Set(allowedOrigins.filter(origin => origin.trim()))];

console.log('🌍 CORS configurado para:', uniqueOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como aplicaciones móviles, Postman) en desarrollo
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Verificar si el origin está en la lista permitida
    if (uniqueOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`🚫 CORS blocked origin: ${origin}`);
      console.log(`✅ Allowed origins: ${uniqueOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Forwarded-For'
  ],
  exposedHeaders: ['Authorization'],
  maxAge: 86400 // 24 horas
}));

// Rate limiting DESACTIVADO para testing
// app.use("/api/", limiter);
// app.use("/api/auth/", authLimiter); // Rate limiter específico para autenticación

// Middleware de logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Middleware de parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser()); // Para manejar cookies HTTPOnly

// Sanitización de datos
app.use(mongoSanitize()); // Prevenir NoSQL injection
app.use((req, res, next) => {
  // Sanitizar contra XSS
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    });
  }
  next();
});

// Servir archivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "🚀 Semillero GUIA Backend API",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    database: "MongoDB Atlas",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users", 
      projects: "/api/projects",
      assignments: "/api/assignments",
      submissions: "/api/submissions",
      events: "/api/events",
      resources: "/api/resources",
      forum: "/api/forum",
      health: "/health"
    },
    documentation: "https://github.com/IvanAusechaS/semillero-guia-backend"
  });
});

// Health check mejorado
app.get("/health", async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    const mongoose = await import('mongoose');
    const dbStatus = mongoose.default.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Obtener información del sistema
    const healthInfo = {
      status: "success",
      message: "Semillero GUIA API está funcionando correctamente",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV,
      version: '1.0.0',
      database: {
        status: dbStatus,
        type: 'MongoDB Atlas'
      },
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100
      },
      pid: process.pid
    };

    // Si la base de datos no está conectada, devolver error
    if (dbStatus === 'disconnected') {
      return res.status(503).json({
        ...healthInfo,
        status: "error",
        message: "Base de datos no disponible"
      });
    }

    res.status(200).json(healthInfo);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
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
app.use(handleMulterError);
app.use(errorHandler);

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Configurar puerto
const PORT = process.env.PORT || 4000;

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🏥 Health check disponible en http://localhost:${PORT}/health`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}`);
});

// Manejo de promesas rechazadas no capturadas
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown para Heroku
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated');
    process.exit(0);
  });
});

// Para desarrollo local (SIGINT = Ctrl+C)
process.on('SIGINT', () => {
  console.log('👋 SIGINT RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated');
    process.exit(0);
  });
});
