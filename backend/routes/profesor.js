const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const allowRoles = require('../middlewares/roleMiddleware');
const pool = require('../db');

// Ruta: ver alumnos inscritos en una oferta
router.get('/ofertas/:id/alumnos', authMiddleware, allowRoles('profesor'), async (req, res) => {
  const ofertaId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT u.nombre, u.email
       FROM inscripciones i
       JOIN usuarios u ON i.alumno_id = u.id
       WHERE i.oferta_id = $1`,
      [ofertaId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener alumnos inscritos' });
  }
});

module.exports = router;
