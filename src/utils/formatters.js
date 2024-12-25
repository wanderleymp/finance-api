/**
 * Formata um valor para moeda
 * @param {number} value 
 * @returns {string}
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Formata uma data
 * @param {Date|string} date 
 * @returns {string}
 */
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
}

module.exports = {
    formatCurrency,
    formatDate
};
