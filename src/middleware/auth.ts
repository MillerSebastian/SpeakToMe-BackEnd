import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "@/config";
import { UserModel } from "@/models/User";
import { JwtPayload } from "@/types";

// Middleware de autenticación
// Reemplaza toda la función authenticateToken con esto:
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Token de acceso requerido",
      });
      return;
    }

    console.log("🔐 Token recibido:", token.substring(0, 30) + "...");
    const jwtSecret =
      (config && config.jwt && config.jwt.secret) ||
      "98954c83c7c05d477560ba5a5d7692ae377204987f6d0cf879f5ddc3495a0f22"; // fallback
    const secretPreview = jwtSecret ? jwtSecret.substring(0, 20) + "..." : "(undefined)";
    console.log("🔐 Secret usado:", secretPreview);

    // Verificar el token
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    console.log("✅ Token decodificado:", decoded);

    // Buscar el usuario en la base de datos
    const user = await UserModel.findById(decoded.userId);

    if (!user || !user.is_active) {
      res.status(401).json({
        success: false,
        message: "Usuario no válido o inactivo",
      });
      return;
    }

    console.log("✅ Usuario encontrado, role_id:", user.role_id);

    // Agregar información del usuario a la request
    req.user = user;
    req.userId = user.id;
    req.roleId = user.role_id;

    next();
  } catch (error) {
    console.error("❌ Error en autenticación:", error);
    res.status(403).json({
      success: false,
      message: "Token inválido o expirado",
    });
  }
};

// Middleware para verificar roles específicos
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
      return;
    }

    // Obtener el nombre del rol del usuario
    const userRole = req.user.role_id;

    // Verificar si el usuario tiene uno de los roles permitidos
    // Nota: Aquí asumimos que los roles tienen IDs específicos
    // 1 = TL_MAYOR, 2 = PSYCHOLOGIST, 3 = STUDENT
    const roleMap: { [key: number]: string } = {
      1: "TL_MAYOR",
      2: "PSYCHOLOGIST",
      3: "STUDENT",
    };

    const userRoleName = roleMap[userRole];

    if (!userRoleName || !allowedRoles.includes(userRoleName)) {
      res.status(403).json({
        success: false,
        message: "No tienes permisos para acceder a este recurso",
      });
      return;
    }

    next();
  };
};

// Middleware para verificar si es TL Mayor
export const requireTLMayor = requireRole(["TL_MAYOR"]);

// Middleware para verificar si es Psicólogo
export const requirePsychologist = requireRole(["PSYCHOLOGIST", "TL_MAYOR"]);

// Middleware para verificar si es Estudiante
export const requireStudent = requireRole(["STUDENT", "TL_MAYOR"]);

// Middleware para verificar si es Psicólogo o TL Mayor
export const requirePsychologistOrTL = requireRole([
  "PSYCHOLOGIST",
  "TL_MAYOR",
]);

// Middleware para verificar si es Estudiante o TL Mayor
export const requireStudentOrTL = requireRole(["STUDENT", "TL_MAYOR"]);

// Middleware opcional de autenticación (no falla si no hay token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret as any) as JwtPayload;
      const user = await UserModel.findById(decoded.userId);

      if (user && user.is_active) {
        req.user = user;
        req.userId = user.id;
        req.roleId = user.role_id;
      }
    }

    next();
  } catch (error) {
    // En caso de error, continuar sin autenticación
    next();
  }
};

// Middleware para verificar si el usuario puede acceder a un recurso específico
export const requireOwnershipOrRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
      return;
    }

    const userRole = req.user.role_id;
    const roleMap: { [key: number]: string } = {
      1: "TL_MAYOR",
      2: "PSYCHOLOGIST",
      3: "STUDENT",
    };

    const userRoleName = roleMap[userRole];

    // Si tiene uno de los roles permitidos, puede acceder
    if (userRoleName && allowedRoles.includes(userRoleName)) {
      next();
      return;
    }

    // Si es TL Mayor, puede acceder a todo
    if (userRoleName === "TL_MAYOR") {
      next();
      return;
    }

    // Verificar si es el propietario del recurso
    const resourceUserId = parseInt(req.params.userId || req.params.id);

    if (req.userId === resourceUserId) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: "No tienes permisos para acceder a este recurso",
    });
  };
};

// Función para generar tokens
export const generateTokens = (
  userId: number,
  email: string,
  roleId: number
) => {
  const payload: JwtPayload = { userId, email, roleId };

  const signOptions: SignOptions = {
    expiresIn: config.jwt.expiresIn,
  };

  const jwtSecret =
    (config && config.jwt && config.jwt.secret) ||
    "98954c83c7c05d477560ba5a5d7692ae377204987f6d0cf879f5ddc3495a0f22"; // fallback

  const accessToken = jwt.sign(payload, jwtSecret, signOptions);

  const refreshSignOptions: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn,
  };

  const refreshToken = jwt.sign(payload, jwtSecret, refreshSignOptions);

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    console.log(
      "🔍 Verificando token con secret:",
      config.jwt.secret.substring(0, 20) + "..."
    );

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    console.log("✅ Token verificado:", decoded);

    return decoded;
  } catch (error) {
    console.error(
      "❌ Error verificando token:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
};

// Middleware para verificar refresh token
export const verifyRefreshToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: "Refresh token requerido",
      });
      return;
    }

    const jwtSecret =
      (config && config.jwt && config.jwt.secret) ||
      "98954c83c7c05d477560ba5a5d7692ae377204987f6d0cf879f5ddc3495a0f22"; // fallback
    const decoded = jwt.verify(refreshToken, jwtSecret as any) as JwtPayload;
    req.body.userId = decoded.userId;
    req.body.email = decoded.email;
    req.body.roleId = decoded.roleId;

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: "Refresh token inválido o expirado",
    });
  }
};
