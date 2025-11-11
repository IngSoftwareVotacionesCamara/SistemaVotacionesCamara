// src/routes/voto.js
import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

/**
 * POST /api/votar
 * Body:
 * {
 *   id_elector,          // (obligatorio) elector que VOTA
 *   codigo_dane,         // (obligatorio) depto del votante (y del partido adscrito)
 *   cod_cir,             // (obligatorio) circunscripción donde VOTA
 *   cod_partido,         // null si voto en blanco
 *   num_lista,           // nº tarjetón si lista abierta (opcional)
 *   id_candidato,        // id_elector del candidato si lista abierta (opcional)
 *   voto_blanco          // boolean
 * }
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
      voto_blanco,
    } = req.body ?? {};

    // -------- Validaciones de entrada --------
    if (!id_elector || !codigo_dane || !cod_cir) {
      return res
        .status(400)
        .json({ message: 'Faltan campos obligatorios: id_elector, codigo_dane, cod_cir.' });
    }
    if (voto_blanco === true) {
      // blanco NO debe traer partido/candidato
      if (cod_partido != null || num_lista != null || id_candidato != null) {
        return res
          .status(400)
          .json({ message: 'Voto en blanco no debe incluir partido ni candidato.' });
      }
    } else {
      // no es blanco => requiere partido
      if (cod_partido == null) {
        return res
          .status(400)
          .json({ message: 'Si no es voto en blanco, debe indicar cod_partido.' });
      }
    }

    await client.query('BEGIN');

    // 1) Lock del elector y validación de estado
    const qElector = await client.query(
      `SELECT estado
         FROM votaciones.electores
        WHERE id_elector = $1
        FOR UPDATE`,
      [id_elector]
    );

    if (qElector.rowCount === 0) {
      throw { status: 404, message: 'Elector no encontrado.' };
    }

    const estado = qElector.rows[0].estado;
    if (estado === 'EFECTUADO') {
      throw { status: 409, message: 'El elector ya registró su voto.' };
    }
    if (estado === 'BLOQUEADO') {
      throw { status: 423, message: 'Elector bloqueado temporalmente. Intente más tarde.' };
    }
    // Opcional: si quieres exigir explícitamente DISPONIBLE
    if (estado !== 'DISPONIBLE') {
      throw { status: 400, message: `Estado del elector inválido: ${estado}.` };
    }

    // 2) Validar adscripción del partido (solo si NO es blanco)
    if (voto_blanco !== true) {
      const qAds = await client.query(
        `SELECT 1
           FROM votaciones.adscribe
          WHERE codigo_dane = $1
            AND cod_cir     = $2
            AND cod_partido = $3
          LIMIT 1`,
        [codigo_dane, cod_cir, cod_partido]
      );
      if (qAds.rowCount === 0) {
        throw {
          status: 400,
          message: 'El partido no está adscrito a este departamento/circunscripción.',
        };
      }
    }

    // 3) Validar candidato si vino num_lista + id_candidato (lista abierta)
    if (voto_blanco !== true && num_lista != null && id_candidato != null) {
      const qCand = await client.query(
        `SELECT 1
           FROM votaciones.candidatos
          WHERE id_elector = $1
            AND cod_partido = $2
            AND codigo_dane = $3
            AND cod_cir     = $4
            AND num_lista   = $5
          LIMIT 1`,
        [id_candidato, cod_partido, codigo_dane, cod_cir, num_lista]
      );
      if (qCand.rowCount === 0) {
        throw {
          status: 400,
          message: 'El candidato no corresponde al partido/circunscripción o no existe.',
        };
      }
    }

    // 4) Inserta SIEMPRE en votaciones.vota (si blanco, cod_partido = NULL)
    const qVota = await client.query(
      `INSERT INTO votaciones.vota (cod_partido, codigo_dane, cod_cir)
       VALUES ($1, $2, $3)
       RETURNING cod_vota`,
      [voto_blanco ? null : cod_partido, codigo_dane, cod_cir]
    );
    const cod_vota = qVota.rows[0].cod_vota;

    // 5) Si es lista abierta con candidato, inserta en votaciones.elige
    if (voto_blanco !== true && num_lista != null && id_candidato != null) {
      await client.query(
        `INSERT INTO votaciones.elige (id_elector) VALUES ($1)`,
        [id_candidato]
      );
    }

    // 6) Cambia estado del elector a EFECTUADO
    await client.query(
      `UPDATE votaciones.electores
          SET estado = 'EFECTUADO'
        WHERE id_elector = $1`,
      [id_elector]
    );

    await client.query('COMMIT');
    return res.status(200).json({
      ok: true,
      cod_vota,
      message: 'Voto registrado correctamente.',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error /api/votar:', err);
    const status = err?.status || 500;
    const message = err?.message || 'Error interno al registrar el voto.';
    return res.status(status).json({ message });
  } finally {
    client.release();
  }
});

export default router;
