const express = require('express');
const router = express.Router();
const movController = require('../controllers/movimientoController');

router.post('/', movController.registrarMovimiento);
router.get('/', movController.getHistorial);

module.exports = router;