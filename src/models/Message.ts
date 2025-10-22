import { query } from "@/config/database";
import { Message } from "@/types";

export class MessageModel {
  // Crear mensaje
  static async create(
    messageData: Omit<Message, "id" | "created_at" | "updated_at">
  ): Promise<Message> {
    const { sender_id, recipient_id, appointment_id, content } = messageData;

    const sql = `
      INSERT INTO messages (sender_id, recipient_id, appointment_id, content)
      VALUES (?, ?, ?, ?)
    `;

    const result = await query(sql, [
      sender_id,
      recipient_id,
      appointment_id ?? null,
      content,
    ]);
    const message = await this.findById(result.insertId);
    if (!message) {
      throw new Error("Error al crear mensaje");
    }
    return message;
  }

  // Buscar mensaje por ID
  static async findById(id: number): Promise<Message | null> {
    const sql = `
      SELECT m.*, 
             u1.first_name as sender_first_name,
             u1.last_name as sender_last_name,
             u2.first_name as recipient_first_name,
             u2.last_name as recipient_last_name
      FROM messages m
      LEFT JOIN users u1 ON m.sender_id = u1.id
      LEFT JOIN users u2 ON m.recipient_id = u2.id
      WHERE m.id = ?
    `;
    const messages = await query(sql, [id]);
    return messages[0] || null;
  }

  // Buscar conversación entre dos usuarios
  static async findConversation(
    userId1: number,
    userId2: number,
    page: number = 1,
    limit: number = 50
  ): Promise<{ messages: Message[]; total: number }> {
    const offset = (page - 1) * limit;

    const countSql = `
      SELECT COUNT(*) as total 
      FROM messages 
      WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
    `;
    const countResult = await query(countSql, [
      userId1,
      userId2,
      userId2,
      userId1,
    ]);
    const total = countResult[0].total;

    const sql = `
      SELECT m.*, 
             u1.first_name as sender_first_name,
             u1.last_name as sender_last_name,
             u2.first_name as recipient_first_name,
             u2.last_name as recipient_last_name
      FROM messages m
      LEFT JOIN users u1 ON m.sender_id = u1.id
      LEFT JOIN users u2 ON m.recipient_id = u2.id
      WHERE (m.sender_id = ? AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = ?)
      ORDER BY m.created_at ASC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    const messages = await query(sql, [
      userId1,
      userId2,
      userId2,
      userId1,
    ]);
    return { messages, total };
  }

  // Buscar mensajes por usuario (todos los chats)
  static async findByUser(
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ messages: Message[]; total: number }> {
    const offset = (page - 1) * limit;

    const countSql = `
      SELECT COUNT(*) as total 
      FROM messages 
      WHERE sender_id = ? OR recipient_id = ?
    `;
    const countResult = await query(countSql, [userId, userId]);
    const total = countResult[0].total;

    const sql = `
      SELECT m.*, 
             u1.first_name as sender_first_name,
             u1.last_name as sender_last_name,
             u2.first_name as recipient_first_name,
             u2.last_name as recipient_last_name
      FROM messages m
      LEFT JOIN users u1 ON m.sender_id = u1.id
      LEFT JOIN users u2 ON m.recipient_id = u2.id
      WHERE m.sender_id = ? OR m.recipient_id = ?
      ORDER BY m.created_at DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    const messages = await query(sql, [userId, userId]);
    return { messages, total };
  }

  // Buscar mensajes no leídos por usuario
  static async findUnreadByUser(userId: number): Promise<Message[]> {
    const sql = `
      SELECT m.*, 
             u.first_name as sender_first_name,
             u.last_name as sender_last_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.recipient_id = ? AND m.is_read = FALSE
      ORDER BY m.created_at DESC
    `;
    return await query(sql, [userId]);
  }

