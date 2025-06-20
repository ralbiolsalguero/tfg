const pool = require('../db');

const crearOferta = async (req, res) => {
  const { titulo, descripcion, requisitos, vacantes, ubicacion, ciclo_destino } = req.body;
  const empresa_id = req.user.id;

  try {
    const nueva = await pool.query(
      `INSERT INTO ofertas 
       (empresa_id, titulo, descripcion, requisitos, vacantes, ubicacion, ciclo_destino) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [empresa_id, titulo, descripcion, requisitos, vacantes, ubicacion, ciclo_destino]
    );

    res.status(201).json({ mensaje: 'Oferta publicada correctamente', oferta: nueva.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { crearOferta };
