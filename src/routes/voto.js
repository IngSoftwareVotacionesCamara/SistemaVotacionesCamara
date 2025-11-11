// src/routes/voto.js
import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

/**
 * POST /api/votar
 * body:
 *  - id_elector (obligatorio)  -> elector que vota
 *  - codigo_dane (obligatorio) -> depto del elector / adscripción
 *  - cod_cir (obligatorio)     -> circunscripción donde vota
 *  - cod_partido (nullable si voto_blanco = true)
 *  - num_lista (solo si lista abierta y eligió candidato)
 *  - id_candidato (id_elector del candidato si eligió candidato)
 *  - voto_blanco (boolean)
 */
router.post('/votar', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      id_elector,
      codigo_dane,
      cod_cir,
      cod_partido,
      num_lista,
      id_candidato,
      voto_blanco
    } = req.body || {};

    // -------- Validaciones de entrada --------
    if (!id_elector || !codigo_dane || !cod_cir) {
      return res.status(400).json({ message: 'Faltan campos obligatorios: id_elector, codigo_dane, cod_cir.' });
    }
    if (!voto_blanco && !cod_partido) {
      return res.status(400).json({ message: 'Si no es voto en blanco, debe indicar cod_partido.' });
    }
    if (voto_blanco && (cod_partido || num_lista != null || id_candidato != null)) {
      return res.status(400).json({ message: 'Voto en blanco no debe incluir partido ni candidato.' });
    }

    await client.query('BEGIN');

    // 1) Bloquear fila del elector y validar estado
    const qElect = await client.query(
      `SELECT estado FROM votaciones.electores WHERE id_elector = $1 FOR UPDATE`,
      [id_elector]
    );
    if (qElect.rowCount === 0) {
      throw { status: 404, message: 'Elector no encontrado.' };
    }
    const estado = qElect.rows[0].estado;
    if (estado === 'EFECTUADO') {
      throw { status: 409, message: 'El elector ya registró su voto.' };
    }
    if (estado === 'BLOQUEADO') {
      throw { status: 423, message: 'El elector está bloqueado temporalmente.' };
    }

    // 2) Si no es blanco, validar adscripción del partido a depto+circ
    if (!voto_blanco) {
      const qAds = await client.query(
        `SELECT 1
           FROM votaciones.adscribe
          WHERE codigo_dane = $1 AND cod_cir = $2 AND cod_partido = $3
          LIMIT 1`,
        [codigo_dane, cod_cir, cod_partido]
      );
      if (qAds.rowCount === 0) {
        throw { status: 400, message: 'El partido no está adscrito a este departamento/circunscripción.' };
      }
    }

    // 3) Si escogió candidato (lista abierta), validar que exista y corresponda
    if (!voto_blanco && num_lista != null && id_candidato != null) {
      const qCand = await client.query(
        `SELECT 1
           FROM votaciones.candidatos
          WHERE id_elector = $1
            AND cod_partido = $2
            AND codigo_dane = $3
            AND cod_cir = $4
            AND num_lista = $5
          LIMIT 1`,
        [id_candidato, cod_partido, codigo_dane, cod_cir, num_lista]
      );
      if (qCand.rowCount === 0) {
        throw { status: 400, message: 'El candidato no es válido para ese partido/circunscripción.' };
      }
    }

    // 4) Insertar voto (cod_vota es SERIAL/IDENTITY con DEFAULT; NO lo incluimos)
    const qVota = await client.query(
      `INSERT INTO votaciones.vota (cod_partido, codigo_dane, cod_cir)
       VALUES ($1, $2, $3)
       RETURNING cod_vota`,
      [voto_blanco ? null : cod_partido, codigo_dane, cod_cir]
    );
    if (qVota.rowCount === 0) {
      throw { status: 500, message: 'No se pudo insertar el voto.' };
    }
    const cod_vota = qVota.rows[0].cod_vota;

    // 5) Si hubo candidato, insertar en ELIGE
    if (!voto_blanco && num_lista != null && id_candidato != null) {
      const qElige = await client.query(
        `INSERT INTO votaciones.elige (id_elector) VALUES ($1)`,
        [id_candidato]
      );
      if (qElige.rowCount === 0) {
        throw { status: 500, message: 'No se pudo registrar el voto al candidato.' };
      }
    }

    // 6) Marcar elector como EFECTUADO
    const qUpd = await client.query(
      `UPDATE votaciones.electores
          SET estado = 'EFECTUADO'
        WHERE id_elector = $1`,
      [id_elector]
    );
    if (qUpd.rowCount === 0) {
      throw { status: 500, message: 'No se pudo actualizar el estado del elector.' };
    }

    await client.query('COMMIT');
    return res.status(200).json({ ok: true, cod_vota });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/votar error:', err);
    const status = err?.status || 500;
    const message = err?.message || 'Error interno al registrar el voto.';
    return res.status(status).json({ message });
  } finally {
    client.release();
  }
});

export default router;
