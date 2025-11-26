/**
 * Script para crear nuevos usuarios en el sistema
 * 
 * USO:
 * node create-user.js
 * 
 * El script te pedirá la información del usuario interactivamente
 */

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const readline = require('readline');
require('dotenv').config();

// Configuración de la conexión a la base de datos
const pool = new Pool({
    host: process.env.SUPABASE_DB_HOST,
    port: process.env.SUPABASE_DB_PORT,
    database: process.env.SUPABASE_DB_NAME,
    user: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

// Interfaz para leer input del usuario
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function crearUsuario() {
    try {
        console.log('\n╔══════════════════════════════════════════╗');
        console.log('║     CREAR NUEVO USUARIO - SGA PRO        ║');
        console.log('╚══════════════════════════════════════════╝\n');

        // Solicitar datos del usuario
        const username = await question('Usuario (login): ');
        const password = await question('Contraseña: ');
        const nombre_completo = await question('Nombre completo: ');
        const email = await question('Email: ');
        const rol = await question('Rol (admin/operador/visualizador): ');

        // Validaciones básicas
        if (!username || !password || !nombre_completo || !email || !rol) {
            console.log('\n❌ Error: Todos los campos son obligatorios\n');
            rl.close();
            process.exit(1);
        }

        if (!['admin', 'operador', 'visualizador'].includes(rol.toLowerCase())) {
            console.log('\n❌ Error: El rol debe ser "admin", "operador" o "visualizador"\n');
            rl.close();
            process.exit(1);
        }

        console.log('\n⏳ Creando usuario...\n');

        // Hashear contraseña
        const password_hash = await bcrypt.hash(password, 10);

        // Insertar en la base de datos
        const query = `
            INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol, activo)
            VALUES ($1, $2, $3, $4, $5, true)
            RETURNING id, username, nombre_completo, email, rol, created_at
        `;

        const result = await pool.query(query, [
            username,
            password_hash,
            nombre_completo,
            email,
            rol.toLowerCase()
        ]);

        const nuevoUsuario = result.rows[0];

        console.log('╔══════════════════════════════════════════╗');
        console.log('║         ✅ USUARIO CREADO EXITOSAMENTE   ║');
        console.log('╚══════════════════════════════════════════╝\n');
        console.log('Detalles del usuario:');
        console.log('─────────────────────────────────────────');
        console.log(`ID:              ${nuevoUsuario.id}`);
        console.log(`Usuario:         ${nuevoUsuario.username}`);
        console.log(`Nombre:          ${nuevoUsuario.nombre_completo}`);
        console.log(`Email:           ${nuevoUsuario.email}`);
        console.log(`Rol:             ${nuevoUsuario.rol}`);
        console.log(`Fecha creación:  ${nuevoUsuario.created_at}`);
        console.log('─────────────────────────────────────────\n');

    } catch (error) {
        if (error.code === '23505') { // Unique violation
            console.log('\n❌ Error: El usuario ya existe\n');
        } else {
            console.error('\n❌ Error al crear usuario:', error.message);
            console.error('Detalles:', error);
        }
    } finally {
        rl.close();
        await pool.end();
    }
}

// Ejecutar
crearUsuario();
