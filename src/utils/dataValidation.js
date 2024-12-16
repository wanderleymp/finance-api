const moment = require('moment');

/**
 * Valida se uma data é válida
 * @param {string|Date} date - Data a ser validada
 * @returns {boolean} - Indica se a data é válida
 */
function isValidDate(date) {
    if (!date) return false;
    
    // Converte para momento e verifica validade
    const momentDate = moment(date);
    return momentDate.isValid() && momentDate.isBefore(moment().add(100, 'years'));
}

/**
 * Sanitiza uma string removendo caracteres especiais e espaços extras
 * @param {string} str - String a ser sanitizada
 * @returns {string} - String sanitizada
 */
function sanitizeString(str) {
    if (!str) return '';
    
    return str
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[<>&'"]/g, ''); // Remove caracteres potencialmente perigosos
}

module.exports = {
    isValidDate,
    sanitizeString
};
