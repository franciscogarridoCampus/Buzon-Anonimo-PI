async function getClasesForUser(db, id, rol) {
    if (rol === 'moderador') return new Promise((resolve, reject) => db.query('SELECT * FROM CLASE WHERE id_creador = ?', [id], (err, results) => err ? reject(err) : resolve(results)));
    return new Promise((resolve, reject) => db.query('SELECT c.* FROM CLASE c JOIN ACCEDE a ON c.id_clase = a.id_clase WHERE a.id_user = ?', [id], (err, results) => err ? reject(err) : resolve(results)));
}

async function crearClase(db, nombre, id_creador, codigo) {
    return new Promise((resolve, reject) => db.query('INSERT INTO CLASE (nombre, codigo_temp, id_creador) VALUES (?, ?, ?)', [nombre, codigo, id_creador], (err, result) => err ? reject(err) : resolve(result)));
}

async function unirClase(db, id_user, codigo) {
    return new Promise((resolve, reject) => {
        db.query('SELECT id_clase FROM CLASE WHERE codigo_temp = ?', [codigo], (err, results) => {
            if (err) return reject(err);
            if (results.length === 0) return resolve({ success: false, msg: 'El código no es válido o ha expirado' });
            const id_clase = results[0].id_clase;
            db.query('INSERT INTO ACCEDE (id_user, id_clase) VALUES (?, ?)', [id_user, id_clase], (errInsert) => {
                if (errInsert) {
                    if (errInsert.code === 'ER_DUP_ENTRY') return resolve({ success: false, msg: 'Ya estás unido a esta clase' });
                    return reject(errInsert);
                }
                resolve({ success: true });
            });
        });
    });
}

async function getClaseInfo(db, id_clase) {
    return new Promise((resolve, reject) => db.query('SELECT id_clase, nombre, codigo_temp FROM CLASE WHERE id_clase = ?', [id_clase], (err, results) => err ? reject(err) : resolve(results[0])));
}

async function eliminarClaseAndMensajes(db, id_clase) {
    return new Promise((resolve, reject) => {
        db.query('DELETE FROM MENSAJE WHERE id_clase = ?', [id_clase], (err) => {
            if (err) return reject(err);
            db.query('DELETE FROM CLASE WHERE id_clase = ?', [id_clase], (err2, result) => {
                if (err2) return reject(err2);
                resolve(result);
            });
        });
    });
}

async function rotarCodigo(db, id_clase, nuevoCodigo) {
    return new Promise((resolve, reject) => db.query('UPDATE CLASE SET codigo_temp = ? WHERE id_clase = ?', [nuevoCodigo, id_clase], (err, result) => err ? reject(err) : resolve(result)));
}

async function expulsarUsuario(db, id_clase, id_user) {
    return new Promise((resolve, reject) => db.query('DELETE FROM ACCEDE WHERE id_user = ? AND id_clase = ?', [id_user, id_clase], (err, result) => err ? reject(err) : resolve(result)));
}

async function getClaseUsuarios(db, id_clase) {
    return new Promise((resolve, reject) => {
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
        db.query(sql, [id_clase], (err, results) => err ? reject(err) : resolve(results));
    });
}

module.exports = { getClasesForUser, crearClase, unirClase, getClaseInfo, eliminarClaseAndMensajes, rotarCodigo, expulsarUsuario, getClaseUsuarios };
