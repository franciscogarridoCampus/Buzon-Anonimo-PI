const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const badwords = require('./badwords.js');
const crypto = require('crypto'); // Para HMAC-SHA256
const app = express();

// --- CONFIGURACIÓN ---
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// --- CLAVE SECRETA PARA JWT ---
const SECRET_KEY = "mi_clave_secreta"; 

// --- FUNCIONES PARA JWT ---
function base64UrlEncode(data) {
    return Buffer.from(JSON.stringify(data))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function generarJWT(payload) {
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
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 6; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
}

// --- CONEXIÓN A BASE DE DATOS ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'buzon_anonimo'
});

db.connect(err => {
    if (err) {
        console.error('❌ Error conectando a MySQL:', err);
        return;
    }
    console.log('✅ Base de datos conectada correctamente.');
});

// ================= RUTAS =================

// 1. LOGIN
app.post('/api/login', (req, res) => {
    const { correo, pass } = req.body;
    const sql = `
        SELECT u.id_user, u.correo_cifrado, 
               a.id_user AS es_alumno, 
               p.id_user AS es_profe, p.nombre AS nombre_profe,
               m.id_user AS es_mod, m.nombre AS nombre_mod
        FROM USUARIO u
        LEFT JOIN ALUMNO a ON u.id_user = a.id_user
        LEFT JOIN PROFESOR p ON u.id_user = p.id_user
        LEFT JOIN MODERADOR m ON u.id_user = m.id_user
        WHERE u.correo_cifrado = ? AND u.contrasena_cifrado = ?
    `;
    db.query(sql, [correo, pass], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ success: false, msg: 'Credenciales inválidas' });

        const data = results[0];
        let rol = 'desconocido';
        let nombre = 'Anónimo';

        if (data.es_alumno) rol = 'alumno';
        else if (data.es_profe) { rol = 'profesor'; nombre = data.nombre_profe; }
        else if (data.es_mod) { rol = 'moderador'; nombre = data.nombre_mod; }

        const token = generarJWT({
            sub: data.id_user,
            nombre: nombre,
            rol: rol,
            exp: Math.floor(Date.now() / 1000) + 3600 
        });

        res.json({
            success: true,
            user: { id: data.id_user, correo: data.correo_cifrado, rol: rol, nombre: nombre },
            token: token
        });
    });
});

// 2. REGISTRO (CON COMPROBACIÓN DE DUPLICADOS)
app.post('/api/registro', (req, res) => {
    const { correo, pass, rol, nombre } = req.body;
    db.query('INSERT INTO USUARIO (correo_cifrado, contrasena_cifrado) VALUES (?, ?)', [correo, pass], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, msg: 'Este correo ya está registrado' });
            }
            return res.status(500).json({ success: false, error: err.message });
        }

        const newId = result.insertId;
        let sqlHijo = '';
        let paramsHijo = [];

        if (rol === 'alumno') {
            sqlHijo = 'INSERT INTO ALUMNO (id_user) VALUES (?)';
            paramsHijo = [newId];
        } else if (rol === 'profesor') {
            sqlHijo = 'INSERT INTO PROFESOR (id_user, nombre) VALUES (?, ?)';
            paramsHijo = [newId, nombre];
        } else if (rol === 'moderador') {
            sqlHijo = 'INSERT INTO MODERADOR (id_user, nombre) VALUES (?, ?)';
            paramsHijo = [newId, nombre];
        }

        db.query(sqlHijo, paramsHijo, (errHijo) => {
            if (errHijo) return res.status(500).json({ error: errHijo.message });
            res.json({ success: true, id: newId });
        });
    });
});

// 3. OBTENER CLASES
app.get('/api/clases/:id/:rol', (req, res) => {
    const { id, rol } = req.params;
    let sql = '';
    if (rol === 'moderador') sql = 'SELECT * FROM CLASE WHERE id_creador = ?';
    else sql = 'SELECT c.* FROM CLASE c JOIN ACCEDE a ON c.id_clase = a.id_clase WHERE a.id_user = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 4. CREAR CLASE
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

// 5. UNIRSE A CLASE
app.post('/api/unirse-clase', (req, res) => {
    const { id_user, codigo } = req.body;
    db.query('SELECT id_clase FROM CLASE WHERE codigo_temp = ?', [codigo], (err, results) => {
        if (results.length === 0) return res.json({ success: false, msg: 'Código incorrecto' });
        const id_clase = results[0].id_clase;
        db.query('INSERT INTO ACCEDE (id_user, id_clase) VALUES (?, ?)', [id_user, id_clase], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.json({ success: false, msg: 'Ya estás unido a esta clase' });
                return res.status(500).json({ success: false, error: err.message });
            }
            res.json({ success: true });
        });
    });
});

