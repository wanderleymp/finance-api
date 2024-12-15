/**
 * Remove caracteres não numéricos de um documento
 * @param {string} document - Documento a ser limpo
 * @returns {string} Documento apenas com números
 */
function cleanDocument(document) {
    if (!document) return '';
    return document.replace(/[^\d]/g, '');
}

/**
 * Valida se o CNPJ é válido
 * @param {string} cnpj - CNPJ a ser validado
 * @returns {boolean} Se o CNPJ é válido
 */
function isValidCNPJ(cnpj) {
    cnpj = cleanDocument(cnpj);
    
    // CNPJ deve ter 14 dígitos
    if (cnpj.length !== 14) return false;
    
    // Verificação de dígitos repetidos
    if (/^(\d)\1+$/.test(cnpj)) return false;
    
    // Cálculo dos dígitos verificadores
    let sum = 0;
    let peso = 2;
    
    // Primeiro dígito verificador
    for (let i = 11; i >= 0; i--) {
        sum += parseInt(cnpj.charAt(i)) * peso;
        peso = peso === 9 ? 2 : peso + 1;
    }
    
    let resto = sum % 11;
    let digitoVerificador1 = resto < 2 ? 0 : 11 - resto;
    
    if (parseInt(cnpj.charAt(12)) !== digitoVerificador1) return false;
    
    // Segundo dígito verificador
    sum = 0;
    peso = 2;
    
    for (let i = 12; i >= 0; i--) {
        sum += parseInt(cnpj.charAt(i)) * peso;
        peso = peso === 9 ? 2 : peso + 1;
    }
    
    resto = sum % 11;
    let digitoVerificador2 = resto < 2 ? 0 : 11 - resto;
    
    return parseInt(cnpj.charAt(13)) === digitoVerificador2;
}

module.exports = {
    cleanDocument,
    isValidCNPJ
};
