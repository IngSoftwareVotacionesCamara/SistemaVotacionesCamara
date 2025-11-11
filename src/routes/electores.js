// src/routes/electores.js (ESM)
import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

/**
 * POST /api/electores/:id/bloquear
 * Bloquea por 15 minutos solo si hoy NO ha votado y está DISPONIBLE.
 * Si ya está BLOQUEADO, extiende/renueva la ventana de 15 min.
 */
router.post('/electores/:id/bloquear', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Trae estado actual (con fila bloqueada)
    const q = await client.query(
      `SELECT estado, bloqueado_hasta
         FROM votaciones.electores
        WHERE id_elector = $1
        FOR UPDATE`,
      [id]
    );

    if (q.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Elector no existe.' });
    }

    const { estado } = q.rows[0];

    // Si ya votó, no bloqueamos
    if (estado === 'EFECTUADO') {
      await client.query('ROLLBACK');
      return res.status(200).json({ ok: true, message: 'Elector ya efectuó el voto; no se bloquea.' });
    }

    // Bloquear por 15 minutos desde ahora
    const mins = 15;
    const upd = await client.query(
      `UPDATE votaciones.electores
          SET estado = 'BLOQUEADO',
              bloqueado_hasta = NOW() + ($1 || ' minutes')::INTERVAL
        WHERE id_elector = $2`,
      [mins, id]
    );

    await client.query('COMMIT');
    return res.status(200).json({ ok: true, message: 'Elector bloqueado por 15 minutos.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /electores/:id/bloquear', err);
    return res.status(500).json({ message: 'Error al bloquear elector.' });
  } finally {
    client.release();
  }
});

/**
 * (Opcional) GET /api/electores/:id
 * Devuelve estado "refrescado": si estaba BLOQUEADO pero ya venció, lo pasa a DISPONIBLE.
 */
router.get('/electores/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const q = await client.query(
      `SELECT estado, bloqueado_hasta
         FROM votaciones.electores
        WHERE id_elector = $1
        FOR UPDATE`,
      [id]
    );
    if (q.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Elector no existe.' });
    }

    let { estado, bloqueado_hasta } = q.rows[0];

    // Auto-desbloqueo perezoso (lazy): si ya venció
    if (estado === 'BLOQUEADO' && bloqueado_hasta && new Date(bloqueado_hasta) <= new Date()) {
      await client.query(
        `UPDATE votaciones.electores
            SET estado = 'DISPONIBLE', bloqueado_hasta = NULL
          WHERE id_elector = $1`,
        [id]
      );
      estado = 'DISPONIBLE';
      bloqueado_hasta = null;
    }

    await client.query('COMMIT');
    return res.status(200).json({ ok: true, estado, bloqueado_hasta });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('GET /electores/:id', err);
    return res.status(500).json({ message: 'Error al consultar elector.' });
  } finally {
    client.release();
  }
});

export default router;
