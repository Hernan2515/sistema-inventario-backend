const { pool } = require('../config/database');

// 1. PRESTAR (SOPORTA LOTE / MÚLTIPLE + DEPARTAMENTO + FECHA)
const registrarPrestamo = async (req, res) => {
    // CORRECCIÓN 1: Agregamos departamento y fecha_estimada a la recepción de datos
    const { items, responsable, departamento, fecha_estimada, observaciones } = req.body;
    
    // Validaciones
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: "No hay ítems seleccionados" });
    }
    if (!responsable) {
        return res.status(400).json({ success: false, message: "Falta el Responsable" });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Recorremos cada ítem seleccionado
        for (const item of items) {
            const { producto_id, cantidad } = item;

            // Verificar Stock individual
            const prod = await client.query('SELECT stock_actual, nombre FROM almacen_productos WHERE id = $1', [producto_id]);
            
            if(prod.rows.length === 0) throw new Error(`Producto ID ${producto_id} no existe`);
            
            const actual = parseInt(prod.rows[0].stock_actual);
            const nombreProd = prod.rows[0].nombre;

            if (actual < cantidad) throw new Error(`Stock insuficiente para: ${nombreProd}. Quedan ${actual}.`);

            // Restar Stock
            await client.query('UPDATE almacen_productos SET stock_actual = stock_actual - $1 WHERE id = $2', [cantidad, producto_id]);

            // CORRECCIÓN 2: INSERT Completo (Incluyendo departamento y fecha)
            // Agregamos columna 'estado' por defecto en 'PENDIENTE'
            await client.query(
                `INSERT INTO almacen_prestamos 
                (producto_id, cantidad, responsable, departamento, fecha_estimada, observaciones, estado) 
                VALUES ($1, $2, $3, $4, $5, $6, 'PENDIENTE')`,
                [producto_id, cantidad, responsable, departamento, fecha_estimada || null, observaciones]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, message: '✅ Guía generada. Equipos entregados.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error Prestamo:", error); // Log para ver errores en consola
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

// 2. DEVOLVER (Mantenemos tu lógica, está bien)
const registrarDevolucion = async (req, res) => {
    const { prestamo_id } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const prestamo = await client.query('SELECT * FROM almacen_prestamos WHERE id = $1', [prestamo_id]);
        
        if (prestamo.rowCount === 0) throw new Error("Registro no encontrado o ya cerrado");
        const { producto_id, cantidad } = prestamo.rows[0];

        // Retornar Stock
        await client.query('UPDATE almacen_productos SET stock_actual = stock_actual + $1 WHERE id = $2', [cantidad, producto_id]);
        
        // Cerrar ticket (Lo borramos de pendientes)
        await client.query('DELETE FROM almacen_prestamos WHERE id = $1', [prestamo_id]); 

        await client.query('COMMIT');
        res.json({ success: true, message: 'Devolución exitosa' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: error.message });
    } finally { client.release(); }
};

// 3. CONSULTA DE PENDIENTES (Actualizado para traer departamento si lo necesitas mostrar)
const getPendientes = async (req, res) => {
    const q = `
        SELECT 
            pr.id as prestamo_id, 
            p.nombre as herramienta, 
            p.sku, 
            pr.cantidad, 
            pr.responsable, 
            pr.departamento, -- Agregamos esto por si quieres verlo en la tabla
            pr.fecha_salida 
        FROM almacen_prestamos pr 
        JOIN almacen_productos p ON pr.producto_id = p.id
        ORDER BY pr.fecha_salida DESC
    `;
    const result = await pool.query(q);
    res.json({ success: true, data: result.rows });
};

module.exports = { registrarPrestamo, registrarDevolucion, getPendientes };