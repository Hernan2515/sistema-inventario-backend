const { pool } = require('../config/database');

// 1. REGISTRAR PRÉSTAMO (SOLUCIÓN AL ERROR)
const registrarPrestamo = async (req, res) => {
    // 1. Recibimos los datos EXACTOS como los envía tu Frontend
    const { 
        items, 
        responsable, 
        departamento, 
        fecha_devolucion_estimada, // El frontend lo envía con este nombre largo
        observaciones 
    } = req.body;
    
    // 2. Validaciones
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: "No hay herramientas en la lista." });
    }
    if (!responsable) {
        return res.status(400).json({ success: false, message: "Debes escribir el nombre del técnico." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // Iniciar transacción

        // 3. Procesar cada herramienta de la lista
        for (const item of items) {
            // Tu frontend envía "productoId" (camelCase), no "producto_id"
            // Aquí aseguramos que lo lea bien venga como venga
            const idProd = item.productoId || item.producto_id;
            const cant = item.cantidad;

            // A. Verificar Stock
            const prod = await client.query('SELECT stock_actual, nombre FROM almacen_productos WHERE id = $1', [idProd]);
            
            if (prod.rows.length === 0) throw new Error(`El producto ID ${idProd} no existe.`);
            
            const actual = parseInt(prod.rows[0].stock_actual);
            const nombre = prod.rows[0].nombre;

            if (actual < cant) {
                throw new Error(`Stock insuficiente para "${nombre}". Tienes ${actual}, intentas sacar ${cant}.`);
            }

            // B. Restar del Inventario
            await client.query(
                'UPDATE almacen_productos SET stock_actual = stock_actual - $1 WHERE id = $2', 
                [cant, idProd]
            );

            // C. Crear Registro (Mapeando los campos correctamente)
            // Nota: 'fecha_devolucion_estimada' del JS se guarda en 'fecha_estimada' de la DB
            await client.query(
                `INSERT INTO almacen_prestamos 
                (producto_id, cantidad, responsable, departamento, fecha_estimada, observaciones, estado) 
                VALUES ($1, $2, $3, $4, $5, $6, 'PENDIENTE')`,
                [
                    idProd, 
                    cant, 
                    responsable, 
                    departamento || '', 
                    fecha_devolucion_estimada || null, 
                    observaciones || ''
                ]
            );
        }

        await client.query('COMMIT'); // Confirmar cambios
        res.json({ success: true, message: '✅ Préstamo registrado correctamente.' });

    } catch (error) {
        await client.query('ROLLBACK'); // Cancelar todo si hay error
        console.error("Error en Préstamo:", error);
        // Enviamos el mensaje exacto del error para que sepas qué pasó
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

// 2. DEVOLVER HERRAMIENTA
const registrarDevolucion = async (req, res) => {
    const { prestamo_id } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        
        const prestamo = await client.query('SELECT * FROM almacen_prestamos WHERE id = $1', [prestamo_id]);
        
        if (prestamo.rowCount === 0) throw new Error("Préstamo no encontrado o ya cerrado");
        const { producto_id, cantidad } = prestamo.rows[0];

        // Regresar Stock
        await client.query('UPDATE almacen_productos SET stock_actual = stock_actual + $1 WHERE id = $2', [cantidad, producto_id]);
        
        // Cerrar ticket (Borrar)
        await client.query('DELETE FROM almacen_prestamos WHERE id = $1', [prestamo_id]);

        await client.query('COMMIT');
        res.json({ success: true, message: '✅ Herramienta recibida en almacén' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: error.message });
    } finally { client.release(); }
};

// 3. CONSULTAR PENDIENTES
const getPendientes = async (req, res) => {
    try {
        // Query uniendo tablas para mostrar nombre del producto y datos del préstamo
        const query = `
            SELECT 
                pr.id as prestamo_id, 
                p.nombre as herramienta, 
                p.sku, 
                p.imagen_url,
                pr.cantidad, 
                pr.responsable, 
                pr.departamento,
                pr.fecha_salida,
                pr.fecha_estimada
            FROM almacen_prestamos pr 
            JOIN almacen_productos p ON pr.producto_id = p.id
            ORDER BY pr.fecha_salida DESC
        `;
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { registrarPrestamo, registrarDevolucion, getPendientes };