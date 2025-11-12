// src/routes/admin.js
import express from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

const router = express.Router();

// ⚙️ Credenciales admin: usa variables de entorno
// ADMIN_USER=admin
// ADMIN_PASS=hash_bcrypt_o_texto (acepto bcrypt o texto plano)
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

// Middleware de sesión admin
function requireAdmin(req, res, next) {
  if (req.session?.isAdmin) return next();
  return res.status(401).json({ message: "No autorizado" });
}

/* -------------------- LOGIN ADMIN -------------------- */
router.post("/login", async (req, res) => {
  const { user, pass } = req.body || {};
  if (!user || !pass) return res.status(400).json({ message: "Faltan credenciales" });

  if (user !== ADMIN_USER) return res.status(401).json({ message: "Usuario o contraseña inválidos" });

  const seemsBcrypt = ADMIN_PASS.startsWith("$2a$") || ADMIN_PASS.startsWith("$2b$") || ADMIN_PASS.startsWith("$2y$");
  let ok = false;
  if (seemsBcrypt) {
    try { ok = await bcrypt.compare(pass, ADMIN_PASS); } catch { ok = false; }
  } else {
    ok = pass === ADMIN_PASS;
  }
  if (!ok) return res.status(401).json({ message: "Usuario o contraseña inválidos" });

  req.session.isAdmin = true;
  return res.json({ ok: true });
});

router.post("/logout", (req, res) => {
  req.session.isAdmin = false;
  req.session.destroy(()=>{});
  res.json({ ok: true });
});

/* -------------------- JORNADA -------------------- */
// GET actual
router.get("/jornada", requireAdmin, async (_req, res) => {
  const q = `SELECT inicio, fin, updated_at FROM votaciones.jornada WHERE id=1`;
  const r = await pool.query(q);
  if (!r.rowCount) return res.json({ inicio: null, fin: null, updated_at: null });
  res.json(r.rows[0]);
});

// PUT actualizar
router.put("/jornada", requireAdmin, async (req, res) => {
  const { inicio, fin } = req.body || {};
  if (!inicio || !fin) return res.status(400).json({ message: "inicio y fin son obligatorios" });
  const q = `
    INSERT INTO votaciones.jornada (id, inicio, fin, updated_at)
    VALUES (1, $1::timestamptz, $2::timestamptz, now())
    ON CONFLICT (id) DO UPDATE SET
      inicio = EXCLUDED.inicio,
      fin = EXCLUDED.fin,
      updated_at = now()
    RETURNING inicio, fin, updated_at;
  `;
  const r = await pool.query(q, [inicio, fin]);
  res.json(r.rows[0]);
});

// POST cerrar ahora (opcional)
router.post("/jornada/cerrar_ahora", requireAdmin, async (_req, res) => {
  const q = `UPDATE votaciones.jornada SET fin = now(), updated_at = now() WHERE id=1 RETURNING inicio, fin`;
  const r = await pool.query(q);
  res.json(r.rows[0] || {});
});

/* -------------------- RESULTADOS (stub) -------------------- */
router.post("/resultados/recalcular", requireAdmin, async (_req, res) => {
  // TODO: implementar cálculo real más adelante
  res.json({ ok: true, message: "Recalculo disparado (stub)" });
});

export default router;
