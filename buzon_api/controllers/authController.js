const { login, registro, cambiarPassword } = require('../services/authService');
const { generarJWT } = require('../services/utilsService');

async function handleLogin(req, res) {
    const { correo, pass } = req.body;
    try {
        const data = await login(req.app.get('db'), correo, pass);
        if (!data) return res.status(401).json({ success: false, msg: 'Credenciales inválidas' });

        let rol = 'desconocido';
        let nombre = 'Anónimo';
        if (data.es_alumno) rol = 'alumno';
        else if (data.es_profe) { rol = 'profesor'; nombre = data.nombre_profe; }
        else if (data.es_mod) { rol = 'moderador'; nombre = data.nombre_mod; }

        const token = generarJWT({ sub: data.id_user, nombre, rol, exp: Math.floor(Date.now() / 1000) + 3600 });

        res.json({ success: true, user: { id: data.id_user, correo: data.correo_cifrado, rol, nombre }, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function handleRegistro(req, res) {
    const { correo, pass, rol, nombre } = req.body;
    try {
        const newId = await registro(req.app.get('db'), correo, pass, rol, nombre);
        res.json({ success: true, id: newId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, msg: 'Este correo ya está registrado' });
        res.status(500).json({ success: false, error: err.message });
    }
}

async function handleCambiarPassword(req, res) {
    const { id_user, nuevaPass } = req.body;
    if (!id_user || !nuevaPass) return res.status(400).json({ success: false, msg: 'Datos incompletos' });
    try {
        await cambiarPassword(req.app.get('db'), id_user, nuevaPass);
        res.json({ success: true, msg: 'Contraseña actualizada correctamente' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = { handleLogin, handleRegistro, handleCambiarPassword };
