const { profanity, profaneWords } = require('@2toad/profanity');

console.log('Idiomas disponibles:', Object.keys(profaneWords));
console.log('\n--- Pruebas ---');
console.log('Test damn (en):', profanity.exists('damn'));
console.log('Test mierda (es):', profanity.exists('mierda'));
console.log('Test tonto (es):', profanity.exists('tonto'));

// Intentar cargar Spanish
console.log('\n--- Cargando Spanish ---');
profanity.loadDictionary('es');
console.log('Test mierda después de cargar:', profanity.exists('mierda'));
console.log('Test tonto después de cargar:', profanity.exists('tonto'));
console.log('Test limpio método censor:', profanity.censor('esto es mierda y tonto'));
