const axios = require('axios'); // Biblioteca para realizar requisições HTTP

/**
 * Valida se o CNPJ está no formato correto.
 * @param {string} cnpj - O CNPJ a ser validado.
 * @returns {boolean} - Retorna true se o CNPJ for válido.
 */
function validarCNPJ(cnpj) {
    return /^\d{14}$/.test(cnpj);
}

/**
 * Consulta informações de um CNPJ em uma API externa.
 * @param {string} cnpj - O CNPJ a ser consultado.
 * @returns {Promise<Object>} - Dados da empresa.
 */
async function consultarCNPJ(cnpj) {
    if (!validarCNPJ(cnpj)) {
        throw new Error('CNPJ inválido. O formato esperado é 14 dígitos.');
    }

    const url = `https://receitaws.com.br/v1/cnpj/${cnpj}`;
    const response = await axios.get(url, {
        headers: {
            'Accept': 'application/json',
        },
    });

    return response.data;
}

module.exports = { consultarCNPJ };
