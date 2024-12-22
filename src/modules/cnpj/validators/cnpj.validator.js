class CnpjValidator {
    /**
     * Valida CNPJ
     * @param {string} cnpj - CNPJ a ser validado
     * @returns {string|null} Mensagem de erro ou null se válido
     */
    validateCnpj(cnpj) {
        // Remove caracteres não numéricos
        const cleanCnpj = cnpj.replace(/[^\d]/g, '');

        // Verifica se tem 14 dígitos
        if (cleanCnpj.length !== 14) {
            return 'CNPJ deve conter 14 dígitos';
        }

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1+$/.test(cleanCnpj)) {
            return 'CNPJ inválido';
        }

        // Algoritmo de validação do CNPJ
        let soma = 0;
        let peso = 2;

        // Primeiro dígito verificador
        for (let i = 11; i >= 0; i--) {
            soma += parseInt(cleanCnpj.charAt(i)) * peso;
            peso = peso === 9 ? 2 : peso + 1;
        }

        const primeiroDigito = 11 - (soma % 11);
        const digitoVerificador1 = primeiroDigito > 9 ? 0 : primeiroDigito;

        if (parseInt(cleanCnpj.charAt(12)) !== digitoVerificador1) {
            return 'CNPJ inválido';
        }

        // Segundo dígito verificador
        soma = 0;
        peso = 2;

        for (let i = 12; i >= 0; i--) {
            soma += parseInt(cleanCnpj.charAt(i)) * peso;
            peso = peso === 9 ? 2 : peso + 1;
        }

        const segundoDigito = 11 - (soma % 11);
        const digitoVerificador2 = segundoDigito > 9 ? 0 : segundoDigito;

        if (parseInt(cleanCnpj.charAt(13)) !== digitoVerificador2) {
            return 'CNPJ inválido';
        }

        return null;
    }
}

module.exports = new CnpjValidator();
