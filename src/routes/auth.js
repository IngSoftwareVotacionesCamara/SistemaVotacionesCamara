import express from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

const router = express.Router();

/**
 * POST /api/login
 * body: { id_elector, password, tipo_id? }
 */
router.post("/login", async (req, res) => {
  try {
    const { id_elector, password } = req.body;

    // Validaciones básicas
    if (!id_elector || !password) {
      return res.status(400).json({ message: "Faltan credenciales" });
    }
    if (!/^\d+$/.test(String(id_elector))) {
      return res.status(400).json({ message: "Documento inválido" });
    }

    // Consulta: castear a BIGINT para evitar 'operator does not exist: bigint = text'
    const q = `
      SELECT id_elector, nombres, password, estado, codigo_dane
      FROM votaciones.electores
      WHERE id_elector = $1::bigint
      LIMIT 1
    `;
    const { rows } = await pool.query(q, [id_elector]);

    // No existe
    if (rows.length === 0) {
      return res.status(401).json({ message: "No existe el documento" });
    }

    const elector = rows[0];

    // Ya votó
    if ((elector.estado || "").toLowerCase() === "votó" || (elector.estado || "").toLowerCase() === "voto") {
      return res.status(403).json({ message: "El elector ya votó." });
    }

    // Verificación de contraseña (hash bcrypt o texto plano)
    const stored = elector.password || "";
    const seemsBcrypt = stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$");

    let ok = false;
    if (seemsBcrypt) {
      try {
        ok = await bcrypt.compare(password, stored);
      } catch {
        ok = false;
      }
    } else {
      ok = password === stored;
    }

    if (!ok) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // Éxito
    return res.json({
      message: "Acceso permitido",
      elector: {
        id_elector: elector.id_elector,
        nombres: elector.nombres,
        codigo_dane: elector.codigo_dane,
      },
    });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    // Durante pruebas devolvemos el mensaje real; en prod podrías dejar uno genérico
    return res.status(500).json({ message: e.message || "Error interno del servidor" });
  }
});

export default router;
