/**
 * @typedef {Object} Template
 * @property {number} template_id - ID do template
 * @property {number} chat_type_id - ID do tipo de chat
 * @property {string} template_content - Conteúdo do template
 * @property {string} subject - Assunto do template
 * @property {Date} created_at - Data de criação
 * @property {Date} updated_at - Data de atualização
 */

/**
 * @typedef {Object} TemplateData
 * @property {string} person_name - Nome da pessoa
 * @property {string} company_name - Nome da empresa
 * @property {string} movement_description - Descrição do movimento
 * @property {string} movement_amount - Valor do movimento
 * @property {string} movement_due_date - Data de vencimento
 * @property {number} movement_days_late - Dias em atraso
 * @property {string} payment_link - Link para pagamento
 * @property {string} nfse_link - Link da NFSe
 * @property {string[]} [installments] - Lista de parcelas
 */

module.exports = {};
