// mensajeService.js
const nodemailer = require('nodemailer');
const badwords = require('./badwords.js');

// Configuración de correo (usuario y contraseña de aplicación)
const EMAIL_USER = ''; // correo de usuario para encargarse de enviar el aviso; ESTA VACIO PERO SE PONDRIA EL CORREO AQUI
const EMAIL_PASS = '';        // contraseña de aplicación (app password) para tener acceso al correo para enviar el mensaje; ESTA VACIO PERO SE PONDRIA EL APP PASSWORD SIN ESPACIOS
//para obtener el pass del correo debes tener la verificacion de doble paso y en app password generarlo

let transporter = null;

if (EMAIL_USER && EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: EMAIL_USER, pass: EMAIL_PASS }
    });
} else {
    console.warn('No se ha configurado correo para notificaciones. Se requieren EMAIL_USER y EMAIL_PASS para enviar avisos.');
}

/**
 * Envía un mensaje y notifica a los profesores de la clase
 * @param {object} db - Conexión MySQL
 * @param {number} id_autor
 * @param {number} id_clase
 * @param {string} texto
 * @returns {Promise<{success: boolean, msg?: string}>}
 */
async function enviarMensaje(db, id_autor, id_clase, texto) {
    return new Promise((resolve, reject) => {
        const textoMinus = texto.toLowerCase();
        const contieneMala = badwords.some(palabra => textoMinus.includes(palabra.toLowerCase()));

        if (contieneMala) return resolve({ success: false, msg: 'El mensaje contiene palabras no permitidas' });

        const fecha = new Date().toISOString().slice(0, 10);
        const hora = new Date().toLocaleTimeString('es-ES', { hour12: false });

        // Guardar mensaje en la base de datos
        const sql = 'INSERT INTO MENSAJE (texto, fecha, hora_minuto, id_autor, id_clase) VALUES (?, ?, ?, ?, ?)';
        db.query(sql, [texto, fecha, hora, id_autor, id_clase], (err) => {
            if (err) return reject(err);

            // Obtener información de la clase
            db.query('SELECT nombre FROM CLASE WHERE id_clase = ?', [id_clase], (errClase, claseResult) => {
                if (errClase) return reject(errClase);
                const nombreClase = claseResult[0]?.nombre || 'Clase desconocida';

                // Si no hay transporter configurado, solo avisamos y resolvemos
                if (!transporter) {
                    console.log(`No peude enviarse el aviso a los correos de los profesores porque no hay un correo asociado que se encargue de enviar los avisos"`);// en EMAIL_USER y EMAIL_PASS
                    return resolve({ success: true });
                }

                // Buscar correos de los profesores de la clase
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

                    resolve({ success: true });
                });
            });
        });
    });
}

module.exports = { enviarMensaje };