  // Marcar mensaje como leído
  static async markAsRead(id: number): Promise<Message | null> {
    const sql = `
      UPDATE messages 
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    await query(sql, [id]);
    return this.findById(id);
  }

  // Marcar todos los mensajes de una conversación como leídos
  static async markConversationAsRead(
    senderId: number,
    recipientId: number
  ): Promise<void> {
    const sql = `
      UPDATE messages 
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE sender_id = ? AND recipient_id = ? AND is_read = FALSE
    `;
    await query(sql, [senderId, recipientId]);
  }

  // Buscar mensajes por cita
  static async findByAppointment(appointmentId: number): Promise<Message[]> {
    const sql = `
      SELECT m.*, 
             u1.first_name as sender_first_name,
             u1.last_name as sender_last_name,
             u2.first_name as recipient_first_name,
             u2.last_name as recipient_last_name
      FROM messages m
      LEFT JOIN users u1 ON m.sender_id = u1.id
      LEFT JOIN users u2 ON m.recipient_id = u2.id
      WHERE m.appointment_id = ?
      ORDER BY m.created_at ASC
    `;
    return await query(sql, [appointmentId]);
  }

  // Obtener conversaciones recientes (último mensaje de cada chat)
  static async getRecentConversations(userId: number): Promise<any[]> {
    const sql = `
      SELECT 
        m.*,
        u.first_name as other_user_first_name,
        u.last_name as other_user_last_name,
        u.avatar_url as other_user_avatar,
        CASE 
          WHEN m.sender_id = ? THEN m.recipient_id 
          ELSE m.sender_id 
        END as other_user_id,
        unread_count.unread_messages
      FROM messages m
      LEFT JOIN users u ON (
        CASE 
          WHEN m.sender_id = ? THEN m.recipient_id 
          ELSE m.sender_id 
        END = u.id
      )
      LEFT JOIN (
        SELECT 
          CASE 
            WHEN sender_id = ? THEN recipient_id 
            ELSE sender_id 
          END as other_user_id,
          COUNT(*) as unread_messages
        FROM messages 
        WHERE recipient_id = ? AND is_read = FALSE
        GROUP BY other_user_id
      ) unread_count ON (
        CASE 
          WHEN m.sender_id = ? THEN m.recipient_id 
          ELSE m.sender_id 
        END = unread_count.other_user_id
      )
      WHERE m.id IN (
        SELECT MAX(id) 
        FROM messages 
        WHERE sender_id = ? OR recipient_id = ?
        GROUP BY 
          CASE 
            WHEN sender_id = ? THEN recipient_id 
            ELSE sender_id 
          END
      )
      ORDER BY m.created_at DESC
    `;

    return await query(sql, [
      userId,
      userId,
      userId,
      userId,
      userId,
      userId,
      userId,
      userId,
    ]);
  }

  // Eliminar mensaje
  static async delete(id: number): Promise<boolean> {
    const sql = "DELETE FROM messages WHERE id = ?";
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  }

  // Buscar mensajes con filtros
  static async search(
    userId: number,
    searchTerm: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ messages: Message[]; total: number }> {
    const offset = (page - 1) * limit;

    const countSql = `
      SELECT COUNT(*) as total 
      FROM messages 
      WHERE (sender_id = ? OR recipient_id = ?) 
        AND content LIKE ?
    `;
    const countResult = await query(countSql, [
      userId,
      userId,
      `%${searchTerm}%`,
    ]);
    const total = countResult[0].total;

    const sql = `
      SELECT m.*, 
             u1.first_name as sender_first_name,
             u1.last_name as sender_last_name,
             u2.first_name as recipient_first_name,
             u2.last_name as recipient_last_name
      FROM messages m
      LEFT JOIN users u1 ON m.sender_id = u1.id
      LEFT JOIN users u2 ON m.recipient_id = u2.id
      WHERE (m.sender_id = ? OR m.recipient_id = ?) 
        AND m.content LIKE ?
      ORDER BY m.created_at DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    const messages = await query(sql, [
      userId,
      userId,
      `%${searchTerm}%`,
    ]);
    return { messages, total };
  }
}
