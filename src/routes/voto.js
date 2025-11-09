import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

/**
 * POST /api/votar
 * body: { id_elector, cod_partido, codigo_dane, cod_cir }
 */
router.post('/votar', async (req, res) => {
  const { id_elector, cod_partido, codigo_dane, cod_cir } = req.body;

  // Validación básica
  if (!id_elector || !codigo_dane || !cod_cir) {
    return res.status(400).json({ message: 'Faltan datos obligatorios.' });
  }

  try {
    await pool.query('BEGIN');

    // 1️⃣ Verificar si el elector existe
    const electorRes = await pool.query(
      'SELECT estado FROM votaciones.electores WHERE id_elector = $1',
      [id_elector]
    );

    if (electorRes.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Elector no encontrado.' });
    }

    // 2️⃣ Revisar si ya votó
    const { estado } = electorRes.rows[0];
    if (estado === 'Votó') {
      await pool.query('ROLLBACK');
      return res.status(403).json({ message: 'El elector ya votó.' });
    }

    // 3️⃣ Registrar el voto (solo datos de votación)
    await pool.query(
      `INSERT INTO votaciones.vota (cod_partido, codigo_dane, cod_cir)
       VALUES ($1, $2, $3)`,
      [cod_partido || null, codigo_dane, cod_cir]
    );

    // 4️⃣ Cambiar el estado del elector a "Votó"
    await pool.query(
      `UPDATE votaciones.electores SET estado = 'Votó' WHERE id_elector = $1`,
      [id_elector]
    );

    await pool.query('COMMIT');
    res.json({ message: '✅ Voto registrado correctamente.' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error en /votar:', error);
    res.status(500).json({ message: 'Error al registrar voto.', error: error.message });
  }
});

export default router;


