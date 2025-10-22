import { Request, Response, NextFunction } from "express";
import Joi from "joi";

// Middleware de validación genérico
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      res.status(400).json({
        success: false,
        message: "Datos de entrada inválidos",
        errors: errorMessages,
      });
      return;
    }

    req.body = value;
    next();
  };
};

// Esquemas de validación para usuarios
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "El email debe tener un formato válido",
    "any.required": "El email es requerido",
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      "string.min": "La contraseña debe tener al menos 8 caracteres",
      "string.pattern.base":
        "La contraseña debe contener al menos una letra minúscula, una mayúscula, un número y un carácter especial",
      "any.required": "La contraseña es requerida",
    }),
  first_name: Joi.string().min(2).max(100).required().messages({
    "string.min": "El nombre debe tener al menos 2 caracteres",
    "string.max": "El nombre no puede exceder 100 caracteres",
    "any.required": "El nombre es requerido",
  }),
  last_name: Joi.string().min(2).max(100).required().messages({
    "string.min": "El apellido debe tener al menos 2 caracteres",
    "string.max": "El apellido no puede exceder 100 caracteres",
    "any.required": "El apellido es requerido",
  }),
  phone: Joi.string()
    .pattern(/^[+]?[\d\s\-\(\)]+$/)
    .optional()
    .messages({
      "string.pattern.base": "El teléfono debe tener un formato válido",
    }),
  role_id: Joi.number().integer().min(1).max(3).required().messages({
    "number.base": "El ID del rol debe ser un número",
    "number.integer": "El ID del rol debe ser un número entero",
    "number.min": "El ID del rol debe ser al menos 1",
    "number.max": "El ID del rol no puede exceder 3",
    "any.required": "El ID del rol es requerido",
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "El email debe tener un formato válido",
    "any.required": "El email es requerido",
  }),
  password: Joi.string().required().messages({
    "any.required": "La contraseña es requerida",
  }),
});

export const updateUserSchema = Joi.object({
  first_name: Joi.string().min(2).max(100).optional(),
  last_name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string()
    .pattern(/^[+]?[\d\s\-\(\)]+$/)
    .optional()
    .allow(""),
  avatar_url: Joi.string().uri().optional().allow(""),
  is_active: Joi.boolean().optional(),
  is_verified: Joi.boolean().optional(),
});

// Esquemas de validación para perfiles de psicólogos
export const psychologistProfileSchema = Joi.object({
  specialty: Joi.string().max(100).optional().allow(""),
  license_number: Joi.string().max(100).required().messages({
    "any.required": "El número de licencia es requerido",
  }),
  bio: Joi.string().max(1000).optional().allow(""),
  professional_experience: Joi.number().integer().min(0).max(50).optional(),
  availability_start: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .allow(""),
  availability_end: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .allow(""),
  max_appointments_per_day: Joi.number().integer().min(1).max(20).optional(),
  is_available: Joi.boolean().optional(),
});

// Esquemas de validación para perfiles de estudiantes
export const studentProfileSchema = Joi.object({
  student_id: Joi.string().max(50).required().messages({
    "any.required": "El ID de estudiante es requerido",
  }),
  semester: Joi.number().integer().min(1).max(20).optional(),
  program: Joi.string().max(100).optional().allow(""),
  emergency_contact_name: Joi.string().max(100).optional().allow(""),
  emergency_contact_phone: Joi.string()
    .pattern(/^[+]?[\d\s\-\(\)]+$/)
    .optional()
    .allow(""),
});

// Esquemas de validación para citas
export const createAppointmentSchema = Joi.object({
  student_id: Joi.number().integer().positive().required().messages({
    "any.required": "El ID del estudiante es requerido",
  }),
  psychologist_id: Joi.number().integer().positive().optional(),
  scheduled_date: Joi.date().iso().min("now").required().messages({
    "date.base": "La fecha debe tener un formato válido",
    "date.min": "La fecha no puede ser anterior a hoy",
    "any.required": "La fecha es requerida",
  }),
  scheduled_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "La hora debe tener el formato HH:MM",
      "any.required": "La hora es requerida",
    }),
  reason_for_visit: Joi.string().max(1000).optional().allow(""),
});

export const updateAppointmentSchema = Joi.object({
  psychologist_id: Joi.number().integer().positive().optional(),
  scheduled_date: Joi.date().iso().min("now").optional(),
  scheduled_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  status_id: Joi.number().integer().positive().optional(),
  status: Joi.string()
    .valid("PENDING", "ASSIGNED", "COMPLETED", "CANCELLED")
    .optional(),
  reason_for_visit: Joi.string().max(1000).optional().allow(""),
  notes: Joi.string().max(2000).optional().allow(""),
});

// Esquemas de validación para mensajes
export const createMessageSchema = Joi.object({
  recipient_id: Joi.number().integer().positive().required().messages({
    "any.required": "El ID del destinatario es requerido",
  }),
  appointment_id: Joi.number().integer().positive().optional(),
  content: Joi.string().min(1).max(2000).required().messages({
    "string.min": "El mensaje no puede estar vacío",
    "string.max": "El mensaje no puede exceder 2000 caracteres",
    "any.required": "El contenido del mensaje es requerido",
  }),
});

