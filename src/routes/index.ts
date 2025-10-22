import { Router } from "express";
import authRoutes from "./auth";
import userRoutes from "./users";
import appointmentRoutes from "./appointments";
import messageRoutes from "./messages";
import profileRoutes from "./profiles";

const router = Router();

// Rutas principales
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/messages", messageRoutes);
router.use("/profiles", profileRoutes);

// Ruta de salud del servidor
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "SpeakToMe API está funcionando correctamente",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Ruta de información de la API
router.get("/info", (req, res) => {
  res.json({
    success: true,
    message: "SpeakToMe API - Universidad RIWI",
    version: "1.0.0",
    description: "API para la aplicación de salud mental universitaria",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      appointments: "/api/appointments",
      messages: "/api/messages",
      profiles: "/api/profiles",
    },
    documentation: "/api/docs",
  });
});

export default router;
