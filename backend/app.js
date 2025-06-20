const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API funcionando correctamente');
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor escuchando en puerto ${process.env.PORT}`);
});

const pool = require('./db');

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ conectado: true, hora: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ conectado: false, error: error.message });
  }
});

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const ofertaRoutes = require('./routes/oferta');
app.use('/api/ofertas', ofertaRoutes);

const soloProfesoresRoutes = require('./routes/soloProfesores');
app.use('/api/test', soloProfesoresRoutes);

const inscripcionesRoutes = require('./routes/inscripciones');
app.use('/api/inscripciones', inscripcionesRoutes);

const profesorRoutes = require('./routes/profesor');
app.use('/api/profesor', profesorRoutes);

const usuariosRoutes = require('./routes/usuarios');
app.use('/api/usuarios', usuariosRoutes);
