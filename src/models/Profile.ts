import { query } from "@/config/database";
import {
  PsychologistProfile,
  StudentProfile,
  BlogPost,
  Notification,
} from "@/types";

export class PsychologistProfileModel {
  // Crear perfil de psicólogo
  static async create(
    profileData: Omit<PsychologistProfile, "id" | "created_at" | "updated_at">
  ): Promise<PsychologistProfile> {
    const {
      user_id,
      specialty,
      license_number,
      bio,
      professional_experience,
      availability_start,
      availability_end,
      max_appointments_per_day,
      is_available,
    } = profileData;

    const sql = `
      INSERT INTO psychologist_profiles (
        user_id, specialty, license_number, bio, professional_experience,
        availability_start, availability_end, max_appointments_per_day, is_available
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      user_id,
      specialty,
      license_number,
      bio,
      professional_experience,
      availability_start,
      availability_end,
      max_appointments_per_day,
      is_available,
    ]);

    const profile = await this.findById(result.insertId);
    if (!profile) {
      throw new Error("Error al crear perfil de psicólogo");
    }
    return profile;
  }

  // Buscar perfil por ID
  static async findById(id: number): Promise<PsychologistProfile | null> {
    const sql = "SELECT * FROM psychologist_profiles WHERE id = ?";
    const profiles = await query(sql, [id]);
    return profiles[0] || null;
  }

  // Buscar perfil por usuario
  static async findByUserId(
    userId: number
  ): Promise<PsychologistProfile | null> {
    const sql = "SELECT * FROM psychologist_profiles WHERE user_id = ?";
    const profiles = await query(sql, [userId]);
    return profiles[0] || null;
  }

  // Buscar todos los perfiles de psicólogos
  static async findAll(
    page: number = 1,
    limit: number = 10,
    filters: { specialty?: string; is_available?: boolean } = {}
  ): Promise<{ profiles: PsychologistProfile[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params: any[] = [];

    if (filters.specialty) {
      whereConditions.push("specialty LIKE ?");
      params.push(`%${filters.specialty}%`);
    }
    if (filters.is_available !== undefined) {
      whereConditions.push("is_available = ?");
      params.push(filters.is_available);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const countSql = `SELECT COUNT(*) as total FROM psychologist_profiles ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const sql = `
      SELECT p.*, 
             u.first_name, u.last_name, u.email, u.phone, u.avatar_url
      FROM psychologist_profiles p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const profiles = await query(sql, [...params, limit, offset]);
    return { profiles, total };
  }

  // Actualizar perfil
  static async update(
    id: number,
    updateData: Partial<PsychologistProfile>
  ): Promise<PsychologistProfile | null> {
    const fields = Object.keys(updateData).filter((key) => key !== "id");
    const values = fields.map(
      (field) => updateData[field as keyof PsychologistProfile]
    );
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const sql = `UPDATE psychologist_profiles SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await query(sql, [...values, id]);
    return this.findById(id);
  }

  // Actualizar por usuario
  static async updateByUserId(
    userId: number,
    updateData: Partial<PsychologistProfile>
  ): Promise<PsychologistProfile | null> {
    const fields = Object.keys(updateData).filter(
      (key) => key !== "id" && key !== "user_id"
    );
    const values = fields.map(
      (field) => updateData[field as keyof PsychologistProfile]
    );
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const sql = `UPDATE psychologist_profiles SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`;
    await query(sql, [...values, userId]);
    return this.findByUserId(userId);
  }

  // Verificar si el número de licencia existe
  static async licenseExists(
    licenseNumber: string,
    excludeUserId?: number
  ): Promise<boolean> {
    let sql =
      "SELECT COUNT(*) as count FROM psychologist_profiles WHERE license_number = ?";
    let params: any[] = [licenseNumber];

    if (excludeUserId) {
      sql += " AND user_id != ?";
      params.push(excludeUserId);
    }

    const result = await query(sql, params);
    return result[0].count > 0;
  }

  // Buscar psicólogos disponibles
  static async findAvailable(): Promise<PsychologistProfile[]> {
    const sql = `
      SELECT p.*, 
             u.first_name, u.last_name, u.email, u.phone, u.avatar_url
      FROM psychologist_profiles p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.is_available = TRUE AND u.is_active = TRUE
      ORDER BY p.created_at DESC
    `;
    return await query(sql);
  }
}

