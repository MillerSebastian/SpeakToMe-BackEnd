import dotenv from "dotenv";
import path from "path";

const envPath = process.env.ENV_PATH || path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

export const config = {
  // Configuración del servidor
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,

  // Configuración de base de datos
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  // Configuración JWT
  jwt: {
    secret: process.env.JWT_SECRET as string,
    expiresIn: "24h" as const,
    refreshExpiresIn: "7d" as const,
  },

  // Configuración de email
  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
  },

  // Configuración de archivos
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "5242880"), // 5MB
    uploadPath: process.env.UPLOAD_PATH || "uploads/",
  },

  // Configuración de rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutos
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  },

  // Configuración CORS
  cors: {
    origin:
      (process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
        : ["http://localhost:3000", "http://localhost:5173"]),
  },
};

