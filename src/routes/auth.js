import express from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

const router = express.Router();

/**
 * POST /api/login
 * body: { id_elector, password }
 *
 * 200 OK           -> { ok:true, elector:{ id_elector, nombres, codigo_dane, estado } }
 * 401 UNAUTHORIZED -> { ok:false, message:"Contraseña incorrecta" | "No existe el documento" }
 * 400 BAD REQUEST  -> { ok:false, message:"Faltan credenciales" | "Documento inválido" }
 * 409 CONFLICT     -> { ok:false, message:"El elector ya registró su voto." }
 * 423 LOCKED       -> { ok:false, message:"El usuario puede votar pasados X min.", remaining_ms }
 */
router.post("/login", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id_elector, password } = req.body || {};

    // Validaciones básicas
    if (!id_elector || !password) {
      return res.status(400).json({ ok:false, message: "Faltan credenciales" });
    }
    if (!/^\d+$/.test(String(id_elector))) {
      return res.status(400).json({ ok:false, message: "Documento inválido" });
    }

    // Traer elector (incluye bloqueado_hasta para gestionar bloqueos)
    const q = `
      SELECT id_elector, nombres, password, estado, codigo_dane, bloqueado_hasta
      FROM votaciones.electores
      WHERE id_elector = $1::bigint
      LIMIT 1
    `;
    const { rows } = await client.query(q, [id_elector]);

    // No existe
    if (rows.length === 0) {
      return res.status(401).json({ ok:false, message: "No existe el documento" });
    }

    const elector = rows[0];

    // Verificación de contraseña (hash bcrypt o texto plano)
    const stored = elector.password || "";
    const seemsBcrypt = stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$");

    let okPass = false;
    if (seemsBcrypt) {
      try {
        okPass = await bcrypt.compare(password, stored);
      } catch {
        okPass = false;
      }
    } else {
      okPass = password === stored;
    }

    if (!okPass) {
      return res.status(401).json({ ok:false, message: "Contraseña incorrecta" });
    }

    // Normalizamos estado (posibles datos históricos 'Votó', 'VOTO', etc.)
    const estadoRaw = (elector.estado || "").toUpperCase().trim();
    const estado =
      estadoRaw === "VOTÓ" || estadoRaw === "VOTO" ? "EFECTUADO" : estadoRaw;

    // Caso EFECTUADO
    if (estado === "EFECTUADO") {
      return res.status(409).json({ ok:false, message: "El elector ya registró su voto." });
    }

    // Caso BLOQUEADO: si el bloqueo sigue vigente, informar tiempo restante
    if (estado === "BLOQUEADO") {
      const now = new Date();
      const hasta = elector.bloqueado_hasta ? new Date(elector.bloqueado_hasta) : null;

      if (hasta && hasta > now) {
        const remaining_ms = hasta.getTime() - now.getTime();
        return res.status(423).json({
          ok:false,
          message: "El usuario puede votar pasados los minutos restantes.",
          remaining_ms
        });
      }

      // Si el bloqueo ya venció, reactivar en caliente
      await client.query(
        `UPDATE votaciones.electores
            SET estado = 'DISPONIBLE', bloqueado_hasta = NULL
          WHERE id_elector = $1::bigint`,
        [id_elector]
      );
    }

    // Éxito: devolver datos mínimos del elector (estado DISPONIBLE)
    return res.status(200).json({
      ok: true,
      elector: {
        id_elector: elector.id_elector,
        nombres: elector.nombres,
        codigo_dane: elector.codigo_dane,
        estado: "DISPONIBLE"
      },
    });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return res.status(500).json({ ok:false, message: e.message || "Error interno del servidor" });
  } finally {
    client.release();
  }
});

export default router;
