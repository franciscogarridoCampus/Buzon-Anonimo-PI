const express = require('express');
const router = express.Router();
const MensajeController = require('../controllers/mensajeController');

// POST enviar mensaje
router.post('/', (req, res) => MensajeController.enviar(req, res));

// GET mensajes por clase
router.get('/clase/:idClase', (req, res) => MensajeController.listarPorClase(req, res));

// DELETE mensaje
router.delete('/:id_mensaje', (req, res) => MensajeController.eliminar(req, res));

module.exports = router;
