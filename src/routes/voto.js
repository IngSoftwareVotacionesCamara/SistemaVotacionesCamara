import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.post('/votar', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      id_elector,   // votante
      codigo_dane,
      cod_cir,
      cod_partido,  // null si blanco
      num_lista,    // opcional (si lista abierta)
      id_candidato, // id_elector del candidato
      voto_blanco
    } = req.body || {};

    if (!id_elector || !codigo_dane || !cod_cir) {
      return res.status(400).json({ message: "Faltan campos obligatorios: id_elector, codigo_dane, cod_cir." });
    }
    if (!voto_blanco && !cod_partido) {
      return res.status(400).json({ message: "Si no es voto en blanco, debe indicar cod_partido." });
    }
    if (voto_blanco && (cod_partido || num_lista != null || id_candidato != null)) {
      return res.status(400).json({ message: "Voto en blanco no debe incluir partido ni candidato." });
    }

    await client.query('BEGIN');

    // 1) Estado del elector (bloquea fila)
    const qElector = await client.query(
      `SELECT estado FROM votaciones.electores WHERE id_elector = $1 FOR UPDATE`,
      [id_elector]
    );
    if (qElector.rowCount === 0) throw { status: 404, message: "Elector no existe." };
    if (qElector.rows[0].estado === 'EFECTUADO') throw { status: 409, message: "El elector ya registró su voto." };
    if (qElector.rows[0].estado === 'BLOQUEADO') throw { status: 423, message: "El elector está temporalmente bloqueado." };

    // 2) Validar adscripción (si no es blanco)
    if (!voto_blanco) {
      const qAds = await client.query(
        `SELECT 1
           FROM votaciones.adscribe
          WHERE codigo_dane = $1 AND cod_cir = $2 AND cod_partido = $3
          LIMIT 1`,
        [codigo_dane, cod_cir, cod_partido]
      );
      if (qAds.rowCount === 0) throw { status: 400, message: "El partido no está adscrito a este departamento/circunscripción." };
    }

    // 3) Si viene candidato, validarlo (si tienes tabla candidatos)
    const hayCandidato = !voto_blanco && id_candidato != null;
    if (hayCandidato) {
      const qCand = await client.query(
        `SELECT 1
           FROM votaciones.candidatos
          WHERE id_elector = $1
            AND cod_partido = $2
            AND codigo_dane = $3
            AND cod_cir = $4
            ${num_lista != null ? 'AND num_lista = $5' : ''}
          LIMIT 1`,
        num_lista != null
          ? [id_candidato, cod_partido, codigo_dane, cod_cir, num_lista]
          : [id_candidato, cod_partido, codigo_dane, cod_cir]
      );
      if (qCand.rowCount === 0) throw { status: 400, message: "El candidato no es válido para ese partido/circunscripción." };
    }

    // 4) Insertar en vota (deja que cod_vota sea autoincremental/serial/identity)
    const qVota = await client.query(
      `INSERT INTO votaciones.vota (cod_partido, codigo_dane, cod_cir)
       VALUES ($1, $2, $3)
       RETURNING cod_vota`,
      [voto_blanco ? null : cod_partido, codigo_dane, cod_cir]
    );

    // 5) Si hubo candidato, insertar en elige
    if (hayCandidato) {
      await client.query(
        `INSERT INTO votaciones.elige (id_elector) VALUES ($1)`,
        [id_candidato]
      );
    }

    // 6) Marcar elector como EFECTUADO
    await client.query(
      `UPDATE votaciones.electores
          SET estado = 'EFECTUADO'
        WHERE id_elector = $1`,
      [id_elector]
    );

    await client.query('COMMIT');
    return res.status(200).json({ ok: true, cod_vota: qVota.rows[0].cod_vota });
  } catch (err) {
    await client.query('ROLLBACK');
    const status = err?.status || 500;
    const message = err?.message || 'Error interno al registrar el voto.';
    return res.status(status).json({ message });
  } finally {
    client.release();
  }
});

export default router;
