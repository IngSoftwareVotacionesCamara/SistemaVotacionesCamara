import express from "express";
import { pool } from "../db.js";

const router = express.Router();

/* =========================
   CIRCUNSCRIPCIONES
   GET /api/circunscripciones?codigo_dane=11
========================= */
router.get("/circunscripciones", async (req, res) => {
  let { codigo_dane } = req.query;

  if (codigo_dane === undefined) {
    return res.status(400).json({ message: "Falta parámetro: codigo_dane" });
  }
  codigo_dane = parseInt(codigo_dane, 10);
  if (Number.isNaN(codigo_dane)) {
    return res.status(400).json({ message: "Parámetro inválido: codigo_dane debe ser numérico" });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT c.cod_cir, c.nombreC AS nombre, c.tipo
      FROM votaciones.representacion r
      JOIN votaciones.circunscripciones c ON r.cod_cir = c.cod_cir
      WHERE r.codigo_dane = $1
      ORDER BY c.nombreC;
      `,
      [codigo_dane]
    );
    // Siempre devolver array
    return res.json(rows);
  } catch (err) {
    console.error("SQL /circunscripciones:", err);
    return res.status(500).json({ message: "Error consultando circunscripciones" });
  }
});

/* =========================
   PARTIDOS
   GET /api/partidos?codigo_dane=11&cod_cir=101
========================= */
router.get("/partidos", async (req, res) => {
  let { codigo_dane, cod_cir } = req.query;

  if (codigo_dane === undefined || cod_cir === undefined) {
    return res.status(400).json({ message: "Faltan parámetros: codigo_dane y cod_cir" });
  }
  codigo_dane = parseInt(codigo_dane, 10);
  cod_cir     = parseInt(cod_cir, 10);
  if (Number.isNaN(codigo_dane) || Number.isNaN(cod_cir)) {
    return res.status(400).json({ message: "Parámetros inválidos: deben ser numéricos" });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT p.cod_partido, p.nombreP AS nombre, a.tipo_lista
      FROM votaciones.adscribe a
      JOIN votaciones.partidos p ON a.cod_partido = p.cod_partido
      WHERE a.codigo_dane = $1 AND a.cod_cir = $2
      ORDER BY p.nombreP;
      `,
      [codigo_dane, cod_cir]
    );
    // Siempre devolver array
    return res.json(rows);
  } catch (err) {
    console.error("SQL /partidos:", err);
    return res.status(500).json({ message: "Error consultando partidos" });
  }
});

/* =========================
   CANDIDATOS
   GET /api/candidatos?codigo_dane=11&cod_cir=101&cod_partido=1
========================= */
router.get("/candidatos", async (req, res) => {
  let { codigo_dane, cod_cir, cod_partido } = req.query;

  if ([codigo_dane, cod_cir, cod_partido].some(v => v === undefined)) {
    return res.status(400).json({ message: "Faltan parámetros: codigo_dane, cod_cir, cod_partido" });
  }
  codigo_dane = parseInt(codigo_dane, 10);
  cod_cir     = parseInt(cod_cir, 10);
  cod_partido = parseInt(cod_partido, 10);
  if ([codigo_dane, cod_cir, cod_partido].some(Number.isNaN)) {
    return res.status(400).json({ message: "Parámetros inválidos: deben ser numéricos" });
  }

  try {
    // Detectar tipo de lista
    const tl = await pool.query(
      `
      SELECT a.tipo_lista
      FROM votaciones.adscribe a
      WHERE a.codigo_dane = $1 AND a.cod_cir = $2 AND a.cod_partido = $3;
      `,
      [codigo_dane, cod_cir, cod_partido]
    );

    if (tl.rows.length === 0) {
      return res.status(404).json({ message: "Partido no adscrito a la circunscripción/departamento" });
    }

    const tipo = (tl.rows[0].tipo_lista || "").toLowerCase();
    if (tipo === "cerrada") {
      // lista cerrada → no devuelve candidatos (204 + header)
      res.setHeader("X-Lista", "cerrada");
      return res.status(204).send();
    }

    // lista abierta → devolver candidatos
    const { rows } = await pool.query(
      `
      SELECT c.cod_partido, c.codigo_dane, c.cod_cir, c.num_lista,
             e.id_elector, e.nombres AS nombre
      FROM votaciones.candidatos c
      JOIN votaciones.electores e ON e.id_elector = c.id_elector
      WHERE c.codigo_dane = $1 AND c.cod_cir = $2 AND c.cod_partido = $3
      ORDER BY c.num_lista, e.nombres;
      `,
      [codigo_dane, cod_cir, cod_partido]
    );

    return res.json(rows);
  } catch (err) {
    console.error("SQL /candidatos:", err);
    return res.status(500).json({ message: "Error consultando candidatos" });
  }
});

export default router;