// 6. OBTENER MENSAJES
app.get('/api/mensajes/:idClase', (req, res) => {
    const { idClase } = req.params;
    const sql = 'SELECT * FROM MENSAJE WHERE id_clase = ? ORDER BY id_mensaje DESC';
    db.query(sql, [idClase], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 7. ENVIAR MENSAJE
app.post('/api/mensaje', (req, res) => {
    const { texto, id_autor, id_clase } = req.body;
    const textoMinus = texto.toLowerCase();
    const contieneMala = badwords.some(palabra => textoMinus.includes(palabra.toLowerCase()));

    if (contieneMala) {
        return res.status(400).json({ success: false, msg: 'El mensaje contiene palabras no permitidas' });
    }

    const fecha = new Date().toISOString().slice(0, 10);
    const hora = new Date().toLocaleTimeString('es-ES', { hour12: false });
    const sql = 'INSERT INTO MENSAJE (texto, fecha, hora_minuto, id_autor, id_clase) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [texto, fecha, hora, id_autor, id_clase], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// 8. INFO BÁSICA CLASE
app.get('/api/clase/:idClase', (req, res) => {
    const { idClase } = req.params;
    const sql = 'SELECT id_clase, nombre, codigo_temp FROM CLASE WHERE id_clase = ?';
    db.query(sql, [idClase], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ msg: 'Clase no encontrada' });
        res.json(results[0]);
    });
});

// 9. DELETE CLASE
app.delete('/api/clase/:id_clase', (req, res) => {
    const { id_clase } = req.params;
    const sqlMensajes = 'DELETE FROM MENSAJE WHERE id_clase = ?';
    db.query(sqlMensajes, [id_clase], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        const sqlClase = 'DELETE FROM CLASE WHERE id_clase = ?';
        db.query(sqlClase, [id_clase], (err2, result) => {
            if (err2) return res.status(500).json({ success: false, error: err2.message });
            if (result.affectedRows === 0) return res.status(404).json({ success: false, msg: 'Clase no encontrada' });
            res.json({ success: true, msg: `Clase ${id_clase} y sus mensajes eliminados` });
        });
    });
});

// 10. ACTUALIZAR CÓDIGO
app.put('/api/clase/codigo/:id_clase', (req, res) => {
    const { id_clase } = req.params;
    const nuevoCodigo = generarCodigoAleatorio();
    const sql = 'UPDATE CLASE SET codigo_temp = ? WHERE id_clase = ?';
    db.query(sql, [nuevoCodigo, id_clase], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, msg: 'Clase no encontrada' });
        res.json({ success: true, codigo_temp: nuevoCodigo });
    });
});

// 11. ELIMINAR MENSAJE
app.delete('/api/mensaje/:id_mensaje', (req, res) => {
    const { id_mensaje } = req.params;
    const sql = 'DELETE FROM MENSAJE WHERE id_mensaje = ?';
    db.query(sql, [id_mensaje], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, msg: 'Mensaje no encontrado' });
        res.json({ success: true, msg: `Mensaje ${id_mensaje} eliminado` });
    });
});

// 12. OBTENER USUARIOS DE UNA CLASE (Pestaña Personas)
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

// 13. EXPULSAR USUARIO DE CLASE
app.delete('/api/clase/:id_clase/usuario/:id_user', (req, res) => {
    const { id_clase, id_user } = req.params;
    const sql = 'DELETE FROM ACCEDE WHERE id_user = ? AND id_clase = ?';
    db.query(sql, [id_user, id_clase], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, msg: 'Usuario expulsado' });
    });
});

// 14. CAMBIAR CONTRASEÑA
app.put('/api/usuario/password', (req, res) => {
    const { id_user, nuevaPass } = req.body;
    if (!id_user || !nuevaPass) return res.status(400).json({ success: false, msg: 'Datos incompletos' });

    const sql = 'UPDATE USUARIO SET contrasena_cifrado = ? WHERE id_user = ?';
    db.query(sql, [nuevaPass, id_user], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, msg: 'Contraseña actualizada correctamente' });
    });
});

// --- INICIAR SERVIDOR ---
app.listen(3000, '0.0.0.0', () => {
    console.log(' API corriendo en puerto 3000');
});