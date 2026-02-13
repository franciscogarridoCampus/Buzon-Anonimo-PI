async function findUserByCredentials(db, correo, pass) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT u.id_user, u.correo_cifrado, u.contrasena_cifrado,
                   a.id_user AS es_alumno,
                   p.id_user AS es_profe, p.nombre AS nombre_profe,
                   m.id_user AS es_mod, m.nombre AS nombre_mod
            FROM USUARIO u
            LEFT JOIN ALUMNO a ON u.id_user = a.id_user
            LEFT JOIN PROFESOR p ON u.id_user = p.id_user
            LEFT JOIN MODERADOR m ON u.id_user = m.id_user
            WHERE u.correo_cifrado = ?
        `;

        db.query(sql, [correo], async (err, results) => {
            if (err) return reject(err);
            const user = results[0];
            if (!user) return resolve(null);

            const bcrypt = require('bcrypt');
            const stored = user.contrasena_cifrado || '';

            try {
                // Si ya está hasheada con bcrypt, comparar con bcrypt
                if (stored.startsWith('$2')) {
                    const ok = await bcrypt.compare(pass, stored);
                    if (!ok) return resolve(null);
                    return resolve(user);
                }

                // Si la contraseña en BD está en texto plano, comparar directamente
                // Si coincide, re-hashear y actualizar la BD (migración on-login)
                if (stored === pass) {
                    // Re-hash en background (no bloquear la respuesta)
                    bcrypt.hash(pass, 10)
                        .then(hashed => {
                            db.query('UPDATE USUARIO SET contrasena_cifrado = ? WHERE id_user = ?', [hashed, user.id_user], () => {});
                        })
                        .catch(() => {});

                    return resolve(user);
                }

                // No coincide
                return resolve(null);
            } catch (e) {
                return reject(e);
            }
        });
    });
}

async function insertUser(db, correo, pass) {
    return new Promise(async (resolve, reject) => {
        try {
            const bcrypt = require('bcrypt');
            // Hash la contraseña con salt rounds de 10
            const hashedPass = await bcrypt.hash(pass, 10);
            db.query('INSERT INTO USUARIO (correo_cifrado, contrasena_cifrado) VALUES (?, ?)', [correo, hashedPass], (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
            });
        } catch (error) {
            reject(error);
        }
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

async function updatePassword(db, id_user, nuevaPass) {
    return new Promise(async (resolve, reject) => {
        try {
            const bcrypt = require('bcrypt');
            // Hash la nueva contraseña con salt rounds de 10
            const hashedPass = await bcrypt.hash(nuevaPass, 10);
            db.query('UPDATE USUARIO SET contrasena_cifrado = ? WHERE id_user = ?', [hashedPass, id_user], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { findUserByCredentials, insertUser, insertAlumno, insertProfesor, insertModerador, updatePassword };
