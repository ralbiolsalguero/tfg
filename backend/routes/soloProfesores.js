const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const allowRoles = require('../middlewares/roleMiddleware');

// Solo profesores pueden acceder
router.get('/solo-profesores', authMiddleware, allowRoles('profesor'), (req, res) => {
  res.json({ mensaje: 'Bienvenido, profesor autorizado', usuario: req.user });
});

module.exports = router;
