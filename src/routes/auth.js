import express from 'express';
import { pool } from '../db.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

/**
 * POST /api/login
 * body: { id_elector, password }
 */
router.post('/login', async (req, res) => {
  const { id_elector, password } = req.body;

  if (!id_elector || !password) {
    return res.status(400).json({ message: 'Faltan credenciales.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM votaciones.electores WHERE id_elector = $1',
      [id_elector]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: 'El elector no esta inscrito.' });

    const elector = result.rows[0];

    if (elector.estado === 'Votó')
      return res.status(403).json({ message: 'El elector ya votó.' });

    // Si las contraseñas en la BD están hasheadas con bcrypt:
    try {
      const valid = await bcrypt.compare(password, elector.password);
      if (!valid) return res.status(401).json({ message: 'Contraseña incorrecta.' });
    } catch (err) {
      // Si bcrypt falla (por ejemplo la contraseña en DB está en texto plano), usar comparación simple
      if (password !== elector.password) return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    res.json({
      message: 'Acceso permitido',
      elector: {
        id_elector: elector.id_elector,
        nombres: elector.nombres,
        codigo_dane: elector.codigo_dane,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

export default router;
