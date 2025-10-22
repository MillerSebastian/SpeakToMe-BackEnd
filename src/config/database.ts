import mysql from "mysql2/promise";
import { config } from "@/config";

const dbConfig = {
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
};

// Crear el pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Conexión a la base de datos establecida correctamente");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error);
    return false;
  }
};

// Función para ejecutar consultas
export const query = async (sql: string, params?: any[]): Promise<any> => {
  try {
    const [rows] = await pool.execute(sql, params || []);
    return rows;
  } catch (error) {
    console.error("Error ejecutando consulta:", error);
    throw error;
  }
};

// Función para obtener una conexión del pool
export const getConnection = async () => {
  return await pool.getConnection();
};

export default pool;

