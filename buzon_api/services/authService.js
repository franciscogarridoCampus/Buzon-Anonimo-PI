const { findUserByCredentials, insertUser, insertAlumno, insertProfesor, insertModerador, updatePassword } = require('../models/userModel');

async function login(db, correo, pass) {
    const user = await findUserByCredentials(db, correo, pass);
    return user;
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
