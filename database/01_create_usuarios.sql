-- ==========================================
-- TABLA DE USUARIOS PARA AUTENTICACIÓN
-- ==========================================

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    rol VARCHAR(20) NOT NULL DEFAULT 'operador',
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_rol CHECK (rol IN ('admin', 'gerente', 'operador'))
);

-- Índices para mejor performance
CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- Usuario administrador por defecto
-- Password: admin123 (debe cambiarse en producción)
-- Hash bcrypt válido de 'admin123'
INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye/IQdvJz4AQSgPHxJj7e.JlPGKOVJPFy', 'Administrador', 'admin@sgapro.com', 'admin')
ON CONFLICT (username) DO NOTHING;

-- ==========================================
-- COMENTARIOS EXPLICATIVOS
-- ==========================================

-- ROLES:
-- 'admin': Acceso total, puede crear usuarios, ver reportes completos
-- 'gerente': Puede aprobar movimientos, ver reportes, no puede crear usuarios
-- 'operador': Solo puede registrar movimientos y consultar inventario

-- NOTAS DE SEGURIDAD:
-- 1. password_hash almacena el hash bcrypt, NUNCA la contraseña en texto plano
-- 2. El usuario admin por defecto tiene password 'admin123' - CAMBIAR EN PRODUCCIÓN
-- 3. activo permite deshabilitar usuarios sin eliminarlos
-- 4. ultimo_acceso se actualizará en cada login
