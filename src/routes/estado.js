// src/routes/estado.js
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/jornada", async (_req, res) => {
  const q = `SELECT inicio, fin FROM votaciones.jornada WHERE id=1`;
  const r = await pool.query(q);
  if (!r.rowCount) {
    return res.json({ abierta: true, inicio: null, fin: null, ahora: new Date().toISOString() });
  }
  const { inicio, fin } = r.rows[0];
  const ahora = new Date();
  const abierta = inicio && fin ? (ahora >= new Date(inicio) && ahora <= new Date(fin)) : true;

  res.json({
    abierta,
    inicio,
    fin,
    ahora: ahora.toISOString(),
    ms_restantes: abierta ? (new Date(fin) - ahora) : 0
  });
});

export default router;
