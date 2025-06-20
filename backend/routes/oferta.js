const express = require('express');
const router = express.Router();
const { crearOferta } = require('../controllers/ofertaController');
const authMiddleware = require('../middlewares/authMiddleware');
const allowRoles = require('../middlewares/roleMiddleware');
const pool = require('../db');

// Ruta: empresas publican ofertas
router.post('/crear', authMiddleware, allowRoles('empresa'), crearOferta);

// Ruta: alumnos ven ofertas por ciclo
router.get('/', authMiddleware, allowRoles('alumno'), async (req, res) => {
  const ciclo = req.query.ciclo;
  try {
    const result = await pool.query(
      'SELECT * FROM ofertas WHERE ciclo_destino = $1',
      [ciclo]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta: empresas ven sus ofertas
router.get('/mis-ofertas', authMiddleware, allowRoles('empresa'), async (req, res) => {
  const empresaId = req.user.id;
  try {
    const result = await pool.query(
      'SELECT * FROM ofertas WHERE empresa_id = $1',
      [empresaId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta: alumnos se inscriben a una oferta
router.post('/:id/inscribirse', authMiddleware, allowRoles('alumno'), async (req, res) => {
  const alumnoId = req.user.id;
  const ofertaId = req.params.id;

  try {
    await pool.query(
      'INSERT INTO inscripciones (alumno_id, oferta_id) VALUES ($1, $2)',
      [alumnoId, ofertaId]
    );
    res.json({ mensaje: 'Inscripción realizada correctamente' });
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'Ya estás inscrito en esta oferta' });
    } else {
      res.status(500).json({ error: 'Error al inscribirse' });
    }
  }
});

module.exports = router;