export class StudentProfileModel {
  // Crear perfil de estudiante
  static async create(
    profileData: Omit<StudentProfile, "id" | "created_at" | "updated_at">
  ): Promise<StudentProfile> {
    const {
      user_id,
      student_id,
      semester,
      program,
      emergency_contact_name,
      emergency_contact_phone,
    } = profileData;

    const sql = `
      INSERT INTO student_profiles (
        user_id, student_id, semester, program, emergency_contact_name, emergency_contact_phone
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      user_id,
      student_id,
      semester,
      program,
      emergency_contact_name,
      emergency_contact_phone,
    ]);

    const profile = await this.findById(result.insertId);
    if (!profile) {
      throw new Error("Error al crear perfil de estudiante");
    }
    return profile;
  }

  // Buscar perfil por ID
  static async findById(id: number): Promise<StudentProfile | null> {
    const sql = "SELECT * FROM student_profiles WHERE id = ?";
    const profiles = await query(sql, [id]);
    return profiles[0] || null;
  }

  // Buscar perfil por usuario
  static async findByUserId(userId: number): Promise<StudentProfile | null> {
    const sql = "SELECT * FROM student_profiles WHERE user_id = ?";
    const profiles = await query(sql, [userId]);
    return profiles[0] || null;
  }

  // Buscar perfil por student_id
  static async findByStudentId(
    studentId: string
  ): Promise<StudentProfile | null> {
    const sql = "SELECT * FROM student_profiles WHERE student_id = ?";
    const profiles = await query(sql, [studentId]);
    return profiles[0] || null;
  }

  // Buscar todos los perfiles de estudiantes
  static async findAll(
    page: number = 1,
    limit: number = 10,
    filters: { program?: string; semester?: number } = {}
  ): Promise<{ profiles: StudentProfile[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params: any[] = [];

    if (filters.program) {
      whereConditions.push("program LIKE ?");
      params.push(`%${filters.program}%`);
    }
    if (filters.semester) {
      whereConditions.push("semester = ?");
      params.push(filters.semester);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const countSql = `SELECT COUNT(*) as total FROM student_profiles ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const sql = `
      SELECT p.*, 
             u.first_name, u.last_name, u.email, u.phone, u.avatar_url
      FROM student_profiles p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const profiles = await query(sql, [...params, limit, offset]);
    return { profiles, total };
  }

  // Actualizar perfil
  static async update(
    id: number,
    updateData: Partial<StudentProfile>
  ): Promise<StudentProfile | null> {
    const fields = Object.keys(updateData).filter((key) => key !== "id");
    const values = fields.map(
      (field) => updateData[field as keyof StudentProfile]
    );
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const sql = `UPDATE student_profiles SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await query(sql, [...values, id]);
    return this.findById(id);
  }

  // Actualizar por usuario
  static async updateByUserId(
    userId: number,
    updateData: Partial<StudentProfile>
  ): Promise<StudentProfile | null> {
    const fields = Object.keys(updateData).filter(
      (key) => key !== "id" && key !== "user_id"
    );
    const values = fields.map(
      (field) => updateData[field as keyof StudentProfile]
    );
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const sql = `UPDATE student_profiles SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`;
    await query(sql, [...values, userId]);
    return this.findByUserId(userId);
  }

  // Verificar si el student_id existe
  static async studentIdExists(
    studentId: string,
    excludeUserId?: number
  ): Promise<boolean> {
    let sql =
      "SELECT COUNT(*) as count FROM student_profiles WHERE student_id = ?";
    let params: any[] = [studentId];

    if (excludeUserId) {
      sql += " AND user_id != ?";
      params.push(excludeUserId);
    }

    const result = await query(sql, params);
    return result[0].count > 0;
  }
}

