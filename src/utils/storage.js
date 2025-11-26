const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Validamos que existan las credenciales
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error("❌ FALTAN LAS CREDENCIALES DE SUPABASE EN EL .ENV");
}

// Cliente específico para Storage (Fotos)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const uploadImage = async (file) => {
    try {
        // Limpiamos el nombre del archivo
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}_${Math.round(Math.random() * 1E9)}.${fileExt}`;
        const filePath = `productos/${fileName}`;

        console.log('📤 Subiendo imagen...', filePath);

        const { data, error } = await supabase.storage
            .from('inventario') // Asegúrate que el bucket se llame 'inventario' en Supabase
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (error) {
            console.error("Error Supabase:", error);
            throw error;
        }

        // Obtener URL pública
        const { data: urlData } = supabase.storage
            .from('inventario')
            .getPublicUrl(filePath);

        return urlData.publicUrl;
    } catch (error) {
        throw new Error(`Error subiendo imagen: ${error.message}`);
    }
};

module.exports = { uploadImage };