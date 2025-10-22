import { Request, Response, NextFunction } from "express";
import {
  AppointmentModel,
  StatusTypeModel,
  PsychologistAvailabilityModel,
} from "@/models/Appointment";
import { createError } from "@/middleware/errorHandler";
import { ApiResponse, PaginatedResponse } from "@/types";

export class AppointmentController {
  // Crear cita
  static async createAppointment(
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

      const appointmentData = req.body;

      // Si no se especifica psicólogo, asignar estado PENDING
      if (!appointmentData.psychologist_id) {
        appointmentData.status_id = 1; // PENDING
      } else {
        // Verificar disponibilidad del psicólogo
        const isAvailable = await AppointmentModel.checkAvailability(
          appointmentData.psychologist_id,
          appointmentData.scheduled_date,
          appointmentData.scheduled_time
        );

        if (!isAvailable) {
          res.status(409).json({
            success: false,
            message: "El psicólogo no está disponible en ese horario",
          });
          return;
        }

        appointmentData.status_id = 2; // ASSIGNED
      }

      // Si es un estudiante creando su propia cita
      if (req.roleId === 3) {
        // STUDENT
        appointmentData.student_id = req.userId;
      }

      const newAppointment = await AppointmentModel.create(appointmentData);

      const response: ApiResponse = {
        success: true,
        message: "Cita creada exitosamente",
        data: newAppointment,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener todas las citas
  static async getAllAppointments(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filters = {
        statusId: req.query.status_id
          ? parseInt(req.query.status_id as string)
          : undefined,
        psychologistId: req.query.psychologist_id
          ? parseInt(req.query.psychologist_id as string)
          : undefined,
        studentId: req.query.student_id
          ? parseInt(req.query.student_id as string)
          : undefined,
        dateFrom: req.query.date_from as string,
        dateTo: req.query.date_to as string,
      };

      const { appointments, total } = await AppointmentModel.findAll(
        page,
        limit,
        filters
      );
      const totalPages = Math.ceil(total / limit);

      const response: PaginatedResponse = {
        success: true,
        message: "Citas obtenidas exitosamente",
        data: appointments,
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

  // Obtener cita por ID
  static async getAppointmentById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const appointmentId = parseInt(id);

      const appointment = await AppointmentModel.findById(appointmentId);

      if (!appointment) {
        res.status(404).json({
          success: false,
          message: "Cita no encontrada",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Cita obtenida exitosamente",
        data: appointment,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener citas por estudiante
  static async getAppointmentsByStudent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { studentId } = req.params;
      const student = parseInt(studentId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { appointments, total } = await AppointmentModel.findByStudent(
        student,
        page,
        limit
      );
      const totalPages = Math.ceil(total / limit);

      const response: PaginatedResponse = {
        success: true,
        message: "Citas del estudiante obtenidas exitosamente",
        data: appointments,
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

  // Obtener citas por psicólogo
  static async getAppointmentsByPsychologist(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { psychologistId } = req.params;
      const psychologist = parseInt(psychologistId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { appointments, total } = await AppointmentModel.findByPsychologist(
        psychologist,
        page,
        limit
      );
      const totalPages = Math.ceil(total / limit);

      const response: PaginatedResponse = {
        success: true,
        message: "Citas del psicólogo obtenidas exitosamente",
        data: appointments,
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

  // Obtener mis citas (para usuarios autenticados)
  static async getMyAppointments(
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

      let appointments, total;

      if (req.roleId === 2) {
        // PSYCHOLOGIST
        const result = await AppointmentModel.findByPsychologist(
          req.userId,
          page,
          limit
        );
        appointments = result.appointments;
        total = result.total;
      } else if (req.roleId === 3) {
        // STUDENT
        const result = await AppointmentModel.findByStudent(
          req.userId,
          page,
          limit
        );
        appointments = result.appointments;
        total = result.total;
      } else {
        res.status(403).json({
          success: false,
          message: "No tienes permisos para ver citas",
        });
        return;
      }

      const totalPages = Math.ceil(total / limit);

      const response: PaginatedResponse = {
        success: true,
        message: "Mis citas obtenidas exitosamente",
        data: appointments,
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

  // Actualizar cita
  static async updateAppointment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const appointmentId = parseInt(id);
      const updateData = { ...req.body } as any;

      // Compatibilidad: permitir `status` string y mapear a `status_id`
      if (typeof updateData.status === "string" && !updateData.status_id) {
        const map: Record<string, number> = {
          PENDING: 1,
          ASSIGNED: 2,
          COMPLETED: 3,
          CANCELLED: 4,
        };
        const upper = updateData.status.toUpperCase();
        if (map[upper]) {
          updateData.status_id = map[upper];
        }
        delete updateData.status;
      }

      // Si se está cambiando el psicólogo, verificar disponibilidad
      if (
        updateData.psychologist_id &&
        updateData.scheduled_date &&
        updateData.scheduled_time
      ) {
        const isAvailable = await AppointmentModel.checkAvailability(
          updateData.psychologist_id,
          updateData.scheduled_date,
          updateData.scheduled_time
        );

        if (!isAvailable) {
          res.status(409).json({
            success: false,
            message: "El psicólogo no está disponible en ese horario",
          });
          return;
        }
      }

      const updatedAppointment = await AppointmentModel.update(
        appointmentId,
        updateData
      );

      if (!updatedAppointment) {
        res.status(404).json({
          success: false,
          message: "Cita no encontrada",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Cita actualizada exitosamente",
        data: updatedAppointment,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Asignar psicólogo a cita
  static async assignPsychologist(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const appointmentId = parseInt(id);
      const { psychologist_id } = req.body;

      // Verificar disponibilidad
      const appointment = await AppointmentModel.findById(appointmentId);
      if (!appointment) {
        res.status(404).json({
          success: false,
          message: "Cita no encontrada",
        });
        return;
      }

      const isAvailable = await AppointmentModel.checkAvailability(
        psychologist_id,
        appointment.scheduled_date,
        appointment.scheduled_time
      );

      if (!isAvailable) {
        res.status(409).json({
          success: false,
          message: "El psicólogo no está disponible en ese horario",
        });
        return;
      }

      const updatedAppointment = await AppointmentModel.assignPsychologist(
        appointmentId,
        psychologist_id
      );

      const response: ApiResponse = {
        success: true,
        message: "Psicólogo asignado exitosamente",
        data: updatedAppointment,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Cancelar cita
  static async cancelAppointment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const appointmentId = parseInt(id);
      const { reason } = req.body;

      const cancelledAppointment = await AppointmentModel.cancel(
        appointmentId,
        reason
      );

      if (!cancelledAppointment) {
        res.status(404).json({
          success: false,
          message: "Cita no encontrada",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Cita cancelada exitosamente",
        data: cancelledAppointment,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Completar cita
  static async completeAppointment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const appointmentId = parseInt(id);
      const { notes } = req.body;

      const completedAppointment = await AppointmentModel.complete(
        appointmentId,
        notes
      );

      if (!completedAppointment) {
        res.status(404).json({
          success: false,
          message: "Cita no encontrada",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Cita completada exitosamente",
        data: completedAppointment,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener tipos de estado
  static async getStatusTypes(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { category } = req.query;

      let statusTypes;
      if (category) {
        statusTypes = await StatusTypeModel.findByCategory(category as string);
      } else {
        statusTypes = await StatusTypeModel.findAll();
      }

      const response: ApiResponse = {
        success: true,
        message: "Tipos de estado obtenidos exitosamente",
        data: statusTypes,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener estadísticas de citas
  static async getAppointmentStatistics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { psychologist_id, date_from, date_to } = req.query;

      const statistics = await AppointmentModel.getStatistics(
        psychologist_id ? parseInt(psychologist_id as string) : undefined,
        date_from as string,
        date_to as string
      );

      const response: ApiResponse = {
        success: true,
        message: "Estadísticas obtenidas exitosamente",
        data: statistics,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Verificar disponibilidad
  static async checkAvailability(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { psychologist_id, scheduled_date, scheduled_time } = req.query;

      if (!psychologist_id || !scheduled_date || !scheduled_time) {
        res.status(400).json({
          success: false,
          message:
            "Parámetros requeridos: psychologist_id, scheduled_date, scheduled_time",
        });
        return;
      }

      const isAvailable = await AppointmentModel.checkAvailability(
        parseInt(psychologist_id as string),
        scheduled_date as string,
        scheduled_time as string
      );

      const response: ApiResponse = {
        success: true,
        message: "Disponibilidad verificada",
        data: {
          is_available: isAvailable,
          psychologist_id: parseInt(psychologist_id as string),
          scheduled_date: scheduled_date as string,
          scheduled_time: scheduled_time as string,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

// Controlador para disponibilidad de psicólogos
export class PsychologistAvailabilityController {
  // Crear disponibilidad
  static async createAvailability(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const availabilityData = req.body;
      const newAvailability = await PsychologistAvailabilityModel.create(
        availabilityData
      );

      const response: ApiResponse = {
        success: true,
        message: "Disponibilidad creada exitosamente",
        data: newAvailability,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Obtener disponibilidad por psicólogo
  static async getAvailabilityByPsychologist(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { psychologistId } = req.params;
      const psychologist = parseInt(psychologistId);

      const availability =
        await PsychologistAvailabilityModel.findByPsychologist(psychologist);

      const response: ApiResponse = {
        success: true,
        message: "Disponibilidad obtenida exitosamente",
        data: availability,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Actualizar disponibilidad
  static async updateAvailability(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const availabilityId = parseInt(id);
      const updateData = req.body;

      const updatedAvailability = await PsychologistAvailabilityModel.update(
        availabilityId,
        updateData
      );

      if (!updatedAvailability) {
        res.status(404).json({
          success: false,
          message: "Disponibilidad no encontrada",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Disponibilidad actualizada exitosamente",
        data: updatedAvailability,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Eliminar disponibilidad
  static async deleteAvailability(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const availabilityId = parseInt(id);

      const deleted = await PsychologistAvailabilityModel.delete(
        availabilityId
      );

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Disponibilidad no encontrada",
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Disponibilidad eliminada exitosamente",
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
