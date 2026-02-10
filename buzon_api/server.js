const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// ========================
// CONFIGURACIÓN DEL SERVIDOR
// ========================
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// Montar routers MVC
const authRouter = require('./routes/authRoutes');
const claseRouter = require('./routes/claseRoutes');
const mensajeRouter = require('./routes/mensajeRoutes');
app.use('/api', authRouter);
app.use('/api', claseRouter);
app.use('/api/mensaje', mensajeRouter);

// ========================
// CONEXIÓN A LA BASE DE DATOS
// ========================
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

// ========================
// INICIAR SERVIDOR
// ========================
app.listen(3000, '0.0.0.0', () => {
    console.log('API corriendo en puerto 3000');
});
