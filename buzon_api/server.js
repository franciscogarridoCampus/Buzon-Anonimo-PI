const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const badwords = require('./badwords.js');
const crypto = require('crypto'); // Para HMAC-SHA256 en JWT
const { enviarMensaje } = require('./mensajeService.js');

const app = express();

// ------------------------
// CONFIGURACIÓN DEL SERVIDOR
// ------------------------
app.use(cors({ origin: '*' })); // Permite solicitudes desde cualquier origen
app.use(bodyParser.json());     // Permite recibir JSON en los cuerpos de las peticiones

// Montar routers MVC
const authRouter = require('./routes/authRoutes');
const claseRouter = require('./routes/claseRoutes');
const mensajeRouter = require('./routes/mensajeRoutes');
app.use('/api', authRouter);
app.use('/api', claseRouter);
app.use('/api/mensaje', mensajeRouter);

// ------------------------
// CLAVE SECRETA PARA JWT
// ------------------------
const SECRET_KEY = "mi_clave_secreta"; 

// ------------------------
// FUNCIONES PARA JWT
// ------------------------
function base64UrlEncode(data) {
    // Codifica un objeto JSON a Base64 seguro para URL
    return Buffer.from(JSON.stringify(data))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function generarJWT(payload) {
    // Genera un token JWT con HMAC-SHA256
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);
    const signature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function generarCodigoAleatorio() {
    // Genera un código alfanumérico de 6 caracteres
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 6; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
}

// ------------------------
// CONEXIÓN A LA BASE DE DATOS
// ------------------------
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'buzon_anonimo'
});

db.connect(err => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        return;
    }
    console.log('Base de datos conectada correctamente.');
});

// Exponer la conexión DB en la app para que controllers la usen
app.set('db', db);

// =========================
// RUTAS DEL SERVIDOR
// =========================

// Auth routes migrated to authRoutes (controllers/authController)

// Clase routes migrated to claseRoutes (controllers/claseController)

// 4. CREAR CLASE NUEVA
app.post('/api/crear-clase', (req, res) => {
    const { nombre, id_creador } = req.body;
    const codigoInicial = generarCodigoAleatorio();

    db.query('INSERT INTO CLASE (nombre, codigo_temp, id_creador) VALUES (?, ?, ?)', 
        [nombre, codigoInicial, id_creador], 
        (err) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, codigo: codigoInicial });
        }
    );
});

// 5. UNIRSE A UNA CLASE
app.post('/api/unirse-clase', (req, res) => {
    const { id_user, codigo } = req.body;

    db.query('SELECT id_clase FROM CLASE WHERE codigo_temp = ?', [codigo], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (results.length === 0) return res.status(400).json({ success: false, msg: 'El código no es válido o ha expirado' });

        const id_clase = results[0].id_clase;

        db.query('INSERT INTO ACCEDE (id_user, id_clase) VALUES (?, ?)', [id_user, id_clase], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ success: false, msg: 'Ya estás unido a esta clase' });
                }
                return res.status(500).json({ success: false, error: err.message });
            }

            res.json({ success: true });
        });
    });
});

// Mensajes listing moved to claseRoutes/mensajeRoutes

// Mensaje POST routed via /api/mensaje (routes/mensajeRoutes)

// 8. OBTENER INFORMACIÓN BÁSICA DE UNA CLASE
app.get('/api/clase/:idClase', (req, res) => {
    const { idClase } = req.params;
    const sql = 'SELECT id_clase, nombre, codigo_temp FROM CLASE WHERE id_clase = ?';

    db.query(sql, [idClase], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ msg: 'Clase no encontrada' });
        res.json(results[0]);
    });
});

// 9. ELIMINAR CLASE Y SUS MENSAJES
app.delete('/api/clase/:id_clase', (req, res) => {
    const { id_clase } = req.params;

    db.query('DELETE FROM MENSAJE WHERE id_clase = ?', [id_clase], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });

        db.query('DELETE FROM CLASE WHERE id_clase = ?', [id_clase], (err2, result) => {
            if (err2) return res.status(500).json({ success: false, error: err2.message });
            if (result.affectedRows === 0) return res.status(404).json({ success: false, msg: 'Clase no encontrada' });
            res.json({ success: true, msg: `Clase ${id_clase} y sus mensajes eliminados` });
        });
    });
});

// 10. ACTUALIZAR CÓDIGO DE CLASE (rotación cada 60 segundos)
app.put('/api/clase/codigo/:id_clase', (req, res) => {
    const { id_clase } = req.params;

    const rotarCodigo = (id) => {
        const nuevoCodigo = generarCodigoAleatorio();
        db.query('UPDATE CLASE SET codigo_temp = ? WHERE id_clase = ?', [nuevoCodigo, id], (err) => {
            if (err) console.error("Error rotando código:", err);
        });
    };

    const codigoActual = generarCodigoAleatorio();

    db.query('UPDATE CLASE SET codigo_temp = ? WHERE id_clase = ?', [codigoActual, id_clase], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });

        setTimeout(() => {
            rotarCodigo(id_clase);
        }, 60000); // 60 segundos

        res.json({ success: true, codigo_temp: codigoActual });
    });
});

// 11. ELIMINAR MENSAJE
app.delete('/api/mensaje/:id_mensaje', (req, res) => {
    const { id_mensaje } = req.params;
    const sql = 'DELETE FROM MENSAJE WHERE id_mensaje = ?';
    db.query(sql, [id_mensaje], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, msg: `Mensaje ${id_mensaje} no encontrado` });
        res.json({ success: true, msg: `Mensaje ${id_mensaje} eliminado` });
    });
});

// 12. OBTENER USUARIOS DE UNA CLASE
app.get('/api/clase-usuarios/:id_clase', (req, res) => {
    const { id_clase } = req.params;
    const sql = `
        SELECT u.id_user, u.correo_cifrado, 
               CASE 
                   WHEN p.id_user IS NOT NULL THEN 'profesor'
                   WHEN a.id_user IS NOT NULL THEN 'alumno'
                   ELSE 'desconocido'
               END as rol,
               COALESCE(p.nombre, 'Alumno') as nombre
        FROM ACCEDE ac
        JOIN USUARIO u ON ac.id_user = u.id_user
        LEFT JOIN PROFESOR p ON u.id_user = p.id_user
        LEFT JOIN ALUMNO a ON u.id_user = a.id_user
        WHERE ac.id_clase = ?
    `;
    db.query(sql, [id_clase], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 13. EXPULSAR USUARIO DE UNA CLASE
app.delete('/api/clase/:id_clase/usuario/:id_user', (req, res) => {
    const { id_clase, id_user } = req.params;
    const sql = 'DELETE FROM ACCEDE WHERE id_user = ? AND id_clase = ?';
    db.query(sql, [id_user, id_clase], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, msg: 'Usuario expulsado' });
    });
});

// 14. CAMBIAR CONTRASEÑA DE USUARIO
app.put('/api/usuario/password', (req, res) => {
    const { id_user, nuevaPass } = req.body;
    if (!id_user || !nuevaPass) return res.status(400).json({ success: false, msg: 'Datos incompletos' });

    const sql = 'UPDATE USUARIO SET contrasena_cifrado = ? WHERE id_user = ?';
    db.query(sql, [nuevaPass, id_user], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, msg: 'Contraseña actualizada correctamente' });
    });
});

// ------------------------
// INICIAR SERVIDOR
// ------------------------
app.listen(3000, '0.0.0.0', () => {
    console.log('API corriendo en puerto 3000');
});
