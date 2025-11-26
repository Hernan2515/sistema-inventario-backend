const { pool } = require('../config/database');

const registrarMovimiento = async (req, res) => {
    const { producto_id, tipo, cantidad, motivo, responsable, departamento, referencia, observaciones } = req.body;

    // Validación (solo campos críticos)
    if (!producto_id || !tipo || !cantidad || cantidad <= 0) {
        return res.status(400).json({ success: false, message: "Datos incompletos" });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // Iniciar Transacción (Todo o nada)

        // 1. Obtener producto actual
        const prodResult = await client.query('SELECT * FROM almacen_productos WHERE id = $1', [producto_id]);

        if (prodResult.rowCount === 0) {
            throw new Error("Producto no encontrado");
        }

        const producto = prodResult.rows[0];
        let nuevoStock = 0;
        const cantidadInt = parseInt(cantidad);
        const stockActualInt = parseInt(producto.stock_actual || 0);

        // 2. Calcular nuevo stock
        if (tipo === 'ENTRADA') {
            nuevoStock = stockActualInt + cantidadInt;
        } else if (tipo === 'SALIDA') {
            if (stockActualInt < cantidadInt) {
                throw new Error(`Stock insuficiente. Tienes ${stockActualInt}, intentas sacar ${cantidadInt}.`);
            }
            nuevoStock = stockActualInt - cantidadInt;
        }

        // 3. Actualizar Producto
        await client.query(
            'UPDATE almacen_productos SET stock_actual = $1, updated_at = NOW() WHERE id = $2',
            [nuevoStock, producto_id]
        );

        // 4. Guardar Historial (Kardex)
        const insertHistorial = `
            INSERT INTO almacen_movimientos 
            (producto_id, tipo_movimiento, cantidad, stock_anterior, stock_resultante, motivo, responsable, departamento_destino, referencia, observaciones)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;

        await client.query(insertHistorial, [
            producto_id, tipo, cantidadInt, stockActualInt, nuevoStock, motivo, responsable, departamento, referencia || null, observaciones || null
        ]);

        await client.query('COMMIT'); // Confirmar todo

        res.json({
            success: true,
            message: 'Movimiento registrado correctamente',
            nuevo_stock: nuevoStock
        });

    } catch (error) {
        await client.query('ROLLBACK'); // Cancelar si algo falla
        console.error("Error Movimiento:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

// Obtener últimos movimientos para el reporte
const getHistorial = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, p.nombre as producto, p.sku 
            FROM almacen_movimientos m
            JOIN almacen_productos p ON m.producto_id = p.id
            ORDER BY m.fecha DESC LIMIT 50
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { registrarMovimiento, getHistorial };