export class BlogPostModel {
  // Crear post de blog
  static async create(
    postData: Omit<BlogPost, "id" | "created_at" | "updated_at">
  ): Promise<BlogPost> {
    const {
      author_id,
      title,
      content,
      status_mood,
      likes_count,
      is_published,
    } = postData;

    const sql = `
      INSERT INTO blog_posts (author_id, title, content, status_mood, likes_count, is_published)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      author_id,
      title,
      content,
      status_mood ?? "neutral",
      typeof likes_count === "number" ? likes_count : 0,
      typeof is_published === "boolean" ? is_published : true,
    ]);
    const profile = await this.findById(result.insertId);
    if (!profile) {
      throw new Error("Error al crear post de blog");
    }
    return profile;
  }

  // Buscar post por ID
  static async findById(id: number): Promise<BlogPost | null> {
    const sql = `
      SELECT b.*, 
             u.first_name as author_first_name,
             u.last_name as author_last_name,
             u.avatar_url as author_avatar
      FROM blog_posts b
      LEFT JOIN users u ON b.author_id = u.id
      WHERE b.id = ?
    `;
    const posts = await query(sql, [id]);
    return posts[0] || null;
  }

  // Buscar todos los posts
  static async findAll(
    page: number = 1,
    limit: number = 10,
    filters: {
      status_mood?: string;
      is_published?: boolean;
      author_id?: number;
    } = {}
  ): Promise<{ posts: BlogPost[]; total: number }> {
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const offset = (safePage - 1) * safeLimit;
    let whereConditions = [];
    let params: any[] = [];

    if (filters.status_mood) {
      whereConditions.push("status_mood = ?");
      params.push(filters.status_mood);
    }
    if (filters.is_published !== undefined) {
      whereConditions.push("is_published = ?");
      params.push(filters.is_published);
    }
    if (filters.author_id) {
      whereConditions.push("author_id = ?");
      params.push(filters.author_id);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const countSql = `SELECT COUNT(*) as total FROM blog_posts ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const sql = `
      SELECT b.*, 
             u.first_name as author_first_name,
             u.last_name as author_last_name,
             u.avatar_url as author_avatar
      FROM blog_posts b
      LEFT JOIN users u ON b.author_id = u.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ${safeLimit} OFFSET ${offset}
    `;

    const posts = await query(sql, params);
    return { posts, total };
  }

  // Actualizar post
  static async update(
    id: number,
    updateData: Partial<BlogPost>
  ): Promise<BlogPost | null> {
    const fields = Object.keys(updateData).filter((key) => key !== "id");
    const values = fields.map((field) => updateData[field as keyof BlogPost]);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const sql = `UPDATE blog_posts SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await query(sql, [...values, id]);
    return this.findById(id);
  }

  // Eliminar post
  static async delete(id: number): Promise<boolean> {
    const sql = "DELETE FROM blog_posts WHERE id = ?";
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  }

  // Incrementar likes
  static async incrementLikes(id: number): Promise<BlogPost | null> {
    const sql =
      "UPDATE blog_posts SET likes_count = likes_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    await query(sql, [id]);
    return this.findById(id);
  }

  // Buscar posts por autor
  static async findByAuthor(
    authorId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ posts: BlogPost[]; total: number }> {
    return this.findAll(page, limit, { author_id: authorId });
  }
}

export class NotificationModel {
  // Crear notificación
  static async create(
    notificationData: Omit<Notification, "id" | "created_at">
  ): Promise<Notification> {
    const {
      user_id,
      title,
      message,
      notification_type,
      related_entity_type,
      related_entity_id,
      is_read,
    } = notificationData;

    const sql = `
      INSERT INTO notifications (
        user_id, title, message, notification_type, related_entity_type, related_entity_id, is_read
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      user_id,
      title,
      message,
      notification_type,
      related_entity_type,
      related_entity_id,
      is_read,
    ]);

    const profile = await this.findById(result.insertId);
    if (!profile) {
      throw new Error("Error al crear notificación");
    }
    return profile;
  }

  // Buscar notificación por ID
  static async findById(id: number): Promise<Notification | null> {
    const sql = "SELECT * FROM notifications WHERE id = ?";
    const notifications = await query(sql, [id]);
    return notifications[0] || null;
  }

  // Buscar notificaciones por usuario
  static async findByUser(
    userId: number,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{ notifications: Notification[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = "WHERE user_id = ?";
    let params: any[] = [userId];

    if (unreadOnly) {
      whereClause += " AND is_read = FALSE";
    }

    const countSql = `SELECT COUNT(*) as total FROM notifications ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const sql = `
      SELECT * FROM notifications 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const notifications = await query(sql, [...params, limit, offset]);
    return { notifications, total };
  }

  // Marcar como leída
  static async markAsRead(id: number): Promise<Notification | null> {
    const sql =
      "UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE id = ?";
    await query(sql, [id]);
    return this.findById(id);
  }

  // Marcar todas como leídas
  static async markAllAsRead(userId: number): Promise<void> {
    const sql =
      "UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_read = FALSE";
    await query(sql, [userId]);
  }

  // Eliminar notificación
  static async delete(id: number): Promise<boolean> {
    const sql = "DELETE FROM notifications WHERE id = ?";
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  }

  // Contar notificaciones no leídas
  static async countUnread(userId: number): Promise<number> {
    const sql =
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE";
    const result = await query(sql, [userId]);
    return result[0].count;
  }
}
