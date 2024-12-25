const { logger } = require('../../../middlewares/logger');
const TemplateRepository = require('./template.repository');

const TEMPLATE_FIELDS = {
    // Person
    '[contactName]': '{{person_name}}',
    '[Empresa]': '{{company_name}}',
    
    // Movement
    '[Serviço/Produto]': '{{movement_description}}',
    '[Valor]': '{{movement_amount}}',
    '[due_date]': '{{movement_due_date}}',
    '[dias]': '{{movement_days_late}}',
    
    // Links
    '[Link para Pagamento]': '{{payment_link}}',
    '[linknfse]': '{{nfse_link}}',
    
    // Arrays
    '[parcelas]': '{{installments}}'
};

class TemplateService {
    constructor() {
        this.repository = new TemplateRepository();
    }

    /**
     * Busca um template pelo tipo
     * @param {number} typeId - ID do tipo de template
     * @returns {Promise<Template>}
     */
    async findByType(typeId) {
        try {
            const template = await this.repository.findByType(typeId);
            if (!template) {
                throw new Error(`Template não encontrado para o tipo ${typeId}`);
            }
            return template;
        } catch (error) {
            logger.error('Erro ao buscar template', {
                error: error.message,
                typeId
            });
            throw error;
        }
    }

    /**
     * Processa um template substituindo as variáveis
     * @param {Template} template - Template a ser processado
     * @param {TemplateData} data - Dados para substituição
     * @returns {Object} Template processado com conteúdo e assunto
     */
    processTemplate(template, data) {
        try {
            let content = template.template_content;
            
            // Substitui os campos padronizados
            Object.entries(TEMPLATE_FIELDS).forEach(([oldField, newField]) => {
                const value = this.getValueFromPath(data, newField.replace(/[{}]/g, ''));
                if (value !== undefined) {
                    // Se for array, formata adequadamente
                    const formattedValue = Array.isArray(value) 
                        ? value.join('\n') 
                        : String(value);
                    content = content.replace(new RegExp(oldField, 'g'), formattedValue);
                }
            });

            logger.info('Template processado com sucesso', {
                templateId: template.template_id,
                typeId: template.chat_type_id
            });

            return {
                content,
                subject: template.subject
            };
        } catch (error) {
            logger.error('Erro ao processar template', {
                error: error.message,
                templateId: template.template_id
            });
            throw error;
        }
    }

    /**
     * Helper para acessar dados aninhados
     * @private
     */
    getValueFromPath(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }
}

module.exports = TemplateService;
