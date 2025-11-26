const bcrypt = require('bcryptjs');

// Generar hash para la contraseña admin123
const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.log('\n================================');
    console.log('HASH GENERADO PARA: admin123');
    console.log('================================');
    console.log(hash);
    console.log('================================\n');
    console.log('Copia este hash y actualiza el SQL\n');
});
