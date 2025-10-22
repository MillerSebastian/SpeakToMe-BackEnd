import { query } from "@/config/database";
import { User, UserActivityStatus, Role, UserResponse } from "@/types";
import bcrypt from "bcryptjs";

export class UserModel {
  // Crear usuario
  static async create(
    userData: Omit<User, "id" | "created_at" | "updated_at">
  ): Promise<User> {
    const {
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      avatar_url,
      role_id,
      is_active,
      is_verified,
      email_verified_at,
      last_login,
    } = userData;

    const sql = `
      INSERT INTO users (
        email, password_hash, first_name, last_name, phone, avatar_url,
        role_id, is_active, is_verified, email_verified_at, last_login
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      email,
      password_hash,
      first_name,
      last_name,
      phone || null,
      avatar_url || null,
      role_id,
      is_active,
      is_verified,
      email_verified_at || null,
      last_login || null,
    ]);

    const user = await this.findById(result.insertId);
    if (!user) {
      throw new Error("Error al crear usuario");
    }
    return user;
  }

  // Buscar usuario por ID
  static async findById(id: number): Promise<User | null> {
    const sql = `
      SELECT 
        id,
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        avatar_url,
        role_id,
        is_active,
        is_verified,
        email_verified_at,
        created_at,
        updated_at,
        last_login
      FROM users 
      WHERE id = ?
    `;

    const rows = await query(sql, [id]);
    return rows && rows[0] ? (rows[0] as User) : null;
  }

  // Buscar usuario por email
  static async findByEmail(email: string): Promise<User | null> {
    const sql = "SELECT * FROM users WHERE email = ?";
    const users = await query(sql, [email]);
    return users[0] || null;
  }

  // Buscar todos los usuarios con paginación
  static async findAll(
    page: number = 1,
    limit: number = 10,
    roleId?: number
  ): Promise<{ users: UserResponse[]; total: number }> {
    const safeLimit = Math.max(1, Number(limit) || 10);
    const safePage = Math.max(1, Number(page) || 1);
    const offset = (safePage - 1) * safeLimit;

    const baseWhere: string[] = ["u.is_active = TRUE", "u.role_id IN (1, 2, 3)"];
    const params: any[] = [];
    if (typeof roleId === "number") {
      baseWhere.push("u.role_id = ?");
      params.push(roleId);
    }
    const whereClause = baseWhere.length ? `WHERE ${baseWhere.join(" AND ")}` : "";

    const countSql = `
      SELECT COUNT(*) AS total
      FROM users u
      ${whereClause}
    `;
    const countRows = await query(countSql, params);
    const total: number = countRows?.[0]?.total || 0;

    const dataSql = `
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.avatar_url,
        u.role_id,
        r.name AS role_name,
        u.is_active,
        u.is_verified,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ${safeLimit} OFFSET ${offset}
    `;
    const dataRows = await query(dataSql, params);

    const users: UserResponse[] = (dataRows || []) as UserResponse[];
    return { users, total };
  }

  // Actualizar usuario
  static async update(
    id: number,
    updateData: Partial<User>
  ): Promise<User | null> {
    const fields = Object.keys(updateData).filter((key) => key !== "id");
    const values = fields.map((field) => updateData[field as keyof User]);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const sql = `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await query(sql, [...values, id]);

    return this.findById(id);
  }

  // Eliminar usuario (soft delete)
  static async delete(id: number): Promise<boolean> {
    const sql =
      "UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  }

  // Verificar contraseña
  static async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Hash de contraseña
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Actualizar último login
  static async updateLastLogin(id: number): Promise<void> {
    const sql = "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?";
    await query(sql, [id]);
  }

  // Buscar usuarios por rol
  static async findByRole(roleId: number): Promise<User[]> {
    const sql = "SELECT * FROM users WHERE role_id = ? AND is_active = TRUE";
    return await query(sql, [roleId]);
  }

  // Buscar usuarios activos
  static async findActiveUsers(): Promise<User[]> {
    const sql =
      "SELECT * FROM users WHERE is_active = TRUE ORDER BY created_at DESC";
    return await query(sql);
  }

  // Verificar si el email existe
  static async emailExists(
    email: string,
    excludeId?: number
  ): Promise<boolean> {
    let sql = "SELECT COUNT(*) as count FROM users WHERE email = ?";
    let params: any[] = [email];

    if (excludeId) {
      sql += " AND id != ?";
      params.push(excludeId);
    }

    const result = await query(sql, params);
    return result[0].count > 0;
  }
}

export class UserActivityModel {
  // Crear o actualizar estado de actividad
  static async updateActivity(
    userId: number,
    activityData: Partial<UserActivityStatus>
  ): Promise<UserActivityStatus> {
    const sql = `
      INSERT INTO user_activity_status (user_id, is_online, last_activity_at, last_seen_at, status, current_page)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      is_online = VALUES(is_online),
      last_activity_at = VALUES(last_activity_at),
      last_seen_at = VALUES(last_seen_at),
      status = VALUES(status),
      current_page = VALUES(current_page),
      updated_at = CURRENT_TIMESTAMP
    `;

    await query(sql, [
      userId,
      activityData.is_online || false,
      activityData.last_activity_at || new Date(),
      activityData.last_seen_at || new Date(),
      activityData.status || "offline",
      activityData.current_page || null,
    ]);

    const activity = await this.findByUserId(userId);
    if (!activity) {
      throw new Error("Error al actualizar actividad del usuario");
    }
    return activity;
  }

  // Buscar estado de actividad por usuario
  static async findByUserId(
    userId: number
  ): Promise<UserActivityStatus | null> {
    const sql = "SELECT * FROM user_activity_status WHERE user_id = ?";
    const activities = await query(sql, [userId]);
    return activities[0] || null;
  }

  // Buscar usuarios en línea
  static async findOnlineUsers(): Promise<UserActivityStatus[]> {
    const sql =
      "SELECT * FROM user_activity_status WHERE is_online = TRUE ORDER BY last_activity_at DESC";
    return await query(sql);
  }

  // Marcar usuario como offline
  static async setOffline(userId: number): Promise<void> {
    const sql = `
      UPDATE user_activity_status 
      SET is_online = FALSE, status = 'offline', last_seen_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ?
    `;
    await query(sql, [userId]);
  }
}

export class RoleModel {
  // Buscar todos los roles
  static async findAll(
    ): Promise<Role[]> {
    const sql = `SELECT id, name, description, created_at FROM roles ORDER BY id`;
    const rows = await query(sql);
    return rows as Role[];
  }

  // Buscar rol por ID
  static async findById(id: number): Promise<Role | null> {
    const sql = `SELECT id, name, description, created_at FROM roles WHERE id = ?`;
    const rows = await query(sql, [id]);
    return rows && rows[0] ? (rows[0] as Role) : null;
  }

  // Buscar rol por nombre
  static async findByName(name: string): Promise<Role | null> {
    const sql = "SELECT * FROM roles WHERE name = ?";
    const roles = await query(sql, [name]);
    return roles[0] || null;
  }
}
