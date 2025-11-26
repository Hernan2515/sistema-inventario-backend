const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/database');

async function createAdmin() {
    try {
        console.log('🔧 Creando usuario administrador...\n');

        // Generar hash correcto
        const password = '123';
        const hash = await bcrypt.hash(password, 10);

        console.log('✅ Hash generado correctamente');

        // Eliminar admin si existe
        await pool.query('DELETE FROM almacen_usuarios WHERE nombre = $1', ['admin']);
        console.log('✅ Usuario anterior eliminado (si existía)');

        // Insertar admin con hash correcto
        // COLUMNAS REALES: id, nombre, email, password_hash, rol, activo
        const result = await pool.query(
            `INSERT INTO almacen_usuarios (nombre, password_hash, email, rol, activo)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, nombre, rol`,
            ['admin', hash, 'admin@empresa.com', 'admin', true]
        );

        console.log('\n✅ Usuario admin creado exitosamente:');
        console.log('   ID:', result.rows[0].id);
        console.log('   Nombre:', result.rows[0].nombre);
        console.log('   Rol:', result.rows[0].rol);

        console.log('\n🔐 CREDENCIALES DE ACCESO:');
        console.log('   Usuario: admin');
        console.log('   Contraseña: 123');
        console.log('\n⚠️  IMPORTANTE: Cambia esta contraseña en producción\n');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error al crear usuario:', error.message);
        await pool.end();
        process.exit(1);
    }
}

createAdmin();
