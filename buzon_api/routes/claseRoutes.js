const express = require('express');
const router = express.Router();
const claseController = require('../controllers/claseController');

router.get('/clases/:id/:rol', (req, res) => claseController.getClases(req, res));
router.post('/crear-clase', (req, res) => claseController.crearClase(req, res));
router.post('/unirse-clase', (req, res) => claseController.unirseClase(req, res));
router.get('/mensajes/:idClase', (req, res) => claseController.getMensajesClase(req, res));
router.get('/clase/:idClase', (req, res) => claseController.getClaseInfo(req, res));
router.delete('/clase/:id_clase', (req, res) => claseController.eliminarClase(req, res));
router.put('/clase/codigo/:id_clase', (req, res) => claseController.rotarCodigo(req, res));
router.delete('/clase/:id_clase/usuario/:id_user', (req, res) => claseController.expulsarUsuario(req, res));

module.exports = router;
