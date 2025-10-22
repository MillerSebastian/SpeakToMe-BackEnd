import { Router } from "express";
import { MessageController } from "@/controllers/messageController";
import {
  createMessageSchema,
  validate,
  idParamSchema,
  conversationUsersParamSchema,
  senderIdParamSchema,
  validateParams,
} from "@/middleware/validation";
import { authenticateToken } from "@/middleware/auth";
import { generalRateLimit, messageRateLimit } from "@/middleware/rateLimiter";

const router = Router();

// Aplicar rate limiting general a todas las rutas
router.use(generalRateLimit);

// Rutas que requieren autenticación
router.use(authenticateToken);

// Obtener mis conversaciones
router.get("/conversations", MessageController.getMyConversations);

// Obtener conversaciones recientes
router.get("/recent", MessageController.getRecentConversations);

// Obtener mensajes no leídos
router.get("/unread", MessageController.getUnreadMessages);

// Obtener estadísticas de mensajes
router.get("/statistics", MessageController.getMessageStatistics);

// Buscar mensajes
router.get("/search", messageRateLimit, MessageController.searchMessages);

// Enviar mensaje
router.post(
  "/",
  messageRateLimit,
  validate(createMessageSchema),
  MessageController.sendMessage
);

// Obtener mensaje por ID
router.get(
  "/:id",
  validateParams(idParamSchema),
  MessageController.getMessageById
);

// Marcar mensaje como leído
router.put(
  "/:id/read",
  validateParams(idParamSchema),
  MessageController.markAsRead
);

// Eliminar mensaje
router.delete(
  "/:id",
  validateParams(idParamSchema),
  MessageController.deleteMessage
);

// Obtener conversación entre dos usuarios
router.get(
  "/conversation/:userId1/:userId2",
  validateParams(conversationUsersParamSchema),
  MessageController.getConversation
);

// Marcar conversación como leída
router.put(
  "/conversation/:senderId/read",
  validateParams(senderIdParamSchema),
  MessageController.markConversationAsRead
);

// Obtener mensajes por cita
router.get(
  "/appointment/:appointmentId",
  validateParams(idParamSchema),
  MessageController.getMessagesByAppointment
);

export default router;
