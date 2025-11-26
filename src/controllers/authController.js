const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Secret para JWT (en producción debe estar en .env)
const JWT_SECRET = process.env.JWT_SECRET || 'sga-pro-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

/**
 * LOGIN - Autenticar usuario
 */
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y password son requeridos'
            });
        }

        // Buscar usuario
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE username = $1 AND activo = true',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const user = result.rows[0];

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Actualizar último acceso
        await pool.query(
            'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1',
            [user.id]
        );

        // Generar token JWT
        const token = jwt.sign(
            {
                id: user.id,
                nombre: user.nombre,
                rol: user.rol
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Responder (NO enviar password_hash)
        res.json({
            success: true,
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                username: user.username,
                nombre_completo: user.nombre_completo,
                email: user.email,
                rol: user.rol
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

/**
 * REGISTER - Crear nuevo usuario (solo admin)
 */
const register = async (req, res) => {
    try {
        const { username, password, nombre_completo, email, rol } = req.body;

        // Validaciones
        if (!username || !password || !nombre_completo) {
            return res.status(400).json({
                success: false,
                message: 'Campos requeridos: username, password, nombre_completo'
            });
        }

        if (!['admin', 'gerente', 'operador'].includes(rol)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido'
            });
        }

        // Verificar si username ya existe
        const existingUser = await pool.query(
            'SELECT id FROM usuarios WHERE username = $1',
            [username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El username ya está en uso'
            });
        }

        // Hash de la contraseña
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Insertar usuario
        const result = await pool.query(
            `INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, username, nombre_completo, email, rol, created_at`,
            [username, password_hash, nombre_completo, email || null, rol]
        );

        res.json({
            success: true,
            message: 'Usuario creado exitosamente',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Error en register:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear usuario'
        });
    }
};

/**
 * GET ME - Obtener datos del usuario autenticado
 */
const getMe = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            'SELECT id, username, nombre_completo, email, rol, created_at, ultimo_acceso FROM usuarios WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Error en getMe:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario'
        });
    }
};

/**
 * GET ALL USERS - Listar todos los usuarios (solo admin)
 */
const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, nombre_completo, email, rol, activo, created_at, ultimo_acceso 
             FROM usuarios 
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            usuarios: result.rows
        });

    } catch (error) {
        console.error('Error en getAllUsers:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios'
        });
    }
};

/**
 * UPDATE USER - Actualizar usuario
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_completo, email, rol, activo } = req.body;

        const result = await pool.query(
            `UPDATE usuarios 
             SET nombre_completo = COALESCE($1, nombre_completo),
                 email = COALESCE($2, email),
                 rol = COALESCE($3, rol),
                 activo = COALESCE($4, activo),
                 updated_at = NOW()
             WHERE id = $5
             RETURNING id, username, nombre_completo, email, rol, activo`,
            [nombre_completo, email, rol, activo, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Usuario actualizado',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Error en updateUser:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario'
        });
    }
};

/**
 * TOGGLE USER STATUS - Activar/Desactivar usuario
 */
const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener estado actual
        const currentUser = await pool.query(
            'SELECT activo FROM usuarios WHERE id = $1',
            [id]
        );

        if (currentUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const nuevoEstado = !currentUser.rows[0].activo;

        // Actualizar estado
        const result = await pool.query(
            `UPDATE usuarios 
             SET activo = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING id, username, nombre_completo, activo`,
            [nuevoEstado, id]
        );

        res.json({
            success: true,
            message: `Usuario ${nuevoEstado ? 'activado' : 'desactivado'}`,
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Error en toggleUserStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado del usuario'
        });
    }
};

module.exports = {
    login,
    register,
    getMe,
    getAllUsers,
    updateUser,
    toggleUserStatus
};
