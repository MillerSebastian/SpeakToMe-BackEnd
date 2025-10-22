import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";

import { config } from "@/config";
import { testConnection } from "@/config/database";
import routes from "@/routes";
import {
  errorHandler,
  notFoundHandler,
  jsonErrorHandler,
} from "@/middleware/errorHandler";
import { generalRateLimit } from "@/middleware/rateLimiter";
import { morganStream, logRequest } from "@/utils/logger";

// Cargar variables de entorno
dotenv.config();

const app = express();

// Crear directorio de logs si no existe
import fs from "fs";
if (!fs.existsSync("logs")) {
  fs.mkdirSync("logs");
}

// Middleware de seguridad
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Configuración de CORS
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Middleware de parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Middleware de logging
app.use(morgan("combined", { stream: morganStream }));
app.use(logRequest);

// Rate limiting global
app.use(generalRateLimit);

// Middleware para manejar errores de JSON
app.use(jsonErrorHandler);

// Servir archivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rutas de la API
app.use("/api", routes);

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Bienvenido a la API de SpeakToMe - Universidad RIWI",
    version: "1.0.0",
    documentation: "/api/info",
    health: "/api/health",
  });
});

// Middleware para rutas no encontradas
app.use(notFoundHandler);

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error("❌ No se pudo conectar a la base de datos");
      process.exit(1);
    }

    // Iniciar servidor
    const server = app.listen(config.port, () => {
      console.log(`
🚀 Servidor iniciado exitosamente!
📍 Puerto: ${config.port}
🌍 Entorno: ${config.nodeEnv}
📊 Base de datos: ${dbConnected ? "Conectada" : "Desconectada"}
🕐 Hora: ${new Date().toLocaleString()}
📚 API Docs: http://localhost:${config.port}/api/info
      `);
    });

    // Manejo de cierre graceful
    const gracefulShutdown = (signal: string) => {
      console.log(`\n🛑 Recibida señal ${signal}. Cerrando servidor...`);

      server.close(() => {
        console.log("✅ Servidor cerrado exitosamente");
        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error("❌ Forzando cierre del servidor");
        process.exit(1);
      }, 10000);
    };

    // Escuchar señales de cierre
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Manejo de errores no capturados
    process.on("uncaughtException", (error) => {
      console.error("❌ Error no capturado:", error);
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Promesa rechazada no manejada:", reason);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

// Iniciar el servidor
startServer();

export default app;
