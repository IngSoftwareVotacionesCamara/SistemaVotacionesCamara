import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL no está definida. Usando localhost (fallará en Render).');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});