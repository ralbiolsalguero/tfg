const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const pool = require('../db');
const bcrypt = require('bcryptjs');

// ✅ Actualizar nombre, email y ciclo
router.put('/me', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { nombre, email, ciclo } = req.body;

  try {
    await pool.query(
      'UPDATE usuarios SET nombre = $1, email = $2, ciclo = $3 WHERE id = $4',
      [nombre, email, ciclo, userId]
    );
    res.json({ mensaje: 'Perfil actualizado' });
  } catch (err) {
    console.error('Error actualizando perfil:', err);
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
});

// ✅ Cambiar contraseña
router.put('/password', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { actual, nueva } = req.body;

  try {
    const result = await pool.query('SELECT password FROM usuarios WHERE id = $1', [userId]);
    const usuario = result.rows[0];

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const match = await bcrypt.compare(actual, usuario.password);
    if (!match) return res.status(400).json({ error: 'Contraseña actual incorrecta' });

    const nuevaHash = await bcrypt.hash(nueva, 10);
    await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [nuevaHash, userId]);

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error cambiando contraseña:', err);
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
});

module.exports = router;
