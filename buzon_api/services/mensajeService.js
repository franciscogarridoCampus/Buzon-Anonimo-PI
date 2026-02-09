const raiz = require('../mensajeService');

// Reexportar enviarMensaje desde la implementación raíz
const enviarMensaje = raiz.enviarMensaje;

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

module.exports = { enviarMensaje, getMensajesByClase, deleteMensaje };
