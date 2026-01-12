const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const badwords = require('./badwords.js');
const app = express();

// Configuración para permitir conexiones desde cualquier sitio
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// 💡 Función para generar un código temporal de 6 caracteres
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
    password: '', // por defecto XAMPP
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

        res.json({
            success: true,
            user: { id: data.id_user, correo: data.correo_cifrado, rol: rol, nombre: nombre }
        });
    });
});

// 2. REGISTRO
app.post('/api/registro', (req, res) => {
    const { correo, pass, rol, nombre } = req.body;
    db.query('INSERT INTO USUARIO (correo_cifrado, contrasena_cifrado) VALUES (?, ?)', [correo, pass], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: 'El correo ya existe' });

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

// 7. ENVIAR MENSAJE (con filtro de malas palabras)
app.post('/api/mensaje', (req, res) => {
    const { texto, id_autor, id_clase } = req.body;

    // Convertimos a minúsculas para comparar sin distinción
    const textoMinus = texto.toLowerCase();

    // Verificamos si contiene alguna palabra prohibida
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

// --- NUEVAS RUTAS PARA DASHBOARD / CLASS-ROOM ---

// 8. OBTENER INFO BÁSICA DE LA CLASE
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
    const sql = 'DELETE FROM CLASE WHERE id_clase = ?';
    db.query(sql, [id_clase], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, msg: 'Clase no encontrada' });
        res.json({ success: true, msg: `Clase ${id_clase} eliminada con éxito` });
    });
});

// 10. ACTUALIZAR CÓDIGO TEMPORAL
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
//Filtro palabras

// --- INICIAR SERVIDOR ---
app.listen(3000, '0.0.0.0', () => {
    console.log('🚀 API corriendo en puerto 3000');
});

// Endpoint para validar código de acceso
app.post('/api/validar-codigo', (req, res) => {
    const { id_clase, codigo_temp } = req.body;

    if (!id_clase || !codigo_temp) {
        return res.status(400).json({ valido: false, error: 'Datos incompletos' });
    }

    const query = `
    SELECT codigo_temp, codigo_temp_expira 
    FROM clases 
    WHERE id_clase = ? 
    AND codigo_temp = ?
    AND codigo_temp_expira > NOW()
  `;

    db.query(query, [id_clase, codigo_temp], (err, results) => {
        if (err) {
            console.error('Error al validar código:', err);
            return res.status(500).json({ valido: false, error: 'Error del servidor' });
        }

        if (results.length > 0) {
            res.json({ valido: true });
        } else {
            res.json({ valido: false, error: 'Código incorrecto o expirado' });
        }
    });
});

