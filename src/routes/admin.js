// src/routes/admin.js
import express from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

const router = express.Router();

// Debe comprobar **admin**, no isAdmin
function requireAdmin(req, res, next) {
  if (req.session?.admin) return next();
  return res.status(401).json({ ok: false, message: "No autorizado" });
}

/* -------- LOGIN ADMIN -------- */
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
    if (!rows.length) {
      return res.status(401).json({ ok:false, message:"Usuario o contraseña inválidos" });
    }

    const admin = rows[0];
    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) {
      return res.status(401).json({ ok:false, message:"Usuario o contraseña inválidos" });
    }

    // 🎯 Guardamos en la sesión la misma clave que usan los guards
    req.session.admin = { id: admin.id, usuario: admin.usuario };
    return res.json({ ok:true, admin: { id: admin.id, usuario: admin.usuario } });
  } catch (e) {
    console.error("ADMIN LOGIN ERROR:", e);
    return res.status(500).json({ ok:false, message:"Error interno" });
  }
});

/* -------- LOGOUT -------- */
router.post("/logout", (req, res) => {
  // destruir si existe, y limpiar cookie con mismas opciones
  const done = () => {
    res.clearCookie("sid", {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.json({ ok: true });
  };
  if (req.session) req.session.destroy(done);
  else done();
});

/* -------- JORNADA -------- */
router.get("/jornada", requireAdmin, async (_req, res) => {
  try {
    const q = `
      SELECT
        inicio::text AS inicio,
        fin::text    AS fin
      FROM votaciones.jornada
      WHERE id = 1
    `;
    const r = await pool.query(q);

    if (!r.rowCount) {
      // No hay fila configurada
      return res.json({ inicio: null, fin: null });
    }

    const { inicio, fin } = r.rows[0];
    return res.json({ inicio, fin });
  } catch (e) {
    console.error("ADMIN JORNADA GET ERROR:", e);
    return res.status(500).json({ message: "Error al obtener jornada" });
  }
});

// PUT actualizar
router.put("/jornada", requireAdmin, async (req, res) => {
  const { inicio, fin } = req.body || {};

  if (!inicio || !fin) {
    return res.status(400).json({ message: "inicio y fin son obligatorios" });
  }

  const q = `
    INSERT INTO votaciones.jornada (id, inicio, fin, updated_at)
    VALUES (
      1,
      $1::timestamp AT TIME ZONE 'America/Bogota',
      $2::timestamp AT TIME ZONE 'America/Bogota',
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      inicio     = EXCLUDED.inicio,
      fin        = EXCLUDED.fin,
      updated_at = now()
    RETURNING inicio, fin, updated_at;
  `;

  try {
    const r = await pool.query(q, [inicio, fin]);
    return res.json(r.rows[0]);
  } catch (e) {
    console.error("ERROR GUARDANDO JORNADA:", e);
    return res.status(500).json({ message: "Error interno al guardar jornada" });
  }
});

/* -------- RESULTADOS (stub) -------- */
router.post("/resultados/recalcular", requireAdmin, async (_req, res) => {
  res.json({ ok: true, message: "Recalculo disparado (stub)" });
});

export default router;
