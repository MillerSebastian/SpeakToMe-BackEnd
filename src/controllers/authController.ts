import { Request, Response, NextFunction } from "express";
import { UserModel, UserActivityModel } from "@/models/User";
import { generateTokens } from "@/middleware/auth";
import { createError } from "@/middleware/errorHandler";
import { LoginRequest, RegisterRequest, ApiResponse } from "@/types";

export class AuthController {
  // Registro de usuario
  static async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userData: RegisterRequest = req.body;

      // Verificar si el email ya existe
      const existingUser = await UserModel.findByEmail(userData.email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: "El email ya está registrado",
        });
        return;
      }

      // Hash de la contraseña
      const passwordHash = await UserModel.hashPassword(userData.password);

      // Crear usuario
      const newUser = await UserModel.create({
        ...userData,
        password_hash: passwordHash,
        is_active: true,
        is_verified: false,
      });

      // Generar tokens
      const { accessToken, refreshToken } = generateTokens(
        newUser.id,
        newUser.email,
        newUser.role_id
      );

      // Crear estado de actividad inicial
      await UserActivityModel.updateActivity(newUser.id, {
        is_online: false,
        status: "offline",
      });

      const response: ApiResponse = {
        success: true,
        message: "Usuario registrado exitosamente",
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            role_id: newUser.role_id,
            is_active: newUser.is_active,
            is_verified: newUser.is_verified,
            created_at: newUser.created_at,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Inicio de sesión
  static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      // Buscar usuario por email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
        return;
      }

      // Verificar si el usuario está activo
      if (!user.is_active) {
        res.status(401).json({
          success: false,
          message: "Cuenta desactivada",
        });
        return;
      }

      // Verificar contraseña
      const isValidPassword = await UserModel.verifyPassword(
        password,
        user.password_hash
      );
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
        return;
      }

      // Actualizar último login
      await UserModel.updateLastLogin(user.id);

      // Actualizar estado de actividad
      await UserActivityModel.updateActivity(user.id, {
        is_online: true,
        status: "online",
      });

      // Generar tokens
      const { accessToken, refreshToken } = generateTokens(
        user.id,
        user.email,
        user.role_id
      );

      const response: ApiResponse = {
        success: true,
        message: "Inicio de sesión exitoso",
        data: {
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role_id: user.role_id,
            is_active: user.is_active,
            is_verified: user.is_verified,
            last_login: user.last_login,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Cerrar sesión
  static async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (req.userId) {
        // Actualizar estado de actividad a offline
        await UserActivityModel.setOffline(req.userId);
      }

      const response: ApiResponse = {
        success: true,
        message: "Sesión cerrada exitosamente",
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Refrescar token
  static async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId, email, roleId } = req.body;

      // Verificar que el usuario existe y está activo
      const user = await UserModel.findById(userId);
      if (!user || !user.is_active) {
        res.status(401).json({
          success: false,
          message: "Usuario no válido o inactivo",
        });
        return;
      }

      // Generar nuevos tokens
      const { accessToken, refreshToken } = generateTokens(
        userId,
        email,
        roleId
      );

      const response: ApiResponse = {
        success: true,
        message: "Token refrescado exitosamente",
        data: {
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener perfil del usuario autenticado
  static async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Perfil obtenido exitosamente",
        data: {
          user: {
            id: req.user.id,
            email: req.user.email,
            first_name: req.user.first_name,
            last_name: req.user.last_name,
            phone: req.user.phone,
            avatar_url: req.user.avatar_url,
            role_id: req.user.role_id,
            is_active: req.user.is_active,
            is_verified: req.user.is_verified,
            email_verified_at: req.user.email_verified_at,
            created_at: req.user.created_at,
            updated_at: req.user.updated_at,
            last_login: req.user.last_login,
          },
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Actualizar perfil del usuario autenticado
  static async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }

      const updateData = req.body;

      // No permitir actualizar ciertos campos sensibles
      delete updateData.password_hash;
      delete updateData.role_id;
      delete updateData.id;
      delete updateData.created_at;

      // Si se está actualizando el email, verificar que no exista
      if (updateData.email) {
        const emailExists = await UserModel.emailExists(
          updateData.email,
          req.userId
        );
        if (emailExists) {
          res.status(409).json({
            success: false,
            message: "El email ya está en uso",
          });
          return;
        }
      }

      const updatedUser = await UserModel.update(req.userId, updateData);

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Perfil actualizado exitosamente",
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            phone: updatedUser.phone,
            avatar_url: updatedUser.avatar_url,
            role_id: updatedUser.role_id,
            is_active: updatedUser.is_active,
            is_verified: updatedUser.is_verified,
            email_verified_at: updatedUser.email_verified_at,
            created_at: updatedUser.created_at,
            updated_at: updatedUser.updated_at,
            last_login: updatedUser.last_login,
          },
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Cambiar contraseña
  static async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      // Obtener usuario actual
      const user = await UserModel.findById(req.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      // Verificar contraseña actual
      const isValidPassword = await UserModel.verifyPassword(
        currentPassword,
        user.password_hash
      );
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          message: "Contraseña actual incorrecta",
        });
        return;
      }

      // Hash de la nueva contraseña
      const newPasswordHash = await UserModel.hashPassword(newPassword);

      // Actualizar contraseña
      await UserModel.update(req.userId, { password_hash: newPasswordHash });

      const response: ApiResponse = {
        success: true,
        message: "Contraseña actualizada exitosamente",
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Verificar token (para validar si el token es válido)
  static async verifyToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: ApiResponse = {
        success: true,
        message: "Token válido",
        data: {
          user: {
            id: req.user?.id,
            email: req.user?.email,
            role_id: req.user?.role_id,
          },
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
