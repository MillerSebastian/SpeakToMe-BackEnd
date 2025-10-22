import { Request, Response, NextFunction } from "express";
import { config } from "@/config";

// Interfaz para errores personalizados
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Clase para errores personalizados
export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware principal de manejo de errores
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let { statusCode = 500, message } = error;

  // Log del error
  console.error("Error:", {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  });

  // Manejo de errores específicos
  if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Datos de validación inválidos";
  }

  if (error.name === "CastError") {
    statusCode = 400;
    message = "Formato de ID inválido";
  }

  if (error.name === "MongoError" && (error as any).code === 11000) {
    statusCode = 409;
    message = "Recurso duplicado";
  }

  if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Token inválido";
  }

  if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expirado";
  }

  // Respuesta de error
  const response: any = {
    success: false,
    message: message || "Error interno del servidor",
  };

  // Incluir detalles del error en desarrollo
  if (config.nodeEnv === "development") {
    response.error = error.message;
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

// Middleware para manejar rutas no encontradas
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new CustomError(`Ruta no encontrada: ${req.originalUrl}`, 404);
  next(error);
};

// Middleware para manejar errores de sintaxis JSON
export const jsonErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({
      success: false,
      message: "JSON inválido en el cuerpo de la petición",
    });
    return;
  }
  next(error);
};

// Middleware para manejar errores de base de datos
export const databaseErrorHandler = (error: any): CustomError => {
  if (error.code === "ER_DUP_ENTRY") {
    return new CustomError("El recurso ya existe", 409);
  }

  if (error.code === "ER_NO_REFERENCED_ROW_2") {
    return new CustomError("Referencia a recurso inexistente", 400);
  }

  if (error.code === "ER_ROW_IS_REFERENCED_2") {
    return new CustomError(
      "No se puede eliminar el recurso porque está siendo utilizado",
      409
    );
  }

  if (error.code === "ER_ACCESS_DENIED_ERROR") {
    return new CustomError("Error de acceso a la base de datos", 500);
  }

  if (error.code === "ECONNREFUSED") {
    return new CustomError("No se puede conectar a la base de datos", 500);
  }

  return new CustomError("Error de base de datos", 500);
};

// Función para crear errores personalizados
export const createError = (
  message: string,
  statusCode: number = 500
): CustomError => {
  return new CustomError(message, statusCode);
};

// Función para manejar errores asíncronos
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware para validar errores de archivos
export const fileErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({
      success: false,
      message: "El archivo es demasiado grande",
    });
    return;
  }

  if (error.code === "LIMIT_FILE_COUNT") {
    res.status(400).json({
      success: false,
      message: "Demasiados archivos",
    });
    return;
  }

  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    res.status(400).json({
      success: false,
      message: "Campo de archivo inesperado",
    });
    return;
  }

  next(error);
};

// Middleware para manejar errores de CORS
export const corsErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error) {
    res.status(403).json({
      success: false,
      message: "Error de CORS: Acceso no permitido",
    });
    return;
  }
  next();
};
