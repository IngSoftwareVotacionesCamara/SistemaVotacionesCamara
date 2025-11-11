// src/routes/electores.js
import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

/**
 * POST /api/electores/:id/bloquear
 * - Bloquea por 15 min si está DISPONIBLE.
 * - Si ya está BLOQUEADO y venció -> lo pasa a DISPONIBLE (limpia bloqueado_hasta).
 * - Si ya está BLOQUEADO y NO ha vencido -> no toca nada (no extiende).
 * - Si está EFECTUADO -> no permite bloquear.
 */
router.post('/electores/:id/bloquear', async (req, res) => {
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
      return res.status(404).json({ message: 'Elector no encontrado.' });
    }

    let { estado, bloqueado_hasta } = q.rows[0];
    const now = new Date();

    // Auto-desbloqueo si estaba bloqueado y ya venció
    if (estado === 'BLOQUEADO' && bloqueado_hasta && new Date(bloqueado_hasta) <= now) {
      await client.query(
        `UPDATE votaciones.electores
            SET estado = 'DISPONIBLE', bloqueado_hasta = NULL
          WHERE id_elector = $1`,
        [id]
      );
      await client.query('COMMIT');
      return res.status(200).json({
        ok: true,
        action: 'unblocked',
        estado: 'DISPONIBLE',
        bloqueado_hasta: null
      });
    }

    if (estado === 'EFECTUADO') {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'El elector ya registró su voto.' });
    }

    if (estado === 'BLOQUEADO') {
      // Sigue bloqueado y aún no vence: no extender ni modificar
      await client.query('COMMIT');
      return res.status(200).json({
        ok: true,
        action: 'already_blocked',
        estado: 'BLOQUEADO',
        bloqueado_hasta
      });
    }

    // Si está DISPONIBLE -> bloquear por 15 min
    const q2 = await client.query(
      `UPDATE votaciones.electores
          SET estado = 'BLOQUEADO',
              bloqueado_hasta = (NOW() + INTERVAL '15 minutes')
        WHERE id_elector = $1
        RETURNING bloqueado_hasta`,
      [id]
    );

    await client.query('COMMIT');
    return res.status(200).json({
      ok: true,
      action: 'blocked',
      estado: 'BLOQUEADO',
      bloqueado_hasta: q2.rows[0].bloqueado_hasta
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('POST /electores/:id/bloquear error:', e);
    return res.status(500).json({ message: 'Error al bloquear elector.' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/electores/:id/status
 * - Devuelve {estado, bloqueado_hasta}
 * - Si estaba BLOQUEADO y venció -> lo pasa a DISPONIBLE (limpia bloqueado_hasta)
 */
router.get('/electores/:id/status', async (req, res) => {
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
      return res.status(404).json({ message: 'Elector no encontrado.' });
    }

    let { estado, bloqueado_hasta } = q.rows[0];
    const now = new Date();

    // Auto-desbloqueo si ya venció
    if (estado === 'BLOQUEADO' && bloqueado_hasta && new Date(bloqueado_hasta) <= now) {
      const upd = await client.query(
        `UPDATE votaciones.electores
            SET estado = 'DISPONIBLE', bloqueado_hasta = NULL
          WHERE id_elector = $1
          RETURNING estado, bloqueado_hasta`,
        [id]
      );
      await client.query('COMMIT');
      const r = upd.rows[0];
      return res.status(200).json({
        ok: true,
        estado: r.estado,
        bloqueado_hasta: r.bloqueado_hasta
      });
    }

    await client.query('COMMIT');
    return res.status(200).json({
      ok: true,
      estado,
      bloqueado_hasta
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('GET /electores/:id/status error:', e);
    return res.status(500).json({ message: 'Error al consultar estado de elector.' });
  } finally {
    client.release();
  }
});

export default router;
