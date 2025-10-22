// Tipos de usuario y roles
export interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  role_id: number;
  is_active: boolean;
  is_verified: boolean;
  email_verified_at?: Date | null;
  created_at: Date;
  updated_at: Date;
  last_login?: Date | null;
}


export interface UserResponse extends Omit<User, "password_hash"> {
  password_hash?: never;
  role_name?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
}

export interface UserActivityStatus {
  id: number;
  user_id: number;
  is_online: boolean;
  last_activity_at?: Date;
  last_seen_at?: Date;
  status: "online" | "away" | "offline" | "do_not_disturb";
  current_page?: string;
  updated_at: Date;
}

// Tipos de perfiles
export interface PsychologistProfile {
  id: number;
  user_id: number;
  specialty?: string;
  license_number: string;
  bio?: string;
  professional_experience?: number;
  availability_start?: string;
  availability_end?: string;
  max_appointments_per_day: number;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface StudentProfile {
  id: number;
  user_id: number;
  student_id: string;
  semester?: number;
  program?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: Date;
  updated_at: Date;
}

// Tipos de citas
export interface Appointment {
  id: number;
  student_id: number;
  psychologist_id?: number;
  scheduled_date: string;
  scheduled_time: string;
  status_id: number;
  reason_for_visit?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  cancelled_at?: Date;
  completed_at?: Date;
}

export interface AppointmentWithDetails extends Appointment {
  student?: UserResponse;
  psychologist?: UserResponse;
  status?: StatusType;
}

export interface StatusType {
  id: number;
  name: string;
  description?: string;
  category: "appointment" | "auth" | "message" | "account";
}

export interface PsychologistAvailability {
  id: number;
  psychologist_id: number;
  day_of_week?: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

// Tipos de mensajería
export interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  appointment_id?: number;
  content: string;
  is_read: boolean;
  read_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface MessageWithUser extends Message {
  sender?: UserResponse;
  recipient?: UserResponse;
}

// Tipos de blog
export interface BlogPost {
  id: number;
  author_id: number;
  title: string;
  content: string;
  status_mood: "happy" | "neutral" | "sad" | "anxious" | "stressed";
  likes_count: number;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BlogPostWithAuthor extends BlogPost {
  author?: UserResponse;
}

// Tipos de logs y auditoría
export interface SystemLog {
  id: number;
  user_id?: number;
  action: string;
  entity_type?: string;
  entity_id?: number;
  status_type_id?: number;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface PsychologistStatistics {
  id: number;
  psychologist_id: number;
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  total_unique_students: number;
  average_rating: number;
  month?: number;
  year?: number;
  created_at: Date;
  updated_at: Date;
}

export interface AppointmentRating {
  id: number;
  appointment_id: number;
  student_id: number;
  psychologist_id: number;
  rating: number;
  comment?: string;
  created_at: Date;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type?: string;
  related_entity_type?: string;
  related_entity_id?: number;
  is_read: boolean;
  read_at?: Date;
  created_at: Date;
}

export interface AdminAuditLog {
  id: number;
  admin_id: number;
  action: string;
  target_user_id?: number;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  reason?: string;
  created_at: Date;
}

// Tipos para requests y responses
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role_id: number;
}

export interface CreateAppointmentRequest {
  student_id: number;
  psychologist_id?: number;
  scheduled_date: string;
  scheduled_time: string;
  reason_for_visit?: string;
}

export interface UpdateAppointmentRequest {
  psychologist_id?: number;
  scheduled_date?: string;
  scheduled_time?: string;
  status_id?: number;
  reason_for_visit?: string;
  notes?: string;
}

export interface CreateMessageRequest {
  recipient_id: number;
  appointment_id?: number;
  content: string;
}

export interface CreateBlogPostRequest {
  title: string;
  content: string;
  status_mood: "happy" | "neutral" | "sad" | "anxious" | "stressed";
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos para JWT
export interface JwtPayload {
  userId: number;
  email: string;
  roleId: number;
  iat?: number;
  exp?: number;
}

// Extender la interfaz Request de Express
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: number;
      roleId?: number;
    }
  }
}

export type RoleType = "STUDENT" | "PSYCHOLOGIST" | "TL_MAYOR" | "ADMIN";

export enum AppointmentStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
}
