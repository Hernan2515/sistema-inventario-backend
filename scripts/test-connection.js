require('dotenv').config();
const { checkConnection } = require('../src/config/database');

async function testSupabase() {
    console.log('\n🔎 INICIANDO DIAGNÓSTICO DE RED...');

    // 1. Ejecutar la prueba de conexión nueva
    const isConnected = await checkConnection();

    if (isConnected) {
        console.log('\n✨ CONCLUSIÓN:');
        console.log('   Todo está listo. Tu backend ya tiene acceso a Supabase.');
        console.log('   Puedes iniciar el servidor con: npm run dev');
    } else {
        console.log('\n💀 CONCLUSIÓN:');
        console.log('   Sigue habiendo un error de red o contraseña.');
    }

    // Cerramos el proceso para que no se quede la terminal colgada
    process.exit(0);
}

testSupabase();
