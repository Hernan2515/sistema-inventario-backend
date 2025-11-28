const express = require('express');
const cors = require('cors');
const path = require('path'); // <--- Necesario para las rutas de archivos
require('dotenv').config();

// Conexión DB
const { checkConnection } = require('./config/database');
// Rutas
const almacenRoutes = require('./routes/almacenRoutes');
const movimientoRoutes = require('./routes/movimientoRoutes'); // NUEVO
const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// 1. SERVIR ARCHIVOS ESTÁTICOS (LA PÁGINA WEB PROFESIONAL)
// Esto hace que la carpeta "public" sea visible en el navegador
app.use(express.static(path.join(__dirname, '../public')));

// 2. API RUTAS
app.use('/api/auth', require('./routes/authRoutes')); // NUEVO: Autenticación
app.use('/api/almacen', almacenRoutes);
app.use('/api/movimientos', movimientoRoutes); // NUEVO: http://localhost:3001/api/movimientos
app.use('/api/prestamos', require('./routes/prestamoRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
// 3. RUTA SALUD
app.get('/api/health', async (req, res) => {
    const dbStatus = await checkConnection();
    res.json({ status: 'healthy', database: dbStatus ? 'OK' : 'FAIL' });
});

// --- ARRANCAR SERVIDOR ---
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`\n==================================================`);
    console.log(`🚀 SERVIDOR ONLINE: http://0.0.0.0:${PORT}`);
    console.log(`==================================================`);
    
    // Verificación inicial
    await checkConnection();
});