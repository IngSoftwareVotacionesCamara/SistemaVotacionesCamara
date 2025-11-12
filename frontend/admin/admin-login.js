import express from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

const router = express.Router();

/**
 * POST /api/admin/login
 * Acepta body con { user, pass } o { usuario, password }
 */
router.post("/login", async (req, res) => {
  try {
    const usuario = (req.body.user ?? req.body.usuario ?? "").trim();
    const password = req.body.pass ?? req.body.password ?? "";

    if (!usuario || !password) {
      return res.status(400).json({ ok: false, message: "Faltan credenciales" });
    }

    const q = `
      SELECT id, usuario, password
      FROM votaciones.admin
      WHERE usuario = $1
      LIMIT 1
    `;
    const { rows } = await pool.query(q, [usuario]);

    if (rows.length === 0) {
      return res.status(401).json({ ok: false, message: "Usuario o contraseña inválidos" });
    }

    const admin = rows[0];

    // Soporta hash bcrypt únicamente (recomendado). Si tuvieras legados en plano, puedes permitir el else.
    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) {
      return res.status(401).json({ ok: false, message: "Usuario o contraseña inválidos" });
    }

    // Sesión
    req.session.admin = { id: admin.id, usuario: admin.usuario };
    return res.json({ ok: true, admin: { id: admin.id, usuario: admin.usuario } });
  } catch (e) {
    console.error("ADMIN LOGIN ERROR:", e);
    return res.status(500).json({ ok: false, message: "Error interno" });
  }
});

/**
 * POST /api/admin/logout
 */
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    res.json({ ok: true });
  });
});

export default router;
