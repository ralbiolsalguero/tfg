const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const allowRoles = require('../middlewares/roleMiddleware');
const pool = require('../db');

router.get('/mis', authMiddleware, allowRoles('alumno'), async (req, res) => {
  const alumnoId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT o.titulo, o.ubicacion, o.descripcion
       FROM inscripciones i
       JOIN ofertas o ON i.oferta_id = o.id
       WHERE i.alumno_id = $1`,
      [alumnoId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener las inscripciones' });
  }
});

module.exports = router;
