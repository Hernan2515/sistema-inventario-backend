const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sga-pro-secret-key-change-in-production';

/**
 * Middleware de autenticación
 * Verifica el token JWT en el header Authorization
 */
const authMiddleware = (req, res, next) => {
    try {
        // Obtener token del header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No autorizado - Token no proporcionado'
            });
        }

        // Extraer token
        const token = authHeader.split(' ')[1];

        // Verificar token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Agregar información del usuario al request
        req.user = decoded;

        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }

        console.error('Error en authMiddleware:', error);
        return res.status(500).json({
            success: false,
            message: 'Error de autenticación'
        });
    }
};

/**
 * Middleware para verificar rol específico
 * @param {string[]} rolesPermitidos - Array de roles permitidos
 */
const checkRole = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No autorizado'
            });
        }

        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para esta acción'
            });
        }

        next();
    };
};

module.exports = {
    authMiddleware,
    checkRole
};
