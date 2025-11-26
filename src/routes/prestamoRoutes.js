const express = require('express');
const router = express.Router();
const prestamoController = require('../controllers/prestamoController');

router.post('/salida', prestamoController.registrarPrestamo);
router.post('/devolucion', prestamoController.registrarDevolucion);
router.get('/pendientes', prestamoController.getPendientes);

module.exports = router;