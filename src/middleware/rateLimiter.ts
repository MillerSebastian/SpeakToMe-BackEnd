import rateLimit from "express-rate-limit";
import { config } from "@/config";
import dotenv from "dotenv";
dotenv.config();

// Rate limiter general
export const generalRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutos
  max: config.rateLimit.maxRequests, // 100 requests por ventana
  message: {
    success: false,
    message: "Demasiadas solicitudes, intenta de nuevo más tarde",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Demasiadas solicitudes, intenta de nuevo más tarde",
      retryAfter: Math.round(config.rateLimit.windowMs / 1000),
    });
  },
});

// Rate limiter para autenticación (más restrictivo)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max:
    parseInt(process.env.AUTH_RATE_LIMIT_MAX || "0") ||
    (config.nodeEnv === "development" ? 10 : 5), // 10 en dev, 5 en otros
  message: {
    success: false,
    message:
      "Demasiados intentos de autenticación, intenta de nuevo en 15 minutos",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar requests exitosos
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Demasiados intentos de autenticación, intenta de nuevo en 15 minutos",
      retryAfter: 900, // 15 minutos en segundos
    });
  },
});

// Rate limiter para registro de usuarios
export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros por IP por hora
  message: {
    success: false,
    message: "Demasiados intentos de registro, intenta de nuevo en una hora",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Demasiados intentos de registro, intenta de nuevo en una hora",
      retryAfter: 3600, // 1 hora en segundos
    });
  },
});

// Rate limiter para envío de mensajes
export const messageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 mensajes por minuto
  message: {
    success: false,
    message: "Demasiados mensajes enviados, intenta de nuevo en un minuto",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Demasiados mensajes enviados, intenta de nuevo en un minuto",
      retryAfter: 60, // 1 minuto en segundos
    });
  },
});

// Rate limiter para creación de citas
export const appointmentRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 citas por hora
  message: {
    success: false,
    message: "Demasiadas citas creadas, intenta de nuevo en una hora",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Demasiadas citas creadas, intenta de nuevo en una hora",
      retryAfter: 3600, // 1 hora en segundos
    });
  },
});

// Rate limiter para posts de blog
export const blogPostRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 posts por hora
  message: {
    success: false,
    message: "Demasiados posts creados, intenta de nuevo en una hora",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Demasiados posts creados, intenta de nuevo en una hora",
      retryAfter: 3600, // 1 hora en segundos
    });
  },
});

// Rate limiter para búsquedas
export const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // 20 búsquedas por minuto
  message: {
    success: false,
    message: "Demasiadas búsquedas realizadas, intenta de nuevo en un minuto",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Demasiadas búsquedas realizadas, intenta de nuevo en un minuto",
      retryAfter: 60, // 1 minuto en segundos
    });
  },
});

// Rate limiter para actualizaciones de perfil
export const profileUpdateRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 actualizaciones por hora
  message: {
    success: false,
    message:
      "Demasiadas actualizaciones de perfil, intenta de nuevo en una hora",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Demasiadas actualizaciones de perfil, intenta de nuevo en una hora",
      retryAfter: 3600, // 1 hora en segundos
    });
  },
});

// Rate limiter para subida de archivos
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // 50 archivos por hora
  message: {
    success: false,
    message: "Demasiados archivos subidos, intenta de nuevo en una hora",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Demasiados archivos subidos, intenta de nuevo en una hora",
      retryAfter: 3600, // 1 hora en segundos
    });
  },
});
