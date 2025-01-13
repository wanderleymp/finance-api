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

/**
 * Formata CNPJ
 * @param {string} cnpj - CNPJ numérico
 * @returns {string} CNPJ formatado
 */
function formatCNPJ(cnpj) {
    if (!cnpj) return '';
    
    // Remove caracteres não numéricos
    cnpj = cnpj.replace(/\D/g, '');
    
    // Preenche com zeros à esquerda se necessário
    cnpj = cnpj.padStart(14, '0');
    
    return cnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
    );
}

/**
 * Formata CPF
 * @param {string} cpf - CPF numérico
 * @returns {string} CPF formatado
 */
function formatCPF(cpf) {
    if (!cpf) return '';
    
    // Remove caracteres não numéricos
    cpf = cpf.replace(/\D/g, '');
    
    // Preenche com zeros à esquerda se necessário
    cpf = cpf.padStart(11, '0');
    
    return cpf.replace(
        /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
        '$1.$2.$3-$4'
    );
}

module.exports = {
    formatCurrency,
    formatDate,
    formatCNPJ,
    formatCPF
};
