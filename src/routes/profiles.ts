import { Router } from "express";
import {
  PsychologistProfileController,
  StudentProfileController,
  BlogPostController,
  NotificationController,
} from "@/controllers/profileController";
import {
  psychologistProfileSchema,
  studentProfileSchema,
  createBlogPostSchema,
  updateBlogPostSchema,
  createNotificationSchema,
  validate,
  idParamSchema,
  userIdParamSchema,
  validateParams,
} from "@/middleware/validation";
import {
  authenticateToken,
  requirePsychologistOrTL,
  requireStudentOrTL,
  requireTLMayor,
} from "@/middleware/auth";
import {
  generalRateLimit,
  blogPostRateLimit,
  profileUpdateRateLimit,
} from "@/middleware/rateLimiter";

const router = Router();

// Aplicar rate limiting general a todas las rutas
router.use(generalRateLimit);

// Rutas que requieren autenticación
router.use(authenticateToken);

// ==================== RUTAS DE PERFILES DE PSICÓLOGOS ====================

// Obtener todos los perfiles de psicólogos
router.get("/psychologists", PsychologistProfileController.getAllProfiles);

// Obtener psicólogos disponibles
router.get(
  "/psychologists/available",
  PsychologistProfileController.getAvailablePsychologists
);

// Obtener mi perfil de psicólogo
router.get(
  "/psychologists/my-profile",
  requirePsychologistOrTL,
  PsychologistProfileController.getMyProfile
);

// Crear perfil de psicólogo
router.post(
  "/psychologists",
  requirePsychologistOrTL,
  validate(psychologistProfileSchema),
  PsychologistProfileController.createProfile
);

// Obtener perfil de psicólogo por ID
router.get(
  "/psychologists/:id",
  validateParams(idParamSchema),
  PsychologistProfileController.getProfileById
);

// Obtener perfil de psicólogo por usuario
router.get(
  "/psychologists/user/:userId",
  validateParams(userIdParamSchema),
  PsychologistProfileController.getProfileByUser
);

// Actualizar perfil de psicólogo
router.put(
  "/psychologists/:id",
  validateParams(idParamSchema),
  validate(psychologistProfileSchema),
  profileUpdateRateLimit,
  requireTLMayor,
  PsychologistProfileController.updateProfile
);

// Actualizar mi perfil de psicólogo
router.put(
  "/psychologists/my-profile",
  validate(psychologistProfileSchema),
  profileUpdateRateLimit,
  requirePsychologistOrTL,
  PsychologistProfileController.updateMyProfile
);

// ==================== RUTAS DE PERFILES DE ESTUDIANTES ====================

// Obtener todos los perfiles de estudiantes
router.get(
  "/students",
  requireTLMayor,
  StudentProfileController.getAllProfiles
);

// Obtener mi perfil de estudiante
router.get(
  "/students/my-profile",
  requireStudentOrTL,
  StudentProfileController.getMyProfile
);

// Crear perfil de estudiante
router.post(
  "/students",
  requireStudentOrTL,
  validate(studentProfileSchema),
  StudentProfileController.createProfile
);

// Obtener perfil de estudiante por ID
router.get(
  "/students/:id",
  validateParams(idParamSchema),
  StudentProfileController.getProfileById
);

// Obtener perfil de estudiante por usuario
router.get(
  "/students/user/:userId",
  validateParams(userIdParamSchema),
  StudentProfileController.getProfileByUser
);

// Actualizar perfil de estudiante
router.put(
  "/students/:id",
  validateParams(idParamSchema),
  validate(studentProfileSchema),
  profileUpdateRateLimit,
  requireTLMayor,
  StudentProfileController.updateProfile
);

// Actualizar mi perfil de estudiante
router.put(
  "/students/my-profile",
  validate(studentProfileSchema),
  profileUpdateRateLimit,
  requireStudentOrTL,
  StudentProfileController.updateMyProfile
);

// ==================== RUTAS DE BLOG POSTS ====================

// Obtener todos los posts
router.get("/blog-posts", BlogPostController.getAllPosts);

// Obtener mis posts
router.get("/blog-posts/my-posts", BlogPostController.getMyPosts);

// Crear post
router.post(
  "/blog-posts",
  blogPostRateLimit,
  validate(createBlogPostSchema),
  BlogPostController.createPost
);

// Obtener post por ID
router.get(
  "/blog-posts/:id",
  validateParams(idParamSchema),
  BlogPostController.getPostById
);

// Actualizar post
router.put(
  "/blog-posts/:id",
  validateParams(idParamSchema),
  validate(updateBlogPostSchema),
  BlogPostController.updatePost
);

// Eliminar post
router.delete(
  "/blog-posts/:id",
  validateParams(idParamSchema),
  BlogPostController.deletePost
);

// Dar like a post
router.post(
  "/blog-posts/:id/like",
  validateParams(idParamSchema),
  BlogPostController.likePost
);

// ==================== RUTAS DE NOTIFICACIONES ====================

// Obtener mis notificaciones
router.get("/notifications", NotificationController.getMyNotifications);

// Contar notificaciones no leídas
router.get("/notifications/unread-count", NotificationController.countUnread);

// Crear notificación (solo TL Mayor)
router.post(
  "/notifications",
  requireTLMayor,
  validate(createNotificationSchema),
  NotificationController.createNotification
);

// Obtener notificaciones por usuario (solo TL Mayor)
router.get(
  "/notifications/user/:userId",
  validateParams(userIdParamSchema),
  requireTLMayor,
  NotificationController.getNotificationsByUser
);

// Marcar notificación como leída
router.put(
  "/notifications/:id/read",
  validateParams(idParamSchema),
  NotificationController.markAsRead
);

// Marcar todas las notificaciones como leídas
router.put("/notifications/read-all", NotificationController.markAllAsRead);

// Eliminar notificación
router.delete(
  "/notifications/:id",
  validateParams(idParamSchema),
  NotificationController.deleteNotification
);

export default router;
