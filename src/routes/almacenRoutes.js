const express = require('express');
const router = express.Router();
const almacenController = require('../controllers/almacenController');

// Rutas públicas por ahora (luego agregaremos seguridad JWT)
router.get('/categorias', almacenController.getCategorias);
router.get('/productos', almacenController.getProductos);
// Ruta POST (Escribir) - ¡NUEVA!
router.post('/productos', almacenController.createProducto);
router.put('/productos/:id', almacenController.updateProducto);
module.exports = router;