const { pool } = require('../config/database');

// 1. GET Categorías
const getCategorias = async (req, res) => {
    try {
        const response = await pool.query('SELECT * FROM almacen_categorias WHERE activo = true ORDER BY nombre ASC');
        res.status(200).json({ success: true, count: response.rowCount, data: response.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. GET Productos
const getProductos = async (req, res) => {
    try {
        const query = `
            SELECT p.*, c.nombre as categoria_nombre 
            FROM almacen_productos p 
            LEFT JOIN almacen_categorias c ON p.categoria_id = c.id 
            ORDER BY p.created_at DESC
        `;
        const response = await pool.query(query);
        res.status(200).json({ success: true, count: response.rowCount, data: response.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. POST Crear (Nuevo)
const createProducto = async (req, res) => {
    const { 
        sku, nombre, descripcion, categoria_id, precio_unitario, stock_actual, 
        stock_minimo, stock_maximo, ubicacion_id,
        marca, modelo, serial, proveedor, fecha_compra, 
        vida_util_meses, departamento, responsable, estatus, observaciones
    } = req.body;

    const stockMaxFinal = stock_maximo || 1000;
    const estatusFinal = estatus || 'DISPONIBLE';

    const query = `
        INSERT INTO almacen_productos 
        (sku, nombre, descripcion, categoria_id, precio_unitario, stock_actual, 
         stock_minimo, stock_maximo, ubicacion_id, unidad_medida,
         marca, modelo, serial, proveedor, fecha_compra, vida_util_meses, 
         departamento, responsable, estatus, observaciones)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'unidad', $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *
    `;

    const values = [
        sku, nombre, descripcion, categoria_id, precio_unitario || 0, 
        stock_actual || 0, stock_minimo || 5, stockMaxFinal, ubicacion_id || null,
        marca, modelo, serial, proveedor, fecha_compra || null, 
        vida_util_meses || null, departamento, responsable, estatusFinal, observaciones
    ];

    try {
        const result = await pool.query(query, values);
        res.status(201).json({ success: true, message: '✅ Producto registrado', data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error DB', error: error.message });
    }
};

// 4. PUT Actualizar (Editar)
const updateProducto = async (req, res) => {
    const { id } = req.params; // El ID viene de la URL
    const { 
        sku, nombre, descripcion, categoria_id, precio_unitario, stock_actual,
        stock_minimo, stock_maximo, ubicacion_id, marca, modelo, serial, 
        proveedor, fecha_compra, vida_util_meses, departamento, responsable, 
        estatus, observaciones 
    } = req.body;

    const query = `
        UPDATE almacen_productos 
        SET 
            sku = $1, 
            nombre = $2, 
            descripcion = $3, 
            categoria_id = $4, 
            precio_unitario = $5, 
            stock_actual = $6, 
            stock_minimo = $7, 
            stock_maximo = $8, 
            ubicacion_id = $9, 
            marca = $10, 
            modelo = $11,
            serial = $12, 
            proveedor = $13, 
            fecha_compra = $14, 
            vida_util_meses = $15, 
            departamento = $16, 
            responsable = $17,
            estatus = $18, 
            observaciones = $19, 
            updated_at = NOW()
        WHERE id = $20
        RETURNING *
    `;

    // Convertir vacíos a null para evitar errores de tipo
    const fCompra = fecha_compra === '' ? null : fecha_compra;
    const vUtil = vida_util_meses === '' ? null : vida_util_meses;

    const values = [
        sku, nombre, descripcion, categoria_id, precio_unitario, stock_actual,
        stock_minimo || 5, stock_maximo || 1000, ubicacion_id || null, marca, modelo, serial,
        proveedor, fCompra, vUtil, departamento, responsable,
        estatus, observaciones, id
    ];

    try {
        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado para editar' });
        }
        res.json({ success: true, message: '✅ Producto actualizado correctamente', data: result.rows[0] });
    } catch (error) {
        console.error('Error update:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar', error: error.message });
    }
};

module.exports = {
    getCategorias,
    getProductos,
    createProducto,
    updateProducto
};
