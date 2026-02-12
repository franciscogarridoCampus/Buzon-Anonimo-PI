const { findUserByCredentials, insertUser, insertAlumno, insertProfesor, insertModerador, updatePassword } = require('../models/userModel');

async function login(db, correo, pass) {
    // Intento normal (soporta bcrypt y migración on-login)
    let user = await findUserByCredentials(db, correo, pass);
    if (user) return user;

    // Intento de respaldo: buscar usuario con correo y contraseña en texto plano
    // Esto cubre posibles usuarios antiguos que no fueron migrados correctamente
    const sql = `SELECT u.id_user, u.correo_cifrado, u.contrasena_cifrado,
                        a.id_user AS es_alumno,
                        p.id_user AS es_profe, p.nombre AS nombre_profe,
                        m.id_user AS es_mod, m.nombre AS nombre_mod
                 FROM USUARIO u
                 LEFT JOIN ALUMNO a ON u.id_user = a.id_user
                 LEFT JOIN PROFESOR p ON u.id_user = p.id_user
                 LEFT JOIN MODERADOR m ON u.id_user = m.id_user
                 WHERE u.correo_cifrado = ? AND u.contrasena_cifrado = ?`;

    const [results] = await new Promise((resolve, reject) => {
        db.query(sql, [correo, pass], (err, res) => err ? reject(err) : resolve([res]));
    }).catch(() => [null]);

    const found = results && results[0];
    if (found) {
        // Re-hashear la contraseña para migrar al formato bcrypt
        try {
            const bcrypt = require('bcrypt');
            bcrypt.hash(pass, 10).then(hashed => {
                db.query('UPDATE USUARIO SET contrasena_cifrado = ? WHERE id_user = ?', [hashed, found.id_user], () => {});
            }).catch(() => {});
        } catch (e) {}
        return found;
    }

    return null;
}

async function registro(db, correo, pass, rol, nombre) {
    const newId = await insertUser(db, correo, pass);
    if (rol === 'alumno') await insertAlumno(db, newId);
    else if (rol === 'profesor') await insertProfesor(db, newId, nombre);
    else if (rol === 'moderador') await insertModerador(db, newId, nombre);
    return newId;
}

async function cambiarPassword(db, id_user, nuevaPass) {
    return await updatePassword(db, id_user, nuevaPass);
}

module.exports = { login, registro, cambiarPassword };
