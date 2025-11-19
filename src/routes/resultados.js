// backend/routes/resultados.js (por ejemplo)

// ===============================
// Rutas: Resultados de Votaciones
// ===============================
import express from "express";
import { pool } from "../db.js";   // 👈 usa el pool global, NO crees otro

const router = express.Router();

// ===============================
// 1️⃣ Procesar todos los resultados
// ===============================
router.post("/procesar", async (_req, res) => {
  const query = `
    DO $$
    BEGIN
      RAISE NOTICE 'Iniciando actualización de votos válidos...';
      PERFORM votaciones.actualizar_votos_validos();

      RAISE NOTICE 'Calculando cuociente...';
      PERFORM votaciones.actualizar_cuociente();

      RAISE NOTICE 'Actualizando umbral...';
      PERFORM votaciones.actualizar_umbral();

      RAISE NOTICE 'Sumando votos por partido...';
      PERFORM votaciones.actualizar_votos_partido();

      RAISE NOTICE 'Determinando partidos que pasaron el umbral...';
      PERFORM votaciones.actualizar_paso_umbral();

      RAISE NOTICE 'Calculando cifra repartidora...';
      PERFORM votaciones.calcular_cifra_repartidora();

      RAISE NOTICE 'Asignando curules a partidos...';
      PERFORM votaciones.asignar_curules();

      RAISE NOTICE 'Determinando candidatos elegidos...';
      PERFORM votaciones.determinar_candidatos_elegidos();

      RAISE NOTICE 'Procesando curules y elegidos en circunscripciones especiales...';
      PERFORM votaciones.calcular_curules_y_elegidos_especiales();

      RAISE NOTICE '✅ Procesamiento finalizado correctamente.';
    END $$;
  `;

  try {
    await pool.query(query);
    res.json({ ok: true, mensaje: "✅ Procesamiento completado correctamente." });
  } catch (error) {
    console.error("❌ Error al procesar resultados:", error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ===============================
// 2️⃣ Consultar resultados por circunscripción
// ===============================
router.get("/circunscripciones", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT cod_cir, votos_validos, cuociente, umbral, cifra_repartidora
      FROM votaciones.circunscripciones
      ORDER BY cod_cir;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener circunscripciones:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// 3️⃣ Consultar resultados por partido
// ===============================
router.get("/partidos", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT cod_partido, total_votos, paso_umbral, curules_ganados
      FROM votaciones.adscribe
      ORDER BY cod_partido;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener partidos:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// 4️⃣ Consultar candidatos elegidos
// ===============================
router.get("/candidatos", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id_elector,
          e.nombres AS nombre_candidato,
          p.nombrep AS nombre_partido,
          c.num_lista,
          ci.nombrec AS nombre_circunscripcion
         FROM votaciones.candidatos c
         NATURAL JOIN votaciones.adscribe a
         JOIN votaciones.electores e ON (e.id_elector=c.id_elector)
         JOIN votaciones.circunscripciones ci USING (cod_cir)
         JOIN votaciones.partidos p USING (cod_partido)
         WHERE c.elegido='SI'
      ORDER BY ci.cod_cir;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener los candidatos:", error);
    res.status(500).json({ error: "Error al consultar los resultados de los candidatos" });
  }
});

// GET /api/resultados/territoriales
router.get("/resultados/territoriales", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        cod_cir,
        nombrec AS nombre_circunscripcion,
        votos_validos,
        cuociente,
        umbral,
        cifra_repartidora,
        curules_circunscripcion,
        nombrep AS nombre_partido,
        total_votos,
        paso_umbral,
        curules_ganados
      FROM votaciones.v_resultados_territoriales
      ORDER BY cod_cir, nombrep;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener resultados territoriales:", error);
    res.status(500).json({ error: "Error al consultar resultados territoriales" });
  }
});

// GET /api/resultados/especiales
router.get("/resultados/especiales", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        cod_cir,
        nombrec AS nombre_circunscripcion,
        votos_validos,
        curules_circunscripcion,
        nombrep AS nombre_partido,
        total_votos,
        curules_ganados
      FROM votaciones.v_resultados_especiales
      ORDER BY cod_cir, nombrep;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener resultados especiales:", error);
    res.status(500).json({ error: "Error al consultar resultados de circunscripciones especiales" });
  }
});

export default router;
