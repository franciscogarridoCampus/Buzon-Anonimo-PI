const crypto = require('crypto');

const SECRET_KEY = "mi_clave_secreta";

function base64UrlEncode(data) {
    // Codifica un objeto JSON a Base64 seguro para URL
    return Buffer.from(JSON.stringify(data))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function generarJWT(payload) {
    // Genera un token JWT con HMAC-SHA256
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);
    const signature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function generarCodigoAleatorio() {
    // Genera un código alfanumérico de 6 caracteres
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 6; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
}

module.exports = { base64UrlEncode, generarJWT, generarCodigoAleatorio, SECRET_KEY };
