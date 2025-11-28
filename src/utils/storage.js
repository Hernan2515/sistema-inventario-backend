const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 1. DIAGNÓSTICO: Ver qué está leyendo Node.js
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

console.log('--- CONFIGURACIÓN STORAGE ---');
console.log('URL:', url ? '✅ Cargada' : '❌ FALTANTE (undefined)');
console.log('KEY:', key ? '✅ Cargada' : '❌ FALTANTE (undefined)');

let supabase;

// 2. INICIALIZACIÓN SEGURA (Para que no tumbe el servidor)
if (url && key) {
    try {
        supabase = createClient(url, key);
        console.log('✅ Cliente Supabase Storage listo.');
    } catch (e) {
        console.error('⚠️ Error al crear cliente Supabase:', e.message);
    }
} else {
    console.error('⚠️ ADVERTENCIA: No se pueden subir fotos porque faltan credenciales en .env');
}

const uploadImage = async (file) => {
    // Si no se inicializó el cliente, lanzamos error controlado
    if (!supabase) {
        throw new Error("El sistema de archivos no está configurado (Faltan SUPABASE_URL o SUPABASE_ANON_KEY en .env)");
    }

    try {
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}_${Math.round(Math.random() * 1E9)}.${fileExt}`;
        const filePath = `productos/${fileName}`; // Carpeta/Archivo

        // Subir archivo
        const { data, error } = await supabase.storage
            .from('inventario')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (error) throw error;

        // Obtener URL pública
        const { data: urlData } = supabase.storage
            .from('inventario')
            .getPublicUrl(filePath);

        return urlData.publicUrl;

    } catch (error) {
        console.error("Error detallado Supabase:", error);
        throw new Error(`Error al subir imagen: ${error.message}`);
    }
};

module.exports = { uploadImage };