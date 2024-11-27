/**
 * Formats a phone number to a standardized format
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - The formatted phone number
 */
function formatPhoneNumber(phoneNumber) {
    // Remove todos os caracteres não numéricos
    let numbers = phoneNumber.replace(/\D/g, '');
    
    // Se começar com + ou 0, remove
    if (numbers.startsWith('0')) {
        numbers = numbers.substring(1);
    }
    
    // Se não tiver código do país, assume Brasil (+55)
    if (numbers.length <= 11) {
        numbers = '55' + numbers;
    }
    
    // Garante que tenha o 9 para celulares no Brasil
    if (numbers.startsWith('55') && numbers.length === 12 && !numbers.substring(2).startsWith('9')) {
        numbers = numbers.substring(0, 2) + '9' + numbers.substring(2);
    }

    // Formata o número
    if (numbers.length === 13) { // Celular BR com código do país
        return `+${numbers.substring(0, 2)} (${numbers.substring(2, 4)}) ${numbers.substring(4, 9)}-${numbers.substring(9)}`;
    } else if (numbers.length === 12) { // Fixo BR com código do país
        return `+${numbers.substring(0, 2)} (${numbers.substring(2, 4)}) ${numbers.substring(4, 8)}-${numbers.substring(8)}`;
    } else {
        // Para números internacionais ou outros formatos, mantém só com o +
        return '+' + numbers;
    }
}

/**
 * Formats a contact value based on its type
 * @param {string} value - The contact value to format
 * @param {string} type - The type of contact ('E-Mail', 'Telefone', 'Whatsapp', etc)
 * @returns {string} - The formatted contact value
 */
function formatContactValue(value, type) {
    if (!value) return value;

    switch (type) {
        case 'E-Mail':
            return value.toLowerCase().trim();
        case 'Whatsapp':
        case 'Telefone':
            return formatPhoneNumber(value);
        default:
            return value.trim();
    }
}

/**
 * Detects the most likely contact type based on the value format
 * @param {string} value - The contact value to analyze
 * @returns {{type: string, confidence: number}} - The detected type and confidence level (0-1)
 */
function detectContactType(value) {
    // Remove espaços e caracteres especiais para análise
    const cleanValue = value.trim();
    const numericValue = value.replace(/\D/g, '');

    // Verifica se é email
    if (cleanValue.includes('@') && cleanValue.includes('.')) {
        return { type: 'E-Mail', confidence: 0.9 };
    }

    // Verifica se é um número de telefone/whatsapp
    if (numericValue.length >= 8) {
        // Se tiver o formato internacional do WhatsApp (@s.whatsapp.net)
        if (cleanValue.includes('@s.whatsapp.net')) {
            return { type: 'Whatsapp', confidence: 1 };
        }

        // Se for um número BR com 11 dígitos (com 9)
        if (numericValue.length === 11 && numericValue.startsWith('9', 2)) {
            return { type: 'Whatsapp', confidence: 0.7 };
        }

        // Se for um número com código do país
        if (numericValue.length >= 12) {
            return { type: 'Whatsapp', confidence: 0.6 };
        }

        // Outros números são provavelmente telefone fixo
        return { type: 'Telefone', confidence: 0.8 };
    }

    // Se não conseguiu identificar
    return { type: 'Outros', confidence: 0.3 };
}

module.exports = {
    formatPhoneNumber,
    formatContactValue,
    detectContactType
};
