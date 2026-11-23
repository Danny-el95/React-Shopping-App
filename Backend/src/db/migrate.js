import mysql from 'mysql2/promise';
import { env } from '../config/env.js';
import { connectionOptions } from './pool.js';
import { migrate, readMigrations } from './migration-runner.js';

let connection;
try {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--status')) throw new Error('Usage: npm run migrate -- [--status]');
  const files = await readMigrations(new URL('./migrations/', import.meta.url));
  connection = await mysql.createConnection({ ...connectionOptions, multipleStatements: true });
  await migrate(connection, files, { database: env.DB_NAME, statusOnly: args.includes('--status') });
} catch (error) {
  console.error(error.code ? `Migration connection failed: ${error.code}` : error.message);
  process.exitCode = 1;
} finally {
  if (connection) await connection.end();
}
