// ===============================
// Servidor principal
// ===============================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";

import authRoutes from "./routes/auth.js";
import votoRoutes from "./routes/voto.js";
import catalogosRoutes from "./routes/catalogos.js";
import votoRouter from './routes/voto.js';
import electoresRouter from './routes/electores.js';
import certificadoRouter from "./routes/certificado.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_URL = "https://sistemavotacionescamara.onrender.com/api";


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use("/api", authRoutes);
app.use("/api", votoRoutes);
app.use("/api", catalogosRoutes);
app.use('/api', votoRouter);
app.use('/api', electoresRouter);
app.use("/api", certificadoRouter);

// Salud
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});
app.get("/votar.html", (_req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/votar.html"));
});

app.get("/api/_diag", async (_req, res) => {
  try {
    const a = await pool.query("select current_database() as db");
    const b = await pool.query(`
      select count(*)::int as ok
      from information_schema.tables
      where table_schema='votaciones' and table_name='electores'
    `);
    res.json({ db: a.rows[0].db, electoresTable: !!b.rows[0].ok });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});