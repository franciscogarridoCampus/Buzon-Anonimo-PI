function getClaseById(db, id_clase) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT id_clase, nombre, codigo_temp FROM CLASE WHERE id_clase = ?';
        db.query(sql, [id_clase], (err, results) => {
            if (err) return reject(err);
            resolve(results[0]);
        });
    });
}

module.exports = { getClaseById };
