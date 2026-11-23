import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Load Backend/.env if it exists.
const envPath = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);

// Read settings from .env, with defaults for local development.
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 8080),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_POOL_SIZE: Number(process.env.DB_POOL_SIZE || 10),
};

if (!env.DB_USER || !env.DB_NAME || env.DB_PASSWORD === undefined) {
  throw new Error('Set DB_USER, DB_PASSWORD, and DB_NAME in Backend/.env');
}

if (env.NODE_ENV === 'production') {
  if (!env.CLIENT_ORIGIN.startsWith('https://') || !env.DB_PASSWORD) {
    throw new Error('Production requires an HTTPS CLIENT_ORIGIN and a database password');
  }
}
