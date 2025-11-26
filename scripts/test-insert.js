// Script para probar la inserción de un producto
async function testInsert() {
    // Usamos 127.0.0.1 en lugar de localhost para evitar errores de red en Windows
    const BASE_URL = 'http://127.0.0.1:3001';

    console.log('📦 Intentando registrar un Taladro en el sistema...');
    console.log(`   Destino: ${BASE_URL}/api/almacen/productos`);

    const nuevoProducto = {
        sku: "HER-TAL-" + Math.floor(Math.random() * 1000), // Generar SKU único random
        nombre: "Taladro Percutor Dewalt",
        descripcion: "Taladro de 20V - Prueba API",
        categoria_id: null, 
        precio_unitario: 150.00,
        stock_actual: 10,
        stock_minimo: 2,
        ubicacion_id: null 
    };

    try {
        // 1. Buscamos una categoría válida
        console.log('   1. Buscando categoría válida...');
        const catRes = await fetch(`${BASE_URL}/api/almacen/categorias`);
        
        if (!catRes.ok) throw new Error(`Error conectando: ${catRes.statusText}`);
        
        const catData = await catRes.json();
        
        if(catData.data && catData.data.length > 0) {
            nuevoProducto.categoria_id = catData.data[0].id;
            console.log(`      -> Categoría encontrada: ${catData.data[0].nombre}`);
        } else {
            throw new Error("No hay categorías en la DB. Ejecuta el script SQL primero.");
        }

        // 2. Insertamos el producto
        console.log('   2. Enviando producto...');
        const response = await fetch(`${BASE_URL}/api/almacen/productos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoProducto)
        });

        const result = await response.json();
        
        console.log('---------------------------------------------------');
        console.log('✅ RESULTADO DEL SERVIDOR:');
        console.log(JSON.stringify(result, null, 2));
        console.log('---------------------------------------------------');

    } catch (error) {
        console.error('❌ ERROR FATAL:', error.cause || error.message);
    }
}

testInsert();