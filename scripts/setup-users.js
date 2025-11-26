const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/database');

async function setupAdmin() {
    try {
        console.log('🔧 CONFIGURACIÓN DE USUARIO ADMIN\n');

        // PASO 1: BORRAR TODOS LOS USUARIOS
        console.log('1️⃣ Limpiando usuarios existentes...');
        await pool.query('DELETE FROM almacen_usuarios');
        console.log('   ✅ Tabla limpia\n');

        // PASO 2: CREAR SOLO ADMIN
        console.log('2️⃣ Creando usuario administrador...');

        const password = '123';
        const hash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO almacen_usuarios (nombre, password_hash, email, rol, activo)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, nombre, email, rol`,
            ['admin', hash, 'admin@empresa.com', 'admin', true]
        );

        console.log('   ✅ Usuario creado exitosamente\n');
        console.log('='.repeat(50));
        console.log('📋 CREDENCIALES DE ACCESO');
        console.log('='.repeat(50));
        console.log('\n   Usuario: admin');
        console.log('   Contraseña: 123');
        console.log('\n   ID:', result.rows[0].id);
        console.log('   Email:', result.rows[0].email);
        console.log('   Rol:', result.rows[0].rol);
        console.log('\n' + '='.repeat(50));
        console.log('✅ Listo para usar!');
        console.log('='.repeat(50) + '\n');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nDetalles:', error);
        await pool.end();
        process.exit(1);
    }
}

setupAdmin();
