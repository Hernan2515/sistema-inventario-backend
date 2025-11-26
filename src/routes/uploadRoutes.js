const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadImage } = require('../utils/storage');

// Configurar Multer (Guarda en memoria RAM temporalmente)
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('imagen'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No se envió ningún archivo" });
        }

        const publicUrl = await uploadImage(req.file);
        
        res.json({
            success: true,
            url: publicUrl,
            message: "Imagen subida exitosamente"
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;