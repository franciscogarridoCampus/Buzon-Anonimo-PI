// mensajeService.js
const nodemailer = require('nodemailer');
const badwords = require('./badwords.js');

// ------------------------
// CONFIGURACIÓN DE CORREO
// ------------------------
// Correo y contraseña de aplicación para enviar notificaciones
const EMAIL_USER = ''; // usuario del correo
const EMAIL_PASS = '';         // contraseña de aplicación

let transporter = null;

// Configuración del transporter solo si hay correo y contraseña
if (EMAIL_USER && EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: EMAIL_USER, pass: EMAIL_PASS }
    });
} else {
    console.warn('Correo no configurado. EMAIL_USER y EMAIL_PASS son necesarios para enviar notificaciones.');
}

/**
 * Envía un mensaje a la base de datos y notifica a los profesores de la clase
 * @param {object} db - Conexión MySQL
 * @param {number} id_autor - ID del usuario que envía el mensaje
 * @param {number} id_clase - ID de la clase donde se envía el mensaje
 * @param {string} texto - Contenido del mensaje
 * @returns {Promise<{success: boolean, msg?: string}>}
 */
async function enviarMensaje(db, id_autor, id_clase, texto) {
    return new Promise((resolve, reject) => {
        // Validar contenido: palabras prohibidas
        const contieneMala = badwords.check(texto);
        if (contieneMala) return resolve({ success: false, msg: 'El mensaje contiene palabras no permitidas' });

        const fecha = new Date().toISOString().slice(0, 10);
        const hora = new Date().toLocaleTimeString('es-ES', { hour12: false });

        // Guardar mensaje en la base de datos
        const sql = 'INSERT INTO MENSAJE (texto, fecha, hora_minuto, id_autor, id_clase) VALUES (?, ?, ?, ?, ?)';
        db.query(sql, [texto, fecha, hora, id_autor, id_clase], (err) => {
            if (err) return reject(err);

            // Obtener información de la clase para el correo
            db.query('SELECT nombre FROM CLASE WHERE id_clase = ?', [id_clase], (errClase, claseResult) => {
                if (errClase) return reject(errClase);
                const nombreClase = claseResult[0]?.nombre || 'Clase desconocida';

                // Si no hay transporter configurado, no enviamos email
                if (!transporter) {
                    console.log('Correo no configurado. No se enviarán notificaciones a los profesores.');
                    return resolve({ success: true });
                }

                // Obtener correos de los profesores de la clase
                const sqlProfes = `
                    SELECT u.correo_cifrado
                    FROM USUARIO u
                    INNER JOIN PROFESOR p ON u.id_user = p.id_user
                    INNER JOIN ACCEDE a ON u.id_user = a.id_user
                    WHERE a.id_clase = ?
                `;
                db.query(sqlProfes, [id_clase], (errProf, profes) => {
                    if (errProf) return reject(errProf);

                    if (profes.length > 0) {
                        const listaCorreos = profes.map(p => p.correo_cifrado);

                        const mailOptions = {
                            from: `"EduFeedback" <${EMAIL_USER}>`,
                            to: listaCorreos,
                            subject: `Nuevo mensaje anónimo en ${nombreClase}`,
                            html: `
                                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
                                    <h2 style="color: #004dc1;">Notificación de EduFeedback</h2>
                                    <p>Se ha publicado un nuevo mensaje anónimo en la clase: <strong>${nombreClase}</strong></p>
                                    <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin-top: 10px;">
                                        <strong>Mensaje:</strong> "${texto}"
                                    </div>
                                    <p style="color: #888; font-size: 12px; margin-top: 15px;">
                                        Fecha: ${fecha} | Hora: ${hora}
                                    </p>
                                </div>
                            `
                        };

                        transporter.sendMail(mailOptions, (errorMail) => {
                            if (errorMail) console.error('Error enviando email:', errorMail);
                            else console.log('Notificación enviada a los profesores.');
                        });
                    }

                    // Resolver exitosamente aunque no se envíe correo
                    resolve({ success: true });
                });
            });
        });
    });
}

module.exports = { enviarMensaje };
