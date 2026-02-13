const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', (req, res) => authController.handleLogin(req, res));
router.post('/registro', (req, res) => authController.handleRegistro(req, res));
router.put('/usuario/password', (req, res) => authController.handleCambiarPassword(req, res));

module.exports = router;
