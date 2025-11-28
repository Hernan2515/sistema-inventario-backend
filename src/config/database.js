const { Pool } = require('pg');
require('dotenv').config();

// DATOS CORRECTOS (Pooler AWS-1)
const DB_HOST = 'aws-1-us-east-1.pooler.supabase.com'; 
const DB_PORT = 6543;
const DB_USER = 'postgres.hkyettionggogacoatkk';
const DB_NAME = 'postgres';
const DB_PASS = "8.fL&BmjYL+L/Rq";

// Codificamos la contraseña
const encodedPass = encodeURIComponent(DB_PASS);

// --- CAMBIO AQUÍ ---
// Quitamos "?sslmode=require" del final de la cadena
// Dejamos que el objeto de abajo maneje el SSL
const connectionString = `postgres://${DB_USER}:${encodedPass}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

console.log('🔌 Conectando a Supabase (SSL permisivo)...');

const pool = new Pool({
    connectionString: connectionString,
    // ESTA ES LA CLAVE PARA TU ERROR:
    ssl: { 
        rejectUnauthorized: false // Esto le dice: "Acéptalo aunque sea self-signed"
    },
    connectionTimeoutMillis: 30000, 
    idleTimeoutMillis: 30000
});

const checkConnection = async () => {
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT NOW()'); 
        client.release();
        console.log('✅ ¡VICTORIA! CONEXIÓN TOTALMENTE EXITOSA');
        return true;
    } catch (err) {
        console.error('❌ ERROR:', err.message);
        return false;
    }
};

module.exports = { 
    pool, 
    query: (text, params) => pool.query(text, params),
    checkConnection 
};