const { Pool } = require('pg');
require('dotenv').config();

console.log('🔌 Conectando a BD en:', process.env.SUPABASE_DB_HOST);
console.log('🔌 Puerto:', process.env.SUPABASE_DB_PORT);

const dbConfig = {
    host: process.env.SUPABASE_DB_HOST,
    port: process.env.SUPABASE_DB_PORT,
    database: process.env.SUPABASE_DB_NAME,
    user: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: { rejectUnauthorized: false }, // Obligatorio
    connectionTimeoutMillis: 20000 // 20 segundos
};

const pool = new Pool(dbConfig);

// Mostrar error REAL si falla
pool.on('error', (err) => {
    console.error('⚠️ Error inesperado del cliente DB:', err);
});

const checkConnection = async () => {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ ¡BASE DE DATOS CONECTADA! (Puerto 5432)');
        return true;
    } catch (err) {
        console.error('❌ ERROR REAL:', err.message);
        return false;
    }
};

module.exports = { 
    pool, 
    query: (text, params) => pool.query(text, params),
    checkConnection 
};