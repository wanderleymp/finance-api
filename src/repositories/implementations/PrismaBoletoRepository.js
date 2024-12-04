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

            // Validar se já existe boleto com status A_RECEBER
            const existingBoleto = await this.prisma.boletos.findFirst({
                where: { 
                    installment_id: installment_id,
                    status: 'A_RECEBER' 
                }
            });

            if (existingBoleto) {
                logger.warn('Boleto already exists with status A_RECEBER', { 
                    installment_id, 
                    boleto_id: existingBoleto.boleto_id 
                });
                throw new Error('Boleto already exists with status A_RECEBER');
            }

            // Determinar o movement_id
            let finalMovementId;
            if (movement_id) {
                finalMovementId = movement_id;
            } else if (installment_id) {
                finalMovementId = await this.getMovementIdFromInstallment(installment_id);
            } else {
                throw new Error('Either movement_id or installment_id must be provided');
            }

            // Fazer requisição para o webhook
            const webhookResponse = await axios.post(
                'https://n8n.webhook.agilefinance.com.br/webhook/vendas/boleto', 
                { movement_id: finalMovementId }
            );

            logger.info('Webhook request successful', { 
                movement_id: finalMovementId, 
                response: webhookResponse.data 
            });

            return {
                message: 'Boleto generation request sent successfully',
                movement_id: finalMovementId,
                webhook_response: webhookResponse.data
            };
        } catch (error) {
            logger.error('Error in generateBoletoWebhook', { 
                error: error.message, 
                stack: error.stack 
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
