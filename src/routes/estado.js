// src/routes/estado.js
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

/**
 * GET /api/estado/jornada
 *
 * Regresa:
 * {
 *   inicio: timestamptz | null,
 *   fin: timestamptz | null,
 *   ahora: timestamptz,
 *   abierta: boolean,           // solo true si ahora ∈ [inicio, fin]
 *   estado: "sin_configurar" | "no_iniciada" | "abierta" | "cerrada"
 * }
 */
router.get("/jornada", async (_req, res) => {
  try {
    const q = `
      SELECT inicio, fin
      FROM votaciones.jornada
      WHERE id = 1
    `;
    const r = await pool.query(q);

    const row   = r.rows[0] || {};
    const inicio = row.inicio || null;
    const fin    = row.fin || null;
    const ahora  = new Date();

    let abierta = false;
    let estado  = "sin_configurar";

    if (inicio && fin) {
      const ini = new Date(inicio);
      const fi  = new Date(fin);

      if (ahora < ini) {
        estado  = "no_iniciada";   // configurada pero aún no comienza
        abierta = false;
      } else if (ahora > fi) {
        estado  = "cerrada";       // terminó
        abierta = false;
      } else {
        estado  = "abierta";       // ahora está dentro del rango
        abierta = true;
      }
    } else {
      // cualquiera de los dos es NULL => jornada cerrada / sin configurar
      estado  = "sin_configurar";
      abierta = false;
    }

    res.json({ inicio, fin, ahora, abierta, estado });
  } catch (e) {
    console.error("ESTADO JORNADA ERROR:", e);
    res.status(500).json({ message: "Error interno" });
  }
});

export default router;
