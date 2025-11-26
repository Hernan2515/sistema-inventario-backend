const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, checkRole } = require('../middleware/auth');

// Rutas públicas
router.post('/login', authController.login);

// Rutas protegidas
router.get('/me', authMiddleware, authController.getMe);

// Rutas solo para admin - GESTIÓN DE USUARIOS
router.post('/register', authMiddleware, checkRole(['admin']), authController.register);
router.get('/usuarios', authMiddleware, checkRole(['admin']), authController.getAllUsers);
router.put('/usuarios/:id', authMiddleware, checkRole(['admin']), authController.updateUser);
router.patch('/usuarios/:id/toggle', authMiddleware, checkRole(['admin']), authController.toggleUserStatus);

module.exports = router;
