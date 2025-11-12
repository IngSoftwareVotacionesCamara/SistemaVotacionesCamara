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
  try {
    const usuario  = (req.body.user ?? req.body.usuario ?? "").trim();
    const password =  req.body.pass ?? req.body.password ?? "";

    if (!usuario || !password) {
      return res.status(400).json({ ok:false, message:"Faltan credenciales" });
    }

    const q = `
      SELECT id, usuario, password
      FROM votaciones.admin
      WHERE usuario = $1
      LIMIT 1
    `;
    const { rows } = await pool.query(q, [usuario]);
    if (rows.length === 0) {
      return res.status(401).json({ ok:false, message:"Usuario o contraseña inválidos" });
    }

    const admin = rows[0];
    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) {
      return res.status(401).json({ ok:false, message:"Usuario o contraseña inválidos" });
    }

    req.session.admin = { id: admin.id, usuario: admin.usuario };
    return res.json({ ok:true, admin: { id: admin.id, usuario: admin.usuario } });
  } catch (e) {
    console.error("ADMIN LOGIN ERROR:", e);
    return res.status(500).json({ ok:false, message:"Error interno" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    res.json({ ok:true });
  });
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

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid", { path: "/" }); // <- igual al name del session
    res.json({ ok: true });
  });
});

export default router;
