import { Request, Response, NextFunction } from "express";
import {
  PsychologistProfileModel,
  StudentProfileModel,
  BlogPostModel,
  NotificationModel,
} from "@/models/Profile";
import { createError } from "@/middleware/errorHandler";
import { ApiResponse, PaginatedResponse } from "@/types";

export class PsychologistProfileController {
  // Crear perfil de psicólogo
  static async createProfile(
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

      // Verificar si ya tiene perfil
      const existingProfile = await PsychologistProfileModel.findByUserId(
        req.userId
      );
      if (existingProfile) {
        res.status(409).json({
          success: false,
          message: "Ya tienes un perfil de psicólogo",
        });
        return;
      }

      // Verificar si el número de licencia ya existe
      const licenseExists = await PsychologistProfileModel.licenseExists(
        req.body.license_number
      );
      if (licenseExists) {
        res.status(409).json({
          success: false,
          message: "El número de licencia ya está en uso",
        });
        return;
      }

      const profileData = {
        user_id: req.userId,
        ...req.body,
      };

      const newProfile = await PsychologistProfileModel.create(profileData);

      const response: ApiResponse = {
        success: true,
        message: "Perfil de psicólogo creado exitosamente",
        data: newProfile,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener perfil por ID
  static async getProfileById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const profileId = parseInt(id);

      const profile = await PsychologistProfileModel.findById(profileId);

      if (!profile) {
        res.status(404).json({
          success: false,
          message: "Perfil no encontrado",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Perfil obtenido exitosamente",
        data: profile,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener perfil por usuario
  static async getProfileByUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const user = parseInt(userId);

      const profile = await PsychologistProfileModel.findByUserId(user);

      if (!profile) {
        res.status(404).json({
          success: false,
          message: "Perfil no encontrado",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Perfil obtenido exitosamente",
        data: profile,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener mi perfil (para psicólogo autenticado)
  static async getMyProfile(
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

      const profile = await PsychologistProfileModel.findByUserId(req.userId);

      if (!profile) {
        res.status(404).json({
          success: false,
          message: "No tienes un perfil de psicólogo",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Mi perfil obtenido exitosamente",
        data: profile,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener todos los perfiles de psicólogos
  static async getAllProfiles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filters = {
        specialty: req.query.specialty as string,
        is_available: req.query.is_available
          ? req.query.is_available === "true"
          : undefined,
      };

      const { profiles, total } = await PsychologistProfileModel.findAll(
        page,
        limit,
        filters
      );
      const totalPages = Math.ceil(total / limit);

      const response: PaginatedResponse = {
        success: true,
        message: "Perfiles de psicólogos obtenidos exitosamente",
        data: profiles,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Actualizar perfil
  static async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const profileId = parseInt(id);
      const updateData = req.body;

      // Si se está actualizando el número de licencia, verificar que no exista
      if (updateData.license_number) {
        const licenseExists = await PsychologistProfileModel.licenseExists(
          updateData.license_number,
          profileId
        );
        if (licenseExists) {
          res.status(409).json({
            success: false,
            message: "El número de licencia ya está en uso",
          });
          return;
        }
      }

      const updatedProfile = await PsychologistProfileModel.update(
        profileId,
        updateData
      );

      if (!updatedProfile) {
        res.status(404).json({
          success: false,
          message: "Perfil no encontrado",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Perfil actualizado exitosamente",
        data: updatedProfile,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Actualizar mi perfil
  static async updateMyProfile(
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

      // Si se está actualizando el número de licencia, verificar que no exista
      if (updateData.license_number) {
        const licenseExists = await PsychologistProfileModel.licenseExists(
          updateData.license_number,
          req.userId
        );
        if (licenseExists) {
          res.status(409).json({
            success: false,
            message: "El número de licencia ya está en uso",
          });
          return;
        }
      }

      const updatedProfile = await PsychologistProfileModel.updateByUserId(
        req.userId,
        updateData
      );

      if (!updatedProfile) {
        res.status(404).json({
          success: false,
          message: "No tienes un perfil de psicólogo",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Mi perfil actualizado exitosamente",
        data: updatedProfile,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener psicólogos disponibles
  static async getAvailablePsychologists(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const psychologists = await PsychologistProfileModel.findAvailable();

      const response: ApiResponse = {
        success: true,
        message: "Psicólogos disponibles obtenidos exitosamente",
        data: psychologists,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export class StudentProfileController {
  // Crear perfil de estudiante
  static async createProfile(
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

      // Verificar si ya tiene perfil
      const existingProfile = await StudentProfileModel.findByUserId(
        req.userId
      );
      if (existingProfile) {
        res.status(409).json({
          success: false,
          message: "Ya tienes un perfil de estudiante",
        });
        return;
      }

      // Verificar si el student_id ya existe
      const studentIdExists = await StudentProfileModel.studentIdExists(
        req.body.student_id
      );
      if (studentIdExists) {
        res.status(409).json({
          success: false,
          message: "El ID de estudiante ya está en uso",
        });
        return;
      }

      const profileData = {
        user_id: req.userId,
        ...req.body,
      };

      const newProfile = await StudentProfileModel.create(profileData);

      const response: ApiResponse = {
        success: true,
        message: "Perfil de estudiante creado exitosamente",
        data: newProfile,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener perfil por ID
  static async getProfileById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const profileId = parseInt(id);

      const profile = await StudentProfileModel.findById(profileId);

      if (!profile) {
        res.status(404).json({
          success: false,
          message: "Perfil no encontrado",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Perfil obtenido exitosamente",
        data: profile,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener perfil por usuario
  static async getProfileByUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const user = parseInt(userId);

      const profile = await StudentProfileModel.findByUserId(user);

      if (!profile) {
        res.status(404).json({
          success: false,
          message: "Perfil no encontrado",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Perfil obtenido exitosamente",
        data: profile,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener mi perfil (para estudiante autenticado)
  static async getMyProfile(
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

      const profile = await StudentProfileModel.findByUserId(req.userId);

      if (!profile) {
        res.status(404).json({
          success: false,
          message: "No tienes un perfil de estudiante",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Mi perfil obtenido exitosamente",
        data: profile,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener todos los perfiles de estudiantes
  static async getAllProfiles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filters = {
        program: req.query.program as string,
        semester: req.query.semester
          ? parseInt(req.query.semester as string)
          : undefined,
      };

      const { profiles, total } = await StudentProfileModel.findAll(
        page,
        limit,
        filters
      );
      const totalPages = Math.ceil(total / limit);

      const response: PaginatedResponse = {
        success: true,
        message: "Perfiles de estudiantes obtenidos exitosamente",
        data: profiles,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Actualizar perfil
  static async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const profileId = parseInt(id);
      const updateData = req.body;

      // Si se está actualizando el student_id, verificar que no exista
      if (updateData.student_id) {
        const studentIdExists = await StudentProfileModel.studentIdExists(
          updateData.student_id,
          profileId
        );
        if (studentIdExists) {
          res.status(409).json({
            success: false,
            message: "El ID de estudiante ya está en uso",
          });
          return;
        }
      }

      const updatedProfile = await StudentProfileModel.update(
        profileId,
        updateData
      );

      if (!updatedProfile) {
        res.status(404).json({
          success: false,
          message: "Perfil no encontrado",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Perfil actualizado exitosamente",
        data: updatedProfile,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Actualizar mi perfil
  static async updateMyProfile(
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

      // Si se está actualizando el student_id, verificar que no exista
      if (updateData.student_id) {
        const studentIdExists = await StudentProfileModel.studentIdExists(
          updateData.student_id,
          req.userId
        );
        if (studentIdExists) {
          res.status(409).json({
            success: false,
            message: "El ID de estudiante ya está en uso",
          });
          return;
        }
      }

      const updatedProfile = await StudentProfileModel.updateByUserId(
        req.userId,
        updateData
      );

      if (!updatedProfile) {
        res.status(404).json({
          success: false,
          message: "No tienes un perfil de estudiante",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Mi perfil actualizado exitosamente",
        data: updatedProfile,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export class BlogPostController {
  // Crear post de blog
  static async createPost(
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

      const postData = {
        author_id: req.userId,
        ...req.body,
      };

      const newPost = await BlogPostModel.create(postData);

      const response: ApiResponse = {
        success: true,
        message: "Post creado exitosamente",
        data: newPost,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener post por ID
  static async getPostById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const postId = parseInt(id);

      const post = await BlogPostModel.findById(postId);

      if (!post) {
        res.status(404).json({
          success: false,
          message: "Post no encontrado",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Post obtenido exitosamente",
        data: post,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener todos los posts
  static async getAllPosts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawPage = Number(req.query.page);
      const rawLimit = Number(req.query.limit);
      const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
      const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(Math.min(rawLimit, 100)) : 10;

      const filters = {
        status_mood: req.query.status_mood as string,
        is_published: req.query.is_published
          ? req.query.is_published === "true"
          : undefined,
        author_id: req.query.author_id
          ? parseInt(req.query.author_id as string)
          : undefined,
      };

      const { posts, total } = await BlogPostModel.findAll(page, limit, filters);
      const totalPages = Math.ceil(total / limit);

      const response: PaginatedResponse = {
        success: true,
        message: "Posts obtenidos exitosamente",
        data: posts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener mis posts
  static async getMyPosts(
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

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { posts, total } = await BlogPostModel.findByAuthor(
        req.userId,
        page,
        limit
      );
      const totalPages = Math.ceil(total / limit);

      const response: PaginatedResponse = {
        success: true,
        message: "Mis posts obtenidos exitosamente",
        data: posts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Actualizar post
  static async updatePost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const postId = parseInt(id);
      const updateData = req.body;

      const updatedPost = await BlogPostModel.update(postId, updateData);

      if (!updatedPost) {
        res.status(404).json({
          success: false,
          message: "Post no encontrado",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Post actualizado exitosamente",
        data: updatedPost,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Eliminar post
  static async deletePost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const postId = parseInt(id);

      const deleted = await BlogPostModel.delete(postId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Post no encontrado",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Post eliminado exitosamente",
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Dar like a post
  static async likePost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const postId = parseInt(id);

      const updatedPost = await BlogPostModel.incrementLikes(postId);

      if (!updatedPost) {
        res.status(404).json({
          success: false,
          message: "Post no encontrado",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Like agregado exitosamente",
        data: updatedPost,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export class NotificationController {
  // Crear notificación
  static async createNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const notificationData = req.body;
      const newNotification = await NotificationModel.create(notificationData);

      const response: ApiResponse = {
        success: true,
        message: "Notificación creada exitosamente",
        data: newNotification,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener notificaciones por usuario
  static async getNotificationsByUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const user = parseInt(userId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const unreadOnly = req.query.unread_only === "true";

      const { notifications, total } = await NotificationModel.findByUser(
        user,
        page,
        limit,
        unreadOnly
      );
      const totalPages = Math.ceil(total / limit);

      const response: PaginatedResponse = {
        success: true,
        message: "Notificaciones obtenidas exitosamente",
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener mis notificaciones
  static async getMyNotifications(
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

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const unreadOnly = req.query.unread_only === "true";

      const { notifications, total } = await NotificationModel.findByUser(
        req.userId,
        page,
        limit,
        unreadOnly
      );
      const totalPages = Math.ceil(total / limit);

      const response: PaginatedResponse = {
        success: true,
        message: "Mis notificaciones obtenidas exitosamente",
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Marcar notificación como leída
  static async markAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const notificationId = parseInt(id);

      const notification = await NotificationModel.markAsRead(notificationId);

      if (!notification) {
        res.status(404).json({
          success: false,
          message: "Notificación no encontrada",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Notificación marcada como leída",
        data: notification,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Marcar todas las notificaciones como leídas
  static async markAllAsRead(
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

      await NotificationModel.markAllAsRead(req.userId);

      const response: ApiResponse = {
        success: true,
        message: "Todas las notificaciones marcadas como leídas",
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Contar notificaciones no leídas
  static async countUnread(
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

      const count = await NotificationModel.countUnread(req.userId);

      const response: ApiResponse = {
        success: true,
        message: "Conteo de notificaciones no leídas",
        data: {
          unread_count: count,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Eliminar notificación
  static async deleteNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const notificationId = parseInt(id);

      const deleted = await NotificationModel.delete(notificationId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Notificación no encontrada",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Notificación eliminada exitosamente",
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
