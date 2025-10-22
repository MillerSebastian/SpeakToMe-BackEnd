import winston from "winston";
import { config } from "@/config";

// Configuración de niveles de log personalizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Configuración de colores para los logs
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Formato personalizado para los logs
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Configuración de transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: config.nodeEnv === "development" ? "debug" : "info",
  }),

  // File transport para errores
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),

  // File transport para todos los logs
  new winston.transports.File({
    filename: "logs/combined.log",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
];

// Crear el logger
const logger = winston.createLogger({
  level: config.nodeEnv === "development" ? "debug" : "info",
  levels,
  format,
  transports,
  exitOnError: false,
});

// Stream para Morgan (HTTP request logging)
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Función para logging de requests HTTP
export const logRequest = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      userId: req.userId || "anonymous",
    };

    if (res.statusCode >= 400) {
      logger.error(
        `HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`,
        logData
      );
    } else {
      logger.http(
        `HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`,
        logData
      );
    }
  });

  next();
};

// Función para logging de errores de base de datos
export const logDatabaseError = (
  error: any,
  operation: string,
  table?: string
) => {
  logger.error(`Database Error in ${operation}${table ? ` on ${table}` : ""}`, {
    error: error.message,
    code: error.code,
    sqlState: error.sqlState,
    sqlMessage: error.sqlMessage,
    stack: error.stack,
  });
};

// Función para logging de autenticación
export const logAuth = (
  action: string,
  userId?: number,
  email?: string,
  success: boolean = true
) => {
  const level = success ? "info" : "warn";
  logger[level](`Auth ${action}`, {
    userId,
    email,
    success,
    timestamp: new Date().toISOString(),
  });
};

// Función para logging de operaciones de negocio
export const logBusiness = (
  operation: string,
  entity: string,
  entityId?: number,
  userId?: number
) => {
  logger.info(`Business Operation: ${operation}`, {
    entity,
    entityId,
    userId,
    timestamp: new Date().toISOString(),
  });
};

// Función para logging de seguridad
export const logSecurity = (event: string, details: any) => {
  logger.warn(`Security Event: ${event}`, {
    ...details,
    timestamp: new Date().toISOString(),
  });
};

// Función para logging de performance
export const logPerformance = (
  operation: string,
  duration: number,
  details?: any
) => {
  const level = duration > 1000 ? "warn" : "info";
  logger[level](`Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

export default logger;
