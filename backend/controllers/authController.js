const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');


// REGISTRO
const registerUser = async (req, res) => {
  const {
    nombre,
    apellidos,
    email,
    password,
    rol,
    datosAlumno,
    datosEmpresa,
    datosProfesor
  } = req.body;

  try {
    const existingUser = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await pool.query(
      'INSERT INTO usuarios (nombre, apellidos, email, password, rol, verificado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nombre, apellidos || null, email, hashedPassword, rol, false]
    );

    const userId = nuevoUsuario.rows[0].id;

    // Datos adicionales
    if (rol === 'alumno' && datosAlumno) {
      const { nif, telefono } = datosAlumno;
      await pool.query(
        'INSERT INTO datos_alumno (usuario_id, nif, telefono) VALUES ($1, $2, $3)',
        [userId, nif, telefono]
      );
    }

    if (rol === 'empresa' && datosEmpresa) {
      const {
        cif, razonSocial, localizacion, actividad,
        tipoSociedad, nombreContacto, emailContacto
      } = datosEmpresa;

      await pool.query(
        `INSERT INTO datos_empresa 
         (usuario_id, cif, razon_social, localizacion, actividad, tipo_sociedad, nombre_contacto, email_contacto)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, cif, razonSocial, localizacion, actividad, tipoSociedad, nombreContacto, emailContacto]
      );
    }

    if (rol === 'profesor' && datosProfesor) {
      const { dni, ciclo, centro } = datosProfesor;
      await pool.query(
        'INSERT INTO datos_profesor (usuario_id, dni, ciclo, centro) VALUES ($1, $2, $3, $4)',
        [userId, dni, ciclo, centro]
      );
    }

    // Token de verificación
    const verifyToken = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const link = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verifyToken}`;

    await sendEmail({
      to: email,
      subject: 'Confirma tu cuenta en Ogma',
      html: `
        <h2>Hola, ${nombre}</h2>
        <p>Gracias por registrarte en <strong>Ogma</strong>.</p>
        <p>Haz clic en este enlace para verificar tu cuenta:</p>
        <a href="${link}">${link}</a>
        <br><br>
        <small>Este enlace caduca en 24 horas.</small>
      `
    });

    res.status(201).json({
      mensaje: 'Usuario registrado. Revisa tu email para verificar tu cuenta.'
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// VERIFICAR EMAIL
const verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Actualizar estado de verificación
    await pool.query('UPDATE usuarios SET verificado = true WHERE id = $1', [userId]);

    // Obtener datos del usuario para enviarle el email
    const userResult = await pool.query('SELECT nombre, email FROM usuarios WHERE id = $1', [userId]);
    const { nombre, email } = userResult.rows[0];

    // Enviar correo de bienvenida
    await sendEmail({
      to: email,
      subject: '🎉 Bienvenido a Ogma',
      html: `
        <h2>Hola, ${nombre} 👋</h2>
        <p>Tu cuenta ha sido verificada correctamente.</p>
        <p>Ahora puedes iniciar sesión y comenzar a disfrutar de Ogma.</p>
        <a href="http://localhost:3001/login">Iniciar sesión</a>
        <br><br>
        <small>Este es un mensaje automático, no respondas a este correo.</small>
      `
    });

    // Mostrar pantalla de éxito
    res.send(`
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f8;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .card {
              background: white;
              padding: 2rem;
              border-radius: 10px;
              box-shadow: 0 5px 15px rgba(0,0,0,0.1);
              text-align: center;
            }
            .card a {
              margin-top: 1rem;
              display: inline-block;
              background: #4f46e5;
              color: white;
              padding: 0.6rem 1.2rem;
              border-radius: 5px;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>¡Cuenta verificada!</h2>
            <p>Te hemos enviado un correo de bienvenida.</p>
            <a href="http://localhost:3001/login">Iniciar sesión</a>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Error al verificar correo:', error);
    res.status(400).send('Token inválido o expirado');
  }
};


// LOGIN
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    if (!user.verificado) {
      return res.status(401).json({ error: 'Debes verificar tu correo antes de iniciar sesión.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail
};
