function findUserByCredentials(db, correo, pass) {
    return new Promise((resolve, reject) => {
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
            if (err) return reject(err);
            resolve(results[0]);
        });
    });
}

function insertUser(db, correo, pass) {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO USUARIO (correo_cifrado, contrasena_cifrado) VALUES (?, ?)', [correo, pass], (err, result) => {
            if (err) return reject(err);
            resolve(result.insertId);
        });
    });
}

function insertAlumno(db, id_user) {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO ALUMNO (id_user) VALUES (?)', [id_user], (err) => err ? reject(err) : resolve());
    });
}

function insertProfesor(db, id_user, nombre) {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO PROFESOR (id_user, nombre) VALUES (?, ?)', [id_user, nombre], (err) => err ? reject(err) : resolve());
    });
}

function insertModerador(db, id_user, nombre) {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO MODERADOR (id_user, nombre) VALUES (?, ?)', [id_user, nombre], (err) => err ? reject(err) : resolve());
    });
}

function updatePassword(db, id_user, nuevaPass) {
    return new Promise((resolve, reject) => {
        db.query('UPDATE USUARIO SET contrasena_cifrado = ? WHERE id_user = ?', [nuevaPass, id_user], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

module.exports = { findUserByCredentials, insertUser, insertAlumno, insertProfesor, insertModerador, updatePassword };
