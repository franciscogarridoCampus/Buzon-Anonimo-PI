/**
 * Script para migrar contraseñas sin encriptar a bcrypt
 * Ejecutar: node migratePasswords.js
 */

const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function migratePasswords() {
    try {
        console.log('🔄 Iniciando migración de contraseñas...\n');
        
        // Crear conexión al BD
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'buzon_anonimo'
        });

        // Obtener todos los usuarios
        const [usuarios] = await connection.query('SELECT id_user, contrasena_cifrado FROM USUARIO');
        
        if (usuarios.length === 0) {
            console.log('✅ No hay usuarios para migrar');
            await connection.end();
            return;
        }

        console.log(`📋 Se encontraron ${usuarios.length} usuarios\n`);

        let migrados = 0;
        let saltados = 0;

        for (const user of usuarios) {
            const { id_user, contrasena_cifrado } = user;
            
            // Detectar si ya está hasheado (empieza con $2a$, $2b$ o $2y$)
            if (contrasena_cifrado.startsWith('$2')) {
                console.log(`⏭️  Usuario ${id_user}: Ya está encriptado`);
                saltados++;
                continue;
            }

            try {
                // Hashear la contraseña antigua
                const hashedPass = await bcrypt.hash(contrasena_cifrado, 10);
                
                // Actualizar en BD
                await connection.query(
                    'UPDATE USUARIO SET contrasena_cifrado = ? WHERE id_user = ?',
                    [hashedPass, id_user]
                );

                console.log(`✅ Usuario ${id_user}: Contraseña migrada`);
                migrados++;
            } catch (error) {
                console.error(`❌ Usuario ${id_user}: Error al hashear - ${error.message}`);
            }
        }

        console.log(`\n📊 Resumen:`);
        console.log(`   ✅ Migrados: ${migrados}`);
        console.log(`   ⏭️  Ya encriptados: ${saltados}`);
        console.log(`   📈 Total: ${usuarios.length}`);
        
        await connection.end();
        console.log('\n✨ ¡Migración completada!');
        
    } catch (error) {
        console.error('❌ Error en migración:', error.message);
        process.exit(1);
    }
}

// Ejecutar migración
migratePasswords();
