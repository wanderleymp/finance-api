const { ValidationError } = require('./errors');

function validateCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) {
        throw new ValidationError('CPF inválido: deve conter 11 dígitos');
    }

    if (/^(\d)\1{10}$/.test(cpf)) {
        throw new ValidationError('CPF inválido: não pode conter todos os dígitos iguais');
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) {
        throw new ValidationError('CPF inválido: dígito verificador incorreto');
    }

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) {
        throw new ValidationError('CPF inválido: dígito verificador incorreto');
    }
}

function validateCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]/g, '');

    if (cnpj.length !== 14) {
        throw new ValidationError('CNPJ inválido: deve conter 14 dígitos');
    }

    if (/^(\d)\1{13}$/.test(cnpj)) {
        throw new ValidationError('CNPJ inválido: não pode conter todos os dígitos iguais');
    }

    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    let digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
        sum += numbers.charAt(size - i) * pos--;
        if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(0))) {
        throw new ValidationError('CNPJ inválido: dígito verificador incorreto');
    }

    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
        sum += numbers.charAt(size - i) * pos--;
        if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(1))) {
        throw new ValidationError('CNPJ inválido: dígito verificador incorreto');
    }
}

function validateRG(rg) {
    rg = rg.replace(/[^\d]/g, '');
    
    if (rg.length < 5 || rg.length > 14) {
        throw new ValidationError('RG inválido: deve conter entre 5 e 14 dígitos');
    }
}

function validateIE(ie) {
    ie = ie.replace(/[^\d]/g, '');
    
    if (ie.length < 8 || ie.length > 14) {
        throw new ValidationError('IE inválida: deve conter entre 8 e 14 dígitos');
    }
}

function validateDocument(type, value) {
    if (!value) {
        throw new ValidationError('Valor do documento é obrigatório');
    }

    switch (type.toUpperCase()) {
        case 'CPF':
            validateCPF(value);
            break;
        case 'CNPJ':
            validateCNPJ(value);
            break;
        case 'RG':
            validateRG(value);
            break;
        case 'IE':
            validateIE(value);
            break;
        default:
            throw new ValidationError('Tipo de documento inválido');
    }

    return true;
}

module.exports = {
    validateDocument,
    validateCPF,
    validateCNPJ,
    validateRG,
    validateIE
};
