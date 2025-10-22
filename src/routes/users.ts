import { Router } from "express";
import { UserController } from "@/controllers/userController";
import {
  updateUserSchema,
  registerSchema,
  validate,
  idParamSchema,
  userIdParamSchema,
  roleIdParamSchema,
  validateParams,
} from "@/middleware/validation";
import {
  authenticateToken,
  requireTLMayor,
  requireRole,
  requireOwnershipOrRole,
} from "@/middleware/auth";
import { profileUpdateRateLimit, searchRateLimit } from "@/middleware/rateLimiter";

const router = Router();

// Rutas que requieren autenticación
router.use(authenticateToken);

// ⭐ RUTAS ESPECÍFICAS PRIMERO (sin parámetros dinámicos)
// Obtener roles
router.get("/roles", UserController.getRoles);

// Obtener usuarios activos
router.get("/active", requireTLMayor, UserController.getActiveUsers);

// Obtener usuarios en línea
router.get("/online", UserController.getOnlineUsers);

// Buscar usuarios
router.get("/search", searchRateLimit, UserController.searchUsers);

// ⭐ RUTAS CON PARÁMETROS DINÁMICOS DESPUÉS
// Obtener todos los usuarios (roles 1, 2 y 3)
router.get(
  "/",
  requireRole(["TL_MAYOR", "PSYCHOLOGIST", "STUDENT"]),
  UserController.getAllUsers
);

// Obtener usuarios por rol
router.get(
  "/role/:roleId",
  validateParams(roleIdParamSchema),
  requireTLMayor,
  UserController.getUsersByRole
);

// Crear usuario (solo TL Mayor)
router.post(
  "/",
  requireTLMayor,
  validate(registerSchema),
  UserController.createUser
);

// Obtener usuario por ID
router.get(
  "/:id",
  validateParams(idParamSchema),
  requireOwnershipOrRole(["TL_MAYOR", "PSYCHOLOGIST"]),
  UserController.getUserById
);

// Actualizar usuario
router.put(
  "/:id",
  validateParams(idParamSchema),
  validate(updateUserSchema),
  profileUpdateRateLimit,
  requireOwnershipOrRole(["TL_MAYOR"]),
  UserController.updateUser
);

// Eliminar usuario (solo TL Mayor)
router.delete(
  "/:id",
  validateParams(idParamSchema),
  requireTLMayor,
  UserController.deleteUser
);

// Obtener estado de actividad de usuario
router.get(
  "/:userId/activity",
  validateParams(userIdParamSchema),
  requireOwnershipOrRole(["TL_MAYOR", "PSYCHOLOGIST"]),
  UserController.getUserActivity
);

// Actualizar estado de actividad (solo el propio usuario)
router.put(
  "/:userId/activity",
  validateParams(userIdParamSchema),
  requireOwnershipOrRole(["TL_MAYOR", "PSYCHOLOGIST", "STUDENT"]),
  UserController.updateUserActivity
);

export default router;
