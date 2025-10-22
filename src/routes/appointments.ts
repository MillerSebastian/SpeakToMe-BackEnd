import { Router } from "express";
import {
  AppointmentController,
  PsychologistAvailabilityController,
} from "@/controllers/appointmentController";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  psychologistAvailabilitySchema,
  validate,
  idParamSchema,
  validateParams,
} from "@/middleware/validation";
import {
  authenticateToken,
  requireStudentOrTL,
  requirePsychologistOrTL,
  requireTLMayor,
} from "@/middleware/auth";
import { appointmentRateLimit } from "@/middleware/rateLimiter";

const router = Router();

// Rutas que requieren autenticación
router.use(authenticateToken);

// Obtener tipos de estado
router.get("/status-types", AppointmentController.getStatusTypes);

// Obtener estadísticas de citas
router.get(
  "/statistics",
  requirePsychologistOrTL,
  AppointmentController.getAppointmentStatistics
);

// Verificar disponibilidad
router.get("/check-availability", AppointmentController.checkAvailability);

// Obtener todas las citas (permitir TL_MAYOR y PSYCHOLOGIST)
router.get("/", requirePsychologistOrTL, AppointmentController.getAllAppointments);

// Obtener mis citas
router.get("/my-appointments", AppointmentController.getMyAppointments);

// Crear cita
router.post(
  "/",
  appointmentRateLimit,
  validate(createAppointmentSchema),
  AppointmentController.createAppointment
);

// Obtener cita por ID
router.get(
  "/:id",
  validateParams(idParamSchema),
  AppointmentController.getAppointmentById
);

// Actualizar cita
router.put(
  "/:id",
  validateParams(idParamSchema),
  validate(updateAppointmentSchema),
  AppointmentController.updateAppointment
);

// Asignar psicólogo a cita
router.put(
  "/:id/assign-psychologist",
  validateParams(idParamSchema),
  requireTLMayor,
  AppointmentController.assignPsychologist
);

// Cancelar cita
router.put(
  "/:id/cancel",
  validateParams(idParamSchema),
  AppointmentController.cancelAppointment
);

// Completar cita
router.put(
  "/:id/complete",
  validateParams(idParamSchema),
  requirePsychologistOrTL,
  AppointmentController.completeAppointment
);

// Obtener citas por estudiante
router.get(
  "/student/:studentId",
  validateParams(idParamSchema),
  requireTLMayor,
  AppointmentController.getAppointmentsByStudent
);

// Obtener citas por psicólogo
router.get(
  "/psychologist/:psychologistId",
  validateParams(idParamSchema),
  requireTLMayor,
  AppointmentController.getAppointmentsByPsychologist
);

// Rutas para disponibilidad de psicólogos
const availabilityRouter = Router();

// Crear disponibilidad
availabilityRouter.post(
  "/",
  validate(psychologistAvailabilitySchema),
  requirePsychologistOrTL,
  PsychologistAvailabilityController.createAvailability
);

// Obtener disponibilidad por psicólogo
availabilityRouter.get(
  "/psychologist/:psychologistId",
  validateParams(idParamSchema),
  PsychologistAvailabilityController.getAvailabilityByPsychologist
);

// Actualizar disponibilidad
availabilityRouter.put(
  "/:id",
  validateParams(idParamSchema),
  requirePsychologistOrTL,
  PsychologistAvailabilityController.updateAvailability
);

// Eliminar disponibilidad
availabilityRouter.delete(
  "/:id",
  validateParams(idParamSchema),
  requirePsychologistOrTL,
  PsychologistAvailabilityController.deleteAvailability
);

// Montar las rutas de disponibilidad
router.use("/availability", availabilityRouter);

export default router;
