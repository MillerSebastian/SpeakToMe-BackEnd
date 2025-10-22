import { query } from "@/config/database";
import { Appointment, StatusType, PsychologistAvailability } from "@/types";

export class AppointmentModel {
  // Crear cita
  static async create(
    appointmentData: Omit<Appointment, "id" | "created_at" | "updated_at">
  ): Promise<Appointment> {
    const {
      student_id,
      psychologist_id,
      scheduled_date,
      scheduled_time,
      reason_for_visit,
      notes,
    } = appointmentData;

    // Determinar el estado por nombre y obtener su ID
    const statusName = psychologist_id ? "ASSIGNED" : "PENDING";
    const statusRow = await query(
      "SELECT id FROM status_types WHERE name = ? AND category = 'appointment' LIMIT 1",
      [statusName]
    );
    const statusId = statusRow?.[0]?.id as number | undefined;
    if (!statusId) {
      throw new Error(
        `No existe status_types '${statusName}' en categoría 'appointment'. Asegura la semilla inicial.`
      );
    }

    const sql = `
      INSERT INTO appointments (
        student_id, psychologist_id, scheduled_date, scheduled_time,
        status_id, reason_for_visit, notes
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?
      )
    `;

    const result = await query(sql, [
      student_id,
      psychologist_id ?? null,
      scheduled_date,
      scheduled_time,
      statusId,
      reason_for_visit ?? null,
      notes ?? null,
    ]);

    const appointment = await this.findById(result.insertId);
    if (!appointment) {
      throw new Error("Error al crear cita");
    }
    return appointment;
  }

  // Buscar cita por ID
  static async findById(id: number): Promise<Appointment | null> {
    const sql = `
      SELECT a.*, 
             s.name as status_name,
             u1.first_name as student_first_name,
             u1.last_name as student_last_name,
             u2.first_name as psychologist_first_name,
             u2.last_name as psychologist_last_name
      FROM appointments a
      LEFT JOIN status_types s ON a.status_id = s.id
      LEFT JOIN users u1 ON a.student_id = u1.id
      LEFT JOIN users u2 ON a.psychologist_id = u2.id
      WHERE a.id = ?
    `;
    const appointments = await query(sql, [id]);
    return appointments[0] || null;
  }

  // Buscar citas por estudiante
  static async findByStudent(
    studentId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ appointments: Appointment[]; total: number }> {
    const offset = (page - 1) * limit;

    const countSql =
      "SELECT COUNT(*) as total FROM appointments WHERE student_id = ?";
    const countResult = await query(countSql, [studentId]);
    const total = countResult[0].total;

    const sql = `
      SELECT a.*, 
             s.name as status_name,
             u.first_name as psychologist_first_name,
             u.last_name as psychologist_last_name
      FROM appointments a
      LEFT JOIN status_types s ON a.status_id = s.id
      LEFT JOIN users u ON a.psychologist_id = u.id
      WHERE a.student_id = ?
      ORDER BY a.scheduled_date DESC, a.scheduled_time DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    const appointments = await query(sql, [studentId]);
    return { appointments, total };
  }

  // Buscar citas por psicólogo
  static async findByPsychologist(
    psychologistId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ appointments: Appointment[]; total: number }> {
    const offset = (page - 1) * limit;

    const countSql =
      "SELECT COUNT(*) as total FROM appointments WHERE psychologist_id = ?";
    const countResult = await query(countSql, [psychologistId]);
    const total = countResult[0].total;

    const sql = `
      SELECT a.*, 
             s.name as status_name,
             u.first_name as student_first_name,
             u.last_name as student_last_name
      FROM appointments a
      LEFT JOIN status_types s ON a.status_id = s.id
      LEFT JOIN users u ON a.student_id = u.id
      WHERE a.psychologist_id = ?
      ORDER BY a.scheduled_date DESC, a.scheduled_time DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    const appointments = await query(sql, [psychologistId]);
    return { appointments, total };
  }

