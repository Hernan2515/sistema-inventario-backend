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

// 3. POST Crear (Nuevo) - ¡CORREGIDO CON CÓDIGO PROVEEDOR!
const createProducto = async (req, res) => {
    const { 
        sku, nombre, descripcion, categoria_id, precio_unitario, stock_actual, 
        stock_minimo, stock_maximo, 
        ubicacion, // Ahora usaremos texto directo para ubicación
        marca, modelo, serial, proveedor, codigo_proveedor, // <--- NUEVO
        estatus, imagen_url 
    } = req.body;

    const stockMaxFinal = stock_maximo || 1000;
    const estatusFinal = estatus || 'DISPONIBLE';
    // Si viene ubicacion_id (del select) o ubicacion (texto), usamos lo que llegue
    const ubicacionFinal = ubicacion || req.body.ubicacion_id || ''; 

    const query = `
        INSERT INTO almacen_productos (
            sku, nombre, descripcion, categoria_id, precio_unitario, 
            stock_actual, stock_minimo, stock_maximo, ubicacion, 
            unidad_medida, 
            marca, modelo, serial, proveedor, codigo_proveedor, 
            estatus, imagen_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'unidad', $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
    `;

    const values = [
        sku, nombre, descripcion, categoria_id, precio_unitario || 0, 
        stock_actual || 0, stock_minimo || 5, stockMaxFinal, ubicacionFinal,
        marca, modelo, serial, proveedor, codigo_proveedor, 
        estatusFinal, imagen_url
    ];

    try {
        const result = await pool.query(query, values);
        res.status(201).json({ success: true, message: '✅ Producto registrado correctamente', data: result.rows[0] });
    } catch (error) {
        console.error("Error SQL:", error);
        res.status(500).json({ success: false, message: 'Error DB', error: error.message });
    }
};

// 4. PUT Actualizar (Editar) - ¡CORREGIDO TAMBIÉN!
const updateProducto = async (req, res) => {
    const { id } = req.params;
    const { 
        sku, nombre, descripcion, categoria_id, precio_unitario, stock_actual,
        stock_minimo, stock_maximo, ubicacion, marca, modelo, serial, 
        proveedor, codigo_proveedor, estatus, imagen_url 
    } = req.body;

    const ubicacionFinal = ubicacion || req.body.ubicacion_id || '';

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
            ubicacion = $9, 
            marca = $10, 
            modelo = $11, 
            serial = $12, 
            proveedor = $13, 
            codigo_proveedor = $14,
            estatus = $15, 
            imagen_url = $16,
            updated_at = NOW()
        WHERE id = $17
        RETURNING *
    `;

    const values = [
        sku, nombre, descripcion, categoria_id, precio_unitario, stock_actual,
        stock_minimo, stock_maximo || 1000, ubicacionFinal, marca, modelo, serial,
        proveedor, codigo_proveedor, estatus, imagen_url, id
    ];

    try {
        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        res.json({ success: true, message: '✅ Producto actualizado', data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getCategorias,
    getProductos,
    createProducto,
    updateProducto
};