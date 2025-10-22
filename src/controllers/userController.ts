import { Request, Response, NextFunction } from "express";
import { UserModel, UserActivityModel, RoleModel } from "@/models/User";
import { createError } from "@/middleware/errorHandler";
import { ApiResponse, PaginatedResponse } from "@/types";

export class UserController {
  // Obtener todos los usuarios (solo TL Mayor)
  static async getAllUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      console.log("🔍 Usuario autenticado:", req.user);
      console.log("🔍 roleId del request:", req.roleId);
      console.log("🔍 Rol esperado: TL_MAYOR (1)");

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const roleId = req.query.role_id
        ? parseInt(req.query.role_id as string)
        : undefined;

      const { users, total } = await UserModel.findAll(page, limit, roleId);
      const totalPages = Math.ceil(total / limit);

      const response: PaginatedResponse = {
        success: true,
        message: "Usuarios obtenidos exitosamente",
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("❌ Error en getAllUsers:", error);
      next(error);
    }
  }

  // Obtener usuario por ID
  static async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Usuario obtenido exitosamente",
        data: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          avatar_url: user.avatar_url,
          role_id: user.role_id,
          is_active: user.is_active,
          is_verified: user.is_verified,
          email_verified_at: user.email_verified_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login: user.last_login,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Crear usuario (solo TL Mayor)
  static async createUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userData = req.body;

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

      const response: ApiResponse = {
        success: true,
        message: "Usuario creado exitosamente",
        data: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          phone: newUser.phone,
          avatar_url: newUser.avatar_url,
          role_id: newUser.role_id,
          is_active: newUser.is_active,
          is_verified: newUser.is_verified,
          created_at: newUser.created_at,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Actualizar usuario
  static async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = parseInt(id);
      const updateData = req.body;

      // No permitir actualizar ciertos campos sensibles
      delete updateData.password_hash;
      delete updateData.id;
      delete updateData.created_at;

      // Si se está actualizando el email, verificar que no exista
      if (updateData.email) {
        const emailExists = await UserModel.emailExists(
          updateData.email,
          userId
        );
        if (emailExists) {
          res.status(409).json({
            success: false,
            message: "El email ya está en uso",
          });
          return;
        }
      }

      const updatedUser = await UserModel.update(userId, updateData);

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Usuario actualizado exitosamente",
        data: {
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
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Eliminar usuario (soft delete)
  static async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      const deleted = await UserModel.delete(userId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Usuario desactivado exitosamente",
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener roles
  static async getRoles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const roles = await RoleModel.findAll();

      const response: ApiResponse = {
        success: true,
        message: "Roles obtenidos exitosamente",
        data: roles,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener usuarios por rol
  static async getUsersByRole(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { roleId } = req.params;
      const role = parseInt(roleId);

      const users = await UserModel.findByRole(role);

      const response: ApiResponse = {
        success: true,
        message: "Usuarios obtenidos exitosamente",
        data: users.map((user) => ({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          avatar_url: user.avatar_url,
          role_id: user.role_id,
          is_active: user.is_active,
          is_verified: user.is_verified,
          created_at: user.created_at,
          last_login: user.last_login,
        })),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener usuarios activos
  static async getActiveUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const users = await UserModel.findActiveUsers();

      const response: ApiResponse = {
        success: true,
        message: "Usuarios activos obtenidos exitosamente",
        data: users.map((user) => ({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          avatar_url: user.avatar_url,
          role_id: user.role_id,
          is_active: user.is_active,
          is_verified: user.is_verified,
          created_at: user.created_at,
          last_login: user.last_login,
        })),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener estado de actividad de usuarios
  static async getUserActivity(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const user = parseInt(userId);

      const activity = await UserActivityModel.findByUserId(user);

      if (!activity) {
        res.status(404).json({
          success: false,
          message: "Estado de actividad no encontrado",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Estado de actividad obtenido exitosamente",
        data: activity,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Actualizar estado de actividad
  static async updateUserActivity(
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

      const activityData = req.body;
      const activity = await UserActivityModel.updateActivity(
        req.userId,
        activityData
      );

      const response: ApiResponse = {
        success: true,
        message: "Estado de actividad actualizado exitosamente",
        data: activity,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener usuarios en línea
  static async getOnlineUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const onlineUsers = await UserActivityModel.findOnlineUsers();

      const response: ApiResponse = {
        success: true,
        message: "Usuarios en línea obtenidos exitosamente",
        data: onlineUsers,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Buscar usuarios
  static async searchUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { q, role_id, is_active } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Implementar búsqueda por nombre, email, etc.
      // Por ahora, usar el método findAll con filtros
      const roleId = role_id ? parseInt(role_id as string) : undefined;
      const { users, total } = await UserModel.findAll(page, limit, roleId);

      // Filtrar por término de búsqueda si se proporciona
      let filteredUsers = users;
      if (q) {
        const searchTerm = (q as string).toLowerCase();
        filteredUsers = users.filter(
          (user) =>
            user.first_name.toLowerCase().includes(searchTerm) ||
            user.last_name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        );
      }

      const totalPages = Math.ceil(filteredUsers.length / limit);

      const response: PaginatedResponse = {
        success: true,
        message: "Búsqueda de usuarios completada",
        data: filteredUsers.map((user) => ({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          avatar_url: user.avatar_url,
          role_id: user.role_id,
          is_active: user.is_active,
          is_verified: user.is_verified,
          created_at: user.created_at,
          last_login: user.last_login,
        })),
        pagination: {
          page,
          limit,
          total: filteredUsers.length,
          totalPages,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
