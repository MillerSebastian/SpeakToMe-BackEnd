import { Router } from "express";
import { AuthController } from "@/controllers/authController";
import {
  registerSchema,
  loginSchema,
  updateUserSchema,
  validate,
} from "@/middleware/validation";
import { authenticateToken, verifyRefreshToken } from "@/middleware/auth";
import { authRateLimit, registerRateLimit } from "@/middleware/rateLimiter";

const router = Router();

// Rutas de autenticación
router.post(
  "/register",
  registerRateLimit,
  validate(registerSchema),
  AuthController.register
);

router.post(
  "/login",
  authRateLimit,
  validate(loginSchema),
  AuthController.login
);

router.post("/logout", authenticateToken, AuthController.logout);

router.post("/refresh-token", verifyRefreshToken, AuthController.refreshToken);

router.get("/profile", authenticateToken, AuthController.getProfile);

router.put(
  "/profile",
  authenticateToken,
  validate(updateUserSchema),
  AuthController.updateProfile
);

router.post(
  "/change-password",
  authenticateToken,
  AuthController.changePassword
);

router.get("/verify-token", authenticateToken, AuthController.verifyToken);

export default router;
