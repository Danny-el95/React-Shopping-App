import mysql from 'mysql2/promise';
import { env } from '../config/env.js';
export const connectionOptions = {
  host: env.DB_HOST, port: env.DB_PORT, user: env.DB_USER,
  password: env.DB_PASSWORD, database: env.DB_NAME, charset: 'utf8mb4', timezone: 'Z',
  supportBigNumbers: true, bigNumberStrings: true, multipleStatements: false, connectTimeout: 10000,
};
export const pool = mysql.createPool({
  ...connectionOptions, waitForConnections: true, connectionLimit: env.DB_POOL_SIZE, queueLimit: 100,
});
