const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  verifyEmail
} = require('../controllers/authController');

const authMiddleware = require('../middlewares/authMiddleware');

// Rutas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify-email/:token', verifyEmail); // ✅ Ruta para verificación de email

// Ruta protegida (requiere token)
router.get('/perfil', authMiddleware, (req, res) => {
  res.json({
    mensaje: 'Ruta protegida accedida correctamente',
    usuario: req.user
  });
});

module.exports = router;
