/**
 * Modelo para operaciones sobre la tabla MENSAJE
 */
function insertMensaje(db, texto, fecha, hora, id_autor, id_clase) {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO MENSAJE (texto, fecha, hora_minuto, id_autor, id_clase) VALUES (?, ?, ?, ?, ?)';
        db.query(sql, [texto, fecha, hora, id_autor, id_clase], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

function getMensajesByClase(db, id_clase) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM MENSAJE WHERE id_clase = ? ORDER BY id_mensaje DESC';
        db.query(sql, [id_clase], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

function deleteMensaje(db, id_mensaje) {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM MENSAJE WHERE id_mensaje = ?';
        db.query(sql, [id_mensaje], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

function getProfesoresEmails(db, id_clase) {
    return new Promise((resolve, reject) => {
        const sqlProfes = `
            SELECT u.correo_cifrado
            FROM USUARIO u
            INNER JOIN PROFESOR p ON u.id_user = p.id_user
            INNER JOIN ACCEDE a ON u.id_user = a.id_user
            WHERE a.id_clase = ?
        `;
        db.query(sqlProfes, [id_clase], (err, profes) => {
            if (err) return reject(err);
            resolve(profes.map(p => p.correo_cifrado));
        });
    });
}

module.exports = { insertMensaje, getMensajesByClase, deleteMensaje, getProfesoresEmails };
