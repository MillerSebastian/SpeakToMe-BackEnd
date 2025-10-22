import { Request, Response, NextFunction } from "express";
import { MessageModel } from "@/models/Message";
import { createError } from "@/middleware/errorHandler";
import { ApiResponse, PaginatedResponse } from "@/types";

export class MessageController {
  // Enviar mensaje
  static async sendMessage(
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

      const messageData = {
        sender_id: req.userId,
        ...req.body,
      };

      const newMessage = await MessageModel.create(messageData);

      const response: ApiResponse = {
        success: true,
        message: "Mensaje enviado exitosamente",
        data: newMessage,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener mensaje por ID
  static async getMessageById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const messageId = parseInt(id);

      const message = await MessageModel.findById(messageId);

      if (!message) {
        res.status(404).json({
          success: false,
          message: "Mensaje no encontrado",
        });
        return;
      }

      // Propiedad: solo emisor/receptor o admin (role 1) pueden ver el mensaje
      if (!req.userId) {
        res.status(401).json({ success: false, message: "Usuario no autenticado" });
        return;
      }
      const isAdmin = req.roleId === 1;
      const isOwner = req.userId === message.sender_id || req.userId === message.recipient_id;
      if (!isAdmin && !isOwner) {
        res.status(403).json({
          success: false,
          message: "No tienes permisos para acceder a este mensaje",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Mensaje obtenido exitosamente",
        data: message,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener conversación entre dos usuarios
  static async getConversation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId1, userId2 } = req.params;
      const user1 = parseInt(userId1);
      const user2 = parseInt(userId2);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      // Propiedad: solo participantes pueden ver la conversación, excepto admin (role 1)
      if (!req.userId) {
        res.status(401).json({ success: false, message: "Usuario no autenticado" });
        return;
      }
      const isAdmin = req.roleId === 1;
      const isParticipant = req.userId === user1 || req.userId === user2;
      if (!isAdmin && !isParticipant) {
        res.status(403).json({
          success: false,
          message: "No tienes permisos para acceder a esta conversación",
        });
        return;
      }

      const { messages, total } = await MessageModel.findConversation(
        user1,
        user2,
        page,
        limit
      );
      const totalPages = Math.ceil(total / limit);

      const response: PaginatedResponse = {
        success: true,
        message: "Conversación obtenida exitosamente",
        data: messages,
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

  // Obtener mis conversaciones (para usuario autenticado)
  static async getMyConversations(
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

      const { messages, total } = await MessageModel.findByUser(
        req.userId,
        page,
        limit
      );
      const totalPages = Math.ceil(total / limit);

      const response: PaginatedResponse = {
        success: true,
        message: "Mis conversaciones obtenidas exitosamente",
        data: messages,
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

  // Obtener conversaciones recientes
  static async getRecentConversations(
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

      const conversations = await MessageModel.getRecentConversations(
        req.userId
      );

      const response: ApiResponse = {
        success: true,
        message: "Conversaciones recientes obtenidas exitosamente",
        data: conversations,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener mensajes no leídos
  static async getUnreadMessages(
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

      const unreadMessages = await MessageModel.findUnreadByUser(req.userId);

      const response: ApiResponse = {
        success: true,
        message: "Mensajes no leídos obtenidos exitosamente",
        data: unreadMessages,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Marcar mensaje como leído
  static async markAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const messageId = parseInt(id);

      const message = await MessageModel.markAsRead(messageId);

      if (!message) {
        res.status(404).json({
          success: false,
          message: "Mensaje no encontrado",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Mensaje marcado como leído",
        data: message,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Marcar conversación como leída
  static async markConversationAsRead(
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

      const { senderId } = req.params;
      const sender = parseInt(senderId);

      await MessageModel.markConversationAsRead(sender, req.userId);

      const response: ApiResponse = {
        success: true,
        message: "Conversación marcada como leída",
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener mensajes por cita
  static async getMessagesByAppointment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { appointmentId } = req.params;
      const appointment = parseInt(appointmentId);

      const messages = await MessageModel.findByAppointment(appointment);

      const response: ApiResponse = {
        success: true,
        message: "Mensajes de la cita obtenidos exitosamente",
        data: messages,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Buscar mensajes
  static async searchMessages(
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

      const { q } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!q) {
        res.status(400).json({
          success: false,
          message: "Término de búsqueda requerido",
        });
        return;
      }

      const { messages, total } = await MessageModel.search(
        req.userId,
        q as string,
        page,
        limit
      );

      const totalPages = Math.ceil(total / limit);

      const response: PaginatedResponse = {
        success: true,
        message: "Búsqueda de mensajes completada",
        data: messages,
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

  // Eliminar mensaje
  static async deleteMessage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const messageId = parseInt(id);

      const deleted = await MessageModel.delete(messageId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Mensaje no encontrado",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Mensaje eliminado exitosamente",
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener estadísticas de mensajes
  static async getMessageStatistics(
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

      const unreadMessages = await MessageModel.findUnreadByUser(req.userId);
      const recentConversations = await MessageModel.getRecentConversations(
        req.userId
      );

      const statistics = {
        total_unread: unreadMessages.length,
        total_conversations: recentConversations.length,
        unread_by_conversation: recentConversations.map((conv) => ({
          other_user_id: conv.other_user_id,
          other_user_name: `${conv.other_user_first_name} ${conv.other_user_last_name}`,
          unread_count: conv.unread_messages || 0,
        })),
      };

      const response: ApiResponse = {
        success: true,
        message: "Estadísticas de mensajes obtenidas exitosamente",
        data: statistics,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