// Esquemas de validación para posts de blog
export const createBlogPostSchema = Joi.object({
  title: Joi.string().min(5).max(255).required().messages({
    "string.min": "El título debe tener al menos 5 caracteres",
    "string.max": "El título no puede exceder 255 caracteres",
    "any.required": "El título es requerido",
  }),
  content: Joi.string().min(10).max(5000).required().messages({
    "string.min": "El contenido debe tener al menos 10 caracteres",
    "string.max": "El contenido no puede exceder 5000 caracteres",
    "any.required": "El contenido es requerido",
  }),
  status_mood: Joi.string()
    .valid("happy", "neutral", "sad", "anxious", "stressed")
    .optional(),
});

export const updateBlogPostSchema = Joi.object({
  title: Joi.string().min(5).max(255).optional(),
  content: Joi.string().min(10).max(5000).optional(),
  status_mood: Joi.string()
    .valid("happy", "neutral", "sad", "anxious", "stressed")
    .optional(),
  is_published: Joi.boolean().optional(),
});

// Esquemas de validación para disponibilidad de psicólogos
export const psychologistAvailabilitySchema = Joi.object({
  psychologist_id: Joi.number().integer().positive().required(),
  day_of_week: Joi.number().integer().min(0).max(6).optional(), // 0 = Domingo, 6 = Sábado
  start_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "La hora de inicio debe tener el formato HH:MM",
      "any.required": "La hora de inicio es requerida",
    }),
  end_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "La hora de fin debe tener el formato HH:MM",
      "any.required": "La hora de fin es requerida",
    }),
  is_available: Joi.boolean().optional(),
});

// Esquemas de validación para calificaciones
export const appointmentRatingSchema = Joi.object({
  appointment_id: Joi.number().integer().positive().required(),
  student_id: Joi.number().integer().positive().required(),
  psychologist_id: Joi.number().integer().positive().required(),
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "number.min": "La calificación debe ser al menos 1",
    "number.max": "La calificación no puede exceder 5",
    "any.required": "La calificación es requerida",
  }),
  comment: Joi.string().max(500).optional().allow(""),
});

// Esquemas de validación para notificaciones
export const createNotificationSchema = Joi.object({
  user_id: Joi.number().integer().positive().required(),
  title: Joi.string().min(1).max(255).required().messages({
    "any.required": "El título es requerido",
  }),
  message: Joi.string().min(1).max(1000).required().messages({
    "any.required": "El mensaje es requerido",
  }),
  notification_type: Joi.string().max(50).optional(),
  related_entity_type: Joi.string().max(50).optional(),
  related_entity_id: Joi.number().integer().positive().optional(),
});

// Esquemas de validación para parámetros de consulta
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

export const appointmentFiltersSchema = Joi.object({
  status_id: Joi.number().integer().positive().optional(),
  psychologist_id: Joi.number().integer().positive().optional(),
  student_id: Joi.number().integer().positive().optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Middleware para validar parámetros de URL
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params);

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      res.status(400).json({
        success: false,
        message: "Parámetros de URL inválidos",
        errors: errorMessages,
      });
      return;
    }

    req.params = value;
    next();
  };
};

// Esquema para validar IDs en parámetros
export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "El ID debe ser un número",
    "number.integer": "El ID debe ser un número entero",
    "number.positive": "El ID debe ser un número positivo",
    "any.required": "El ID es requerido",
  }),
});

export const userIdParamSchema = Joi.object({
  userId: Joi.number().integer().positive().required().messages({
    "number.base": "El ID de usuario debe ser un número",
    "number.integer": "El ID de usuario debe ser un número entero",
    "number.positive": "El ID de usuario debe ser un número positivo",
    "any.required": "El ID de usuario es requerido",
  }),
});

// Esquema para validar parámetro roleId
export const roleIdParamSchema = Joi.object({
  roleId: Joi.number().integer().positive().required().messages({
    "number.base": "El roleId debe ser un número",
    "number.integer": "El roleId debe ser un número entero",
    "number.positive": "El roleId debe ser un número positivo",
    "any.required": "El roleId es requerido",
  }),
});

// Esquema para validar parámetros userId1 y userId2 en conversación
export const conversationUsersParamSchema = Joi.object({
  userId1: Joi.number().integer().positive().required().messages({
    "number.base": "El userId1 debe ser un número",
    "number.integer": "El userId1 debe ser un número entero",
    "number.positive": "El userId1 debe ser un número positivo",
    "any.required": "El userId1 es requerido",
  }),
  userId2: Joi.number().integer().positive().required().messages({
    "number.base": "El userId2 debe ser un número",
    "number.integer": "El userId2 debe ser un número entero",
    "number.positive": "El userId2 debe ser un número positivo",
    "any.required": "El userId2 es requerido",
  }),
});

// Esquema para validar parámetro senderId
export const senderIdParamSchema = Joi.object({
  senderId: Joi.number().integer().positive().required().messages({
    "number.base": "El senderId debe ser un número",
    "number.integer": "El senderId debe ser un número entero",
    "number.positive": "El senderId debe ser un número positivo",
    "any.required": "El senderId es requerido",
  }),
});
