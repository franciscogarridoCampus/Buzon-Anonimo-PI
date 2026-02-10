const claseService = require('../services/claseService');
const { generarCodigoAleatorio } = require('../services/utilsService');

async function getClases(req, res) {
    const { id, rol } = req.params;
    try {
        const results = await claseService.getClasesForUser(req.app.get('db'), id, rol);
        res.json(results);
    } catch (err) { res.status(500).json({ error: err.message }); }
}

async function crearClase(req, res) {
    const { nombre, id_creador } = req.body;
    const codigoInicial = generarCodigoAleatorio();
    try {
        await claseService.crearClase(req.app.get('db'), nombre, id_creador, codigoInicial);
        res.json({ success: true, codigo: codigoInicial });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
}

async function unirseClase(req, res) {
    const { id_user, codigo } = req.body;
    try {
        const resultado = await claseService.unirClase(req.app.get('db'), id_user, codigo);
        if (!resultado.success) return res.status(400).json(resultado);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
}

async function getMensajesClase(req, res) {
    const { idClase } = req.params;
    try {
        const mensajes = await req.app.get('db').promise().query('SELECT * FROM MENSAJE WHERE id_clase = ? ORDER BY id_mensaje DESC', [idClase]);
        res.json(mensajes[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
}

async function getClaseInfo(req, res) {
    const { idClase } = req.params;
    try {
        const info = await claseService.getClaseInfo(req.app.get('db'), idClase);
        if (!info) return res.status(404).json({ msg: 'Clase no encontrada' });
        res.json(info);
    } catch (err) { res.status(500).json({ error: err.message }); }
}

async function eliminarClase(req, res) {
    const { id_clase } = req.params;
    try {
        const result = await claseService.eliminarClaseAndMensajes(req.app.get('db'), id_clase);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, msg: 'Clase no encontrada' });
        res.json({ success: true, msg: `Clase ${id_clase} y sus mensajes eliminados` });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
}

async function rotarCodigo(req, res) {
    const { id_clase } = req.params;
    const codigoActual = generarCodigoAleatorio();
    try {
        await claseService.rotarCodigo(req.app.get('db'), id_clase, codigoActual);
        setTimeout(() => { claseService.rotarCodigo(req.app.get('db'), id_clase, generarCodigoAleatorio()); }, 60000);
        res.json({ success: true, codigo_temp: codigoActual });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
}

async function expulsarUsuario(req, res) {
    const { id_clase, id_user } = req.params;
    try {
        await claseService.expulsarUsuario(req.app.get('db'), id_clase, id_user);
        res.json({ success: true, msg: 'Usuario expulsado' });
    } catch (err) { res.status(500).json({ error: err.message }); }
}

async function getClaseUsuarios(req, res) {
    const { id_clase } = req.params;
    try {
        const usuarios = await claseService.getClaseUsuarios(req.app.get('db'), id_clase);
        res.json(usuarios);
    } catch (err) { res.status(500).json({ error: err.message }); }
}

module.exports = { getClases, crearClase, unirseClase, getMensajesClase, getClaseInfo, eliminarClase, rotarCodigo, expulsarUsuario, getClaseUsuarios };
