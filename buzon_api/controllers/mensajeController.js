const { enviarMensaje, getMensajesByClase, deleteMensaje } = require('../services/mensajeService');

class MensajeController {
    static async enviar(req, res) {
        const { texto, id_autor, id_clase } = req.body;
        try {
            const resultado = await enviarMensaje(req.app.get('db'), id_autor, id_clase, texto);
            if (!resultado.success) return res.status(400).json(resultado);
            res.json({ success: true });
        } catch (err) {
            console.error('Error MensajeController.enviar:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }

    static async listarPorClase(req, res) {
        const { idClase } = req.params;
        try {
            const results = await getMensajesByClase(req.app.get('db'), idClase);
            res.json(results);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async eliminar(req, res) {
        const { id_mensaje } = req.params;
        try {
            const result = await deleteMensaje(req.app.get('db'), id_mensaje);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, msg: `Mensaje ${id_mensaje} no encontrado` });
            res.json({ success: true, msg: `Mensaje ${id_mensaje} eliminado` });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = MensajeController;
