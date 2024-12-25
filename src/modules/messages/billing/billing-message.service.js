const { logger } = require('../../../middlewares/logger');
const TemplateService = require('../templates/template.service');
const { formatCurrency, formatDate } = require('../../../utils/formatters');

// Importações para TaskService
const TaskService = require('../../tasks/task.service');
const TaskRepository = require('../../tasks/repositories/task.repository');
const TaskLogsService = require('../../tasklogs/tasklogs.service');
const TaskDependenciesService = require('../../taskdependencies/taskdependencies.service');
const TaskTypesRepository = require('../../tasktypes/tasktypes.repository');

class BillingMessageService {
    constructor() {
        this.templateService = new TemplateService();
        
        // Instancia TaskService com suas dependências
        const taskRepository = new TaskRepository();
        const taskLogsService = new TaskLogsService();
        const taskDependenciesService = new TaskDependenciesService();
        const taskTypesRepository = new TaskTypesRepository();

        this.taskService = new TaskService({
            taskRepository,
            taskLogsService,
            taskDependenciesService,
            taskTypesRepository
        });
    }

    /**
     * Processa uma mensagem de faturamento
     * @param {Object} movement - Movimento
     * @param {Object} person - Pessoa
     * @param {Array} contacts - Contatos da pessoa
     */
    async processBillingMessage(movement, person, contacts) {
        try {
            logger.info('BillingMessageService: Iniciando processamento de mensagem', {
                movementId: movement.id,
                personId: person.person_id,
                totalContacts: contacts.length
            });

            const emailContacts = contacts.filter(c => c.contact_type === 'email');
            
            logger.info('BillingMessageService: Contatos de email filtrados', {
                emailContactsCount: emailContacts.length,
                emailContacts: emailContacts.map(c => c.contact_value)
            });

            if (!emailContacts.length) {
                logger.warn('Pessoa não possui contatos de email', {
                    personId: person.person_id,
                    movementId: movement.id
                });
                return;
            }

            const templateData = {
                person_name: person.full_name,
                company_name: person.company_name,
                movement_description: movement.description,
                movement_amount: formatCurrency(movement.amount),
                movement_due_date: formatDate(movement.due_date),
                payment_link: this.generatePaymentLink(movement.id),
                nfse_link: movement.nfse_url,
                installments: this.formatInstallments(movement.installments)
            };

            // Sempre usa template 1 para faturamento
            const template = await this.templateService.findByType(1);
            
            logger.info('BillingMessageService: Template encontrado', {
                templateId: template.template_id,
                templateType: template.type
            });

            const processedTemplate = this.templateService.processTemplate(template, templateData);

            // Cria task para cada contato
            for (const contact of emailContacts) {
                const taskData = {
                    type: 'email',
                    payload: {
                        to: contact.contact_value,
                        subject: processedTemplate.subject,
                        content: processedTemplate.content,
                        metadata: {
                            movement_id: movement.id,
                            person_id: person.person_id,
                            contact_id: contact.contact_id
                        }
                    }
                };

                logger.info('BillingMessageService: Criando task de email', {
                    taskType: taskData.type,
                    contactEmail: contact.contact_value
                });

                const task = await this.taskService.create(taskData);

                logger.info('BillingMessageService: Task de email criada', {
                    taskId: task.task_id,
                    contactEmail: contact.contact_value
                });
            }

            logger.info('Mensagem de faturamento processada', {
                movementId: movement.id,
                personId: person.person_id,
                contactsCount: emailContacts.length
            });

        } catch (error) {
            logger.error('Erro ao processar mensagem de faturamento', {
                error: error.message,
                errorStack: error.stack,
                movementId: movement.id,
                personId: person?.person_id
            });
            throw error;
        }
    }

    /**
     * Gera link de pagamento
     * @private
     */
    generatePaymentLink(movementId) {
        return `${process.env.PAYMENT_BASE_URL}/pay/${movementId}`;
    }

    /**
     * Formata lista de parcelas
     * @private
     */
    formatInstallments(installments) {
        if (!installments?.length) return [];
        
        return installments.map(inst => 
            `Parcela ${inst.number}/${inst.total}: ${formatCurrency(inst.amount)} - Vencimento: ${formatDate(inst.due_date)}`
        );
    }
}

module.exports = BillingMessageService;