  // Buscar todas las citas con filtros
  static async findAll(
    page: number = 1,
    limit: number = 10,
    filters: {
      statusId?: number;
      psychologistId?: number;
      studentId?: number;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ): Promise<{ appointments: Appointment[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params: any[] = [];

    if (filters.statusId) {
      whereConditions.push("a.status_id = ?");
      params.push(filters.statusId);
    }
    if (filters.psychologistId) {
      whereConditions.push("a.psychologist_id = ?");
      params.push(filters.psychologistId);
    }
    if (filters.studentId) {
      whereConditions.push("a.student_id = ?");
      params.push(filters.studentId);
    }
    if (filters.dateFrom) {
      whereConditions.push("a.scheduled_date >= ?");
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      whereConditions.push("a.scheduled_date <= ?");
      params.push(filters.dateTo);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const countSql = `SELECT COUNT(*) as total FROM appointments a ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    const sql = `
      SELECT a.*, 
             s.name as status_name,
             u1.first_name as student_first_name,
             u1.last_name as student_last_name,
             u2.first_name as psychologist_first_name,
             u2.last_name as psychologist_last_name
      FROM appointments a
      LEFT JOIN status_types s ON a.status_id = s.id
      LEFT JOIN users u1 ON a.student_id = u1.id
      LEFT JOIN users u2 ON a.psychologist_id = u2.id
      ${whereClause}
      ORDER BY a.scheduled_date DESC, a.scheduled_time DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    const appointments = await query(sql, params);
    return { appointments, total };
  }

  // Actualizar cita
  static async update(
    id: number,
    updateData: Partial<Appointment>
  ): Promise<Appointment | null> {
    const fields = Object.keys(updateData).filter((key) => key !== "id");
    const values = fields.map(
      (field) => updateData[field as keyof Appointment]
    );
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const sql = `UPDATE appointments SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await query(sql, [...values, id]);

    return this.findById(id);
  }

  // Cancelar cita
  static async cancel(
    id: number,
    reason?: string
  ): Promise<Appointment | null> {
    const sql = `
      UPDATE appointments 
      SET status_id = (SELECT id FROM status_types WHERE name = 'CANCELLED' AND category = 'appointment'),
          cancelled_at = CURRENT_TIMESTAMP,
          notes = CONCAT(IFNULL(notes, ''), IFNULL(CONCAT('\nRazón de cancelación: ', ?), '')),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await query(sql, [reason, id]);
    return this.findById(id);
  }

  // Completar cita
  static async complete(
    id: number,
    notes?: string
  ): Promise<Appointment | null> {
    const sql = `
      UPDATE appointments 
      SET status_id = (SELECT id FROM status_types WHERE name = 'COMPLETED' AND category = 'appointment'),
          completed_at = CURRENT_TIMESTAMP,
          notes = CONCAT(IFNULL(notes, ''), IFNULL(CONCAT('\nNotas de finalización: ', ?), '')),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await query(sql, [notes, id]);
    return this.findById(id);
  }

  // Asignar psicólogo a cita
  static async assignPsychologist(
    id: number,
    psychologistId: number
  ): Promise<Appointment | null> {
    const sql = `
      UPDATE appointments 
      SET psychologist_id = ?,
          status_id = (SELECT id FROM status_types WHERE name = 'ASSIGNED' AND category = 'appointment'),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await query(sql, [psychologistId, id]);
    return this.findById(id);
  }

  // Verificar disponibilidad de horario
  static async checkAvailability(
    psychologistId: number,
    date: string,
    time: string
  ): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE psychologist_id = ? 
        AND scheduled_date = ? 
        AND scheduled_time = ?
        AND status_id NOT IN (
          SELECT id FROM status_types WHERE name IN ('CANCELLED') AND category = 'appointment'
        )
    `;
    const result = await query(sql, [psychologistId, date, time]);
    return result[0].count === 0;
  }

  // Obtener estadísticas de citas
  static async getStatistics(
    psychologistId?: number,
    dateFrom?: string,
    dateTo?: string
  ): Promise<any> {
    let whereClause = "";
    let params: any[] = [];

    if (psychologistId) {
      whereClause = "WHERE psychologist_id = ?";
      params.push(psychologistId);
    }

    if (dateFrom) {
      whereClause += whereClause
        ? " AND scheduled_date >= ?"
        : "WHERE scheduled_date >= ?";
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += whereClause
        ? " AND scheduled_date <= ?"
        : "WHERE scheduled_date <= ?";
      params.push(dateTo);
    }

    const sql = `
      SELECT 
        COUNT(*) as total_appointments,
        SUM(CASE WHEN s.name = 'COMPLETED' THEN 1 ELSE 0 END) as completed_appointments,
        SUM(CASE WHEN s.name = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_appointments,
        SUM(CASE WHEN s.name = 'PENDING' THEN 1 ELSE 0 END) as pending_appointments,
        SUM(CASE WHEN s.name = 'ASSIGNED' THEN 1 ELSE 0 END) as assigned_appointments
      FROM appointments a
      LEFT JOIN status_types s ON a.status_id = s.id
      ${whereClause}
    `;

    const result = await query(sql, params);
    return result[0];
  }
}

export class StatusTypeModel {
  // Buscar todos los tipos de estado
  static async findAll(): Promise<StatusType[]> {
    const sql = "SELECT * FROM status_types ORDER BY category, name";
    return await query(sql);
  }

  // Buscar por categoría
  static async findByCategory(category: string): Promise<StatusType[]> {
    const sql = "SELECT * FROM status_types WHERE category = ? ORDER BY name";
    return await query(sql, [category]);
  }

  // Buscar por ID
  static async findById(id: number): Promise<StatusType | null> {
    const sql = "SELECT * FROM status_types WHERE id = ?";
    const statuses = await query(sql, [id]);
    return statuses[0] || null;
  }
}

export class PsychologistAvailabilityModel {
  // Crear disponibilidad
  static async create(
    availabilityData: Omit<
      PsychologistAvailability,
      "id" | "created_at" | "updated_at"
    >
  ): Promise<PsychologistAvailability> {
    const { psychologist_id, day_of_week, start_time, end_time, is_available } =
      availabilityData;

    const sql = `
      INSERT INTO psychologist_availability (psychologist_id, day_of_week, start_time, end_time, is_available)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      psychologist_id,
      day_of_week,
      start_time,
      end_time,
      is_available,
    ]);
    const availability = await this.findById(result.insertId);
    if (!availability) {
      throw new Error("Error al crear disponibilidad");
    }
    return availability;
  }

  // Buscar por ID
  static async findById(id: number): Promise<PsychologistAvailability | null> {
    const sql = "SELECT * FROM psychologist_availability WHERE id = ?";
    const availabilities = await query(sql, [id]);
    return availabilities[0] || null;
  }

  // Buscar disponibilidad por psicólogo
  static async findByPsychologist(
    psychologistId: number
  ): Promise<PsychologistAvailability[]> {
    const sql =
      "SELECT * FROM psychologist_availability WHERE psychologist_id = ? ORDER BY day_of_week, start_time";
    return await query(sql, [psychologistId]);
  }

  // Actualizar disponibilidad
  static async update(
    id: number,
    updateData: Partial<PsychologistAvailability>
  ): Promise<PsychologistAvailability | null> {
    const fields = Object.keys(updateData).filter((key) => key !== "id");
    const values = fields.map(
      (field) => updateData[field as keyof PsychologistAvailability]
    );
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const sql = `UPDATE psychologist_availability SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await query(sql, [...values, id]);
    return this.findById(id);
  }

  // Eliminar disponibilidad
  static async delete(id: number): Promise<boolean> {
    const sql = "DELETE FROM psychologist_availability WHERE id = ?";
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  }
}
