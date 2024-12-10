"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCPF = validateCPF;
exports.validateCNPJ = validateCNPJ;
function validateCPF(cpf) {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, "");
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11)
        return false;
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpf))
        return false;
    // Calcula os dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11)
        remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9)))
        return false;
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11)
        remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10)))
        return false;
    return true;
}
function validateCNPJ(cnpj) {
    // Remove caracteres não numéricos
    cnpj = cnpj.replace(/[^\d]/g, "");
    // Verifica se tem 14 dígitos
    if (cnpj.length !== 14)
        return false;
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cnpj))
        return false;
    // Calcula os dígitos verificadores
    let sum = 0;
    let weight = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cnpj.charAt(i)) * weight[i];
    }
    let remainder = sum % 11;
    let digit = remainder < 2 ? 0 : 11 - remainder;
    if (digit !== parseInt(cnpj.charAt(12)))
        return false;
    sum = 0;
    weight = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cnpj.charAt(i)) * weight[i];
    }
    remainder = sum % 11;
    digit = remainder < 2 ? 0 : 11 - remainder;
    if (digit !== parseInt(cnpj.charAt(13)))
        return false;
    return true;
}
//# sourceMappingURL=documentValidation.js.map