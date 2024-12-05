const { PrismaClient } = require('@prisma/client');
const IBoletoRepository = require('../interfaces/IBoletoRepository');
const logger = require('../../../config/logger');
const axios = require('axios');
const uuidv4 = require('uuid').v4;

class PrismaBoletoRepository extends IBoletoRepository {
    constructor() {
        super();
        this.prisma = new PrismaClient({ log: [] });
    }

    async create(data) {
        try {
            logger.info('Creating new boleto', { data });
            const boleto = await this.prisma.boletos.create({ data });
            logger.info('Boleto created successfully', { boleto });
            return boleto;
        } catch (error) {
            logger.error('Error creating boleto', { 
                error: error.message, 
                stack: error.stack 
            });
            throw error;
        }
    }

    async findById(id) {
        try {
            logger.info('Finding boleto by ID', { id });
            const boleto = await this.prisma.boletos.findUnique({ 
                where: { boleto_id: id },
                include: {
                    installment: true
                }
            });

            if (!boleto) {
                logger.warn('Boleto not found', { id });
                return null;
            }

            return boleto;
        } catch (error) {
            logger.error('Error finding boleto', { 
                error: error.message, 
                stack: error.stack 
            });
            throw error;
        }
    }

    async findAll(filters = {}, skip = 0, take = 10) {
        try {
            const where = { ...filters };

            // Buscar o total de registros
            const total = await this.prisma.boletos.count({ where });

            // Buscar os registros da página atual
            const boletos = await this.prisma.boletos.findMany({
                where,
                skip,
                take,
                orderBy: { generated_at: 'desc' },
                include: {
                    installment: {
                        include: {
                            payment: true,
                            movement_payment: {
                                include: {
                                    movement: {
                                        include: {
                                            person: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            // Calcular metadados da paginação
            const totalPages = Math.ceil(total / take);
            const currentPage = Math.floor(skip / take) + 1;
            const hasNext = currentPage < totalPages;
            const hasPrevious = currentPage > 1;

            return {
                data: boletos,
                pagination: {
                    total,
                    totalPages,
                    currentPage,
                    perPage: take,
                    hasNext,
                    hasPrevious
                }
            };
        } catch (error) {
            logger.error('Error finding boletos', { 
                error: error.message, 
                stack: error.stack 
            });
            throw error;
        }
    }

    async update(id, data) {
        try {
            logger.info('Updating boleto', { id, data });
            const boleto = await this.prisma.boletos.update({
                where: { boleto_id: id },
                data
            });
            logger.info('Boleto updated successfully', { boleto });
            return boleto;
        } catch (error) {
            logger.error('Error updating boleto', { 
                error: error.message, 
                stack: error.stack 
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            logger.info('Deleting boleto', { id });
            const boleto = await this.prisma.boletos.delete({
                where: { boleto_id: id }
            });
            logger.info('Boleto deleted successfully', { boleto });
            return boleto;
        } catch (error) {
            logger.error('Error deleting boleto', { 
                error: error.message, 
                stack: error.stack 
            });
            throw error;
        }
    }

    // Função para buscar o movement_id de uma installment
    async getMovementIdFromInstallment(installmentId) {
        try {
            const installment = await this.prisma.installments.findUnique({
                where: { installment_id: installmentId },
                include: { 
                    movement_payment: { 
                        select: { movement_id: true } 
                    } 
                }
            });

            if (!installment || !installment.movement_payment) {
                throw new Error('Installment or movement not found');
            }

            return installment.movement_payment.movement_id;
        } catch (error) {
            logger.error('Error getting movement ID from installment', { 
                installmentId, 
                error: error.message 
            });
            throw error;
        }
    }

    async generateBoletoWebhook(params) {
        try {
            const { movement_id, installment_id } = params;

            logger.info('Iniciando geração de boleto', { 
                movement_id, 
                installment_id 
            });

            let finalInstallmentId;
            
            if (installment_id) {
                // Validar se a parcela existe
                const installment = await this.prisma.installments.findUnique({
                    where: { installment_id },
                    include: {
                        movement_payment: {
                            select: { 
                                movement_id: true,
                                movement: {
                                    select: {
                                        total_amount: true,
                                        movement_date: true,
                                        person: {
                                            select: {
                                                name: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

                console.log('DEBUG: Verificando parcela', {
                    installment_id,
                    installment_exists: !!installment,
                    movement_payment_exists: !!installment?.movement_payment,
                    movement_exists: !!installment?.movement_payment?.movement
                });

                if (!installment) {
                    console.error('ERRO: Parcela não encontrada', { 
                        installment_id,
                        context: 'Tentativa de geração de boleto' 
                    });
                    throw new Error('Installment not found');
                }

                // Log detalhado da parcela
                console.log('DEBUG: Detalhes da parcela', {
                    installment_id: installment.installment_id,
                    status: installment.status,
                    amount: installment.amount,
                    movement_id: installment.movement_payment?.movement_id,
                    person_name: installment.movement_payment?.movement?.person?.name,
                    total_amount: installment.movement_payment?.movement?.total_amount
                });

                if (!installment.movement_payment) {
                    console.error('ERRO: Parcela sem pagamento associado', { 
                        installment_id,
                        context: 'Verificação de movimento de pagamento' 
                    });
                    throw new Error('Installment has no associated movement payment');
                }

                finalInstallmentId = installment_id;
            } else if (movement_id) {
                // Buscar o pagamento do movimento
                const movementPayment = await this.getMovementPayment(movement_id);

                if (!movementPayment) {
                    console.error('ERRO: Movimento sem pagamento', { 
                        movement_id,
                        context: 'Verificação de pagamento do movimento' 
                    });
                    throw new Error('Movement has no associated payment');
                }

                // Buscar parcelas do pagamento
                const installments = await this.prisma.installments.findMany({
                    where: { payment_id: movementPayment.payment_id },
                    orderBy: { due_date: 'asc' }
                });

                console.log('DEBUG: Parcelas do movimento', {
                    movement_id,
                    payment_id: movementPayment.payment_id,
                    installments_count: installments.length,
                    installment_ids: installments.map(i => i.installment_id),
                    first_installment_status: installments[0]?.status
                });

                if (installments.length === 0) {
                    console.error('ERRO: Movimento sem parcelas', { 
                        movement_id,
                        movement_details: {
                            total_amount: movementPayment.total_amount,
                            person_name: movementPayment.movement?.person?.name
                        }
                    });
                    throw new Error('Movement has no installments. Cannot generate boleto without installments.');
                }

                finalInstallmentId = installments[0].installment_id;
            } else {
                console.error('ERRO: Parâmetros inválidos', { 
                    movement_id, 
                    installment_id,
                    context: 'Geração de boleto' 
                });
                throw new Error('Either movement_id or installment_id must be provided');
            }

            // Validar se já existe boleto com status A_RECEBER
            const existingBoleto = await this.prisma.boletos.findFirst({
                where: { 
                    installment_id: finalInstallmentId,
                    status: 'A_RECEBER' 
                }
            });

            console.log('DEBUG: Verificando boleto existente', {
                installment_id: finalInstallmentId,
                existing_boleto: !!existingBoleto
            });

            if (existingBoleto) {
                console.warn('AVISO: Boleto já existe com status A_RECEBER', { 
                    installment_id: finalInstallmentId, 
                    boleto_id: existingBoleto.boleto_id 
                });
                throw new Error('Boleto already exists');
            }

            // Determinar o movement_id
            const finalMovementId = movement_id || 
                (await this.prisma.installments.findUnique({
                    where: { installment_id: finalInstallmentId },
                    select: { 
                        movement_payment: { 
                            select: { movement_id: true } 
                        } 
                    }
                }))?.movement_payment?.movement_id;

            console.log('DEBUG: Movimento final para geração de boleto', {
                movement_id: finalMovementId,
                installment_id: finalInstallmentId
            });

            // Chamar webhook para geração de boleto
            const webhookResponse = await axios.post(
                process.env.N8N_BOLETO_WEBHOOK_URL, 
                { 
                    movement_id: finalMovementId, 
                    installment_id: finalInstallmentId 
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': process.env.N8N_WEBHOOK_API_KEY
                    }
                }
            );

            console.log('DEBUG: Resposta do webhook de boleto', {
                status: webhookResponse.status,
                data: webhookResponse.data
            });

            return {
                message: 'Boleto gerado com sucesso',
                boleto_id: webhookResponse.data.boleto_id,
                webhook_response: webhookResponse.data
            };
        } catch (error) {
            console.error('ERRO na geração de boleto:', {
                error_message: error.message,
                error_stack: error.stack,
                movement_id: params.movement_id,
                installment_id: params.installment_id
            });
            throw error;
        }
    }

    async getMovementPayment(movement_id) {
        try {
            console.log('DEBUG: Buscando payment para movimento', { movement_id });

            const movementPayment = await this.prisma.movement_payments.findFirst({
                where: { movement_id: parseInt(movement_id) },
                include: {
                    payment_methods: {
                        select: {
                            name: true
                        }
                    },
                    movement: {
                        select: {
                            total_amount: true,
                            movement_date: true,
                            person: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            });

            console.log('DEBUG: Resultado da busca de payment', {
                movement_id,
                payment_exists: !!movementPayment,
                payment_details: movementPayment ? {
                    payment_id: movementPayment.payment_id,
                    status: movementPayment.status,
                    total_amount: movementPayment.total_amount,
                    payment_method: movementPayment.payment_methods?.name,
                    movement_total: movementPayment.movement?.total_amount,
                    movement_date: movementPayment.movement?.movement_date,
                    person_name: movementPayment.movement?.person?.name
                } : null
            });

            if (!movementPayment) {
                console.warn('AVISO: Nenhum pagamento encontrado para o movimento', { 
                    movement_id,
                    details: 'Não foi possível encontrar um pagamento associado a este movimento' 
                });
                return null;
            }

            return movementPayment;
        } catch (error) {
            console.error('ERRO ao buscar payment do movimento', {
                movement_id,
                error_message: error.message,
                error_stack: error.stack
            });
            throw error;
        }
    }

    // Configuração de webhook para cancelamento de boletos
    // As variáveis de ambiente devem ser configuradas no .env:
    // N8N_BOLETO_CANCEL_WEBHOOK_URL: URL do webhook
    // N8N_WEBHOOK_API_KEY: Chave de API
    // N8N_WEBHOOK_API_SECRET: Segredo da API
    async cancelBoleto(external_boleto_id) {
        try {
            console.log('Tentando cancelar boleto com external_boleto_id:', external_boleto_id);

            // Fazer requisição para o webhook de cancelamento
            const webhookResponse = await axios.post(
                'https://n8n.agilefinance.com.br/webhook/inter/cobranca/cancelar', 
                { 
                    "external_boleto_id": external_boleto_id 
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': process.env.N8N_API_SECRET
                    }
                }
            );

            logger.info('Webhook cancel request successful', { 
                external_boleto_id,
                response: webhookResponse.data 
            });

            return true;
        } catch (error) {
            console.error('Erro detalhado no cancelBoleto:', {
                external_boleto_id,
                errorMessage: error.message,
                errorResponse: error.response ? error.response.data : null,
                errorStatus: error.response ? error.response.status : null
            });

            logger.error('Error in cancelBoleto', { 
                error: error.message, 
                stack: error.stack,
                external_boleto_id 
            });
            
            return false;
        }
    }
}

module.exports = PrismaBoletoRepository;
