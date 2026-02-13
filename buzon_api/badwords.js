/**
 * Módulo de filtrado de palabras ofensivas usando @2toad/profanity
 * Soporte multi-idioma incluyendo español
 * @link https://github.com/2toad/profanity
 */

const { Profanity } = require('@2toad/profanity');

// Inicializar con soporte para español
const profanity = new Profanity({
  languages: ['es']
});

/**
 * Verifica si un texto contiene palabras ofensivas
 * @param {string} texto - El texto a verificar
 * @returns {boolean} true si contiene palabras ofensivas, false en caso contrario
 */
function check(texto) {
  if (!texto || typeof texto !== 'string') return false;
  return profanity.exists(texto);
}

/**
 * Limpia un texto reemplazando palabras ofensivas con caracteres especiales
 * @param {string} texto - El texto a limpiar
 * @returns {string} El texto limpio con caracteres censurados (@#$%&!)
 */
function clean(texto) {
  if (!texto || typeof texto !== 'string') return texto;
  return profanity.censor(texto);
}

/**
 * Agrega palabras personalizadas a la lista de prohibidas
 * @param {string|Array} palabras - Palabra(s) a agregar
 */
function addWords(palabras) {
  const wordsToAdd = Array.isArray(palabras) ? palabras : [palabras];
  wordsToAdd.forEach(word => {
    if (word && typeof word === 'string') {
      profanity.addWords(word);
    }
  });
}

/**
 * Remueve palabras de la lista de prohibidas
 * @param {string|Array} palabras - Palabra(s) a remover
 */
function removeWords(palabras) {
  const wordsToRemove = Array.isArray(palabras) ? palabras : [palabras];
  wordsToRemove.forEach(word => {
    if (word && typeof word === 'string') {
      profanity.removeWords(word);
    }
  });
}

module.exports = {
  check,
  clean,
  addWords,
  removeWords,
  // Aliases para compatibilidad
  hasProfanity: check,
  cleanProfanity: clean,
  isProfane: check,
  censor: clean,
  exists: check,
  profanity
};