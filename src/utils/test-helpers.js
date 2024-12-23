const jwt = require('jsonwebtoken');

/**
 * Gera um token JWT para testes
 * @param {Object} payload Dados a serem incluídos no token
 * @returns {string} Token JWT
 */
function generateTestToken(payload) {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
    );
}

module.exports = {
    generateTestToken
};
