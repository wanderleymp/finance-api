const { PrismaClient } = require('@prisma/client');
const IMovementRepository = require('../interfaces/IMovementRepository');
const logger = require('../../../config/logger');
const { MovementError, MovementNotFoundError } = require('../../utils/errors/MovementError');
const axios = require('axios');

class PrismaMovementRepository extends IMovementRepository {
    constructor() {
        super();
        this.prisma = new PrismaClient({
            log: ['error', 'warn'],
            errorFormat: 'minimal'
        });
    }

    async createMovement(data) {
        try {
            logger.info(' [MOVEMENT-CREATE-START] Iniciando criação de movimento', { 
                movement_date: data.movement_date, 
                person_id: data.person_id, 
                total_amount: data.total_amount 
            });

            const movement = await this.prisma.movements.create({
                data: {
                    movement_date: new Date(data.movement_date),
                    person_id: parseInt(data.person_id),
                    total_amount: parseFloat(data.total_amount),
                    description: data.description,
                    license_id: parseInt(data.license_id),
                    total_items: parseFloat(data.total_amount), 
                    movement_items: {
                        create: data.items.map(item => ({
                            item_id: parseInt(item.product_id),
                            quantity: parseFloat(item.quantity),
                            unit_price: parseFloat(item.unit_value),
                            total_price: parseFloat(item.quantity) * parseFloat(item.unit_value)
                        }))
                    }
                },
                select: {
                    movement_id: true,
                    movement_date: true,
                    total_amount: true,
                    description: true,
                    movement_type_id: true,
                    movement_status_id: true,
                    persons: {
                        select: {
                            person_id: true,
                            full_name: true,
                            fantasy_name: true,
                            person_documents: {
                                select: {
                                    document_value: true,
                                    document_types: {
                                        select: {
                                            description: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    movement_types: {
                        select: {
                            movement_type_id: true,
                            type_name: true
                        }
                    },
                    movement_statuses: {
                        select: {
                            movement_status_id: true,
                            status_name: true,
                            description: true
                        }
                    }
                }
            });

            logger.info(' [MOVEMENT-CREATE-SUCCESS] Movimento criado', { 
                movement_id: movement.movement_id, 
                total_amount: movement.total_amount 
            });

            return movement;
        } catch (error) {
            logger.error(' [MOVEMENT-CREATE-ERROR] Erro ao criar movimento', { 
                error: error.message, 
                stack: error.stack,
                data 
            });
            if (error.code === 'P2002') {
                throw new MovementError('Unique constraint violation', 400);
            } else if (error.code === 'P2003') {
                throw new MovementError('Foreign key constraint violation', 400);
            }
            throw error;
        }
    }

    async getAllMovements(where = {}, skip = 0, take = 10, sort = { field: 'movement_date', order: 'desc' }) {
        try {
            logger.info(' [MOVEMENT-FIND-ALL-START] Buscando todos os movimentos', { 
                where, 
                skip, 
                take, 
                sort 
            });

            const [result, total] = await Promise.all([
                this.prisma.movements.findMany({
                    where,
                    include: {
                        persons: {
                            select: {
                                full_name: true,
                                fantasy_name: true,
                                person_documents: true
                            }
                        },
                        movement_types: {
                            select: {
                                type_name: true
                            }
                        },
                        movement_statuses: {
                            select: {
                                status_name: true
                            }
                        },
                        invoices: {
                            take: 1,
                            select: {
                                pdf_url: true,
                                xml_url: true
                            }
                        },
                        movement_payments: {
                            include: {
                                payment_methods: {
                                    select: {
                                        payment_method_id: true,
                                        method_name: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: [
                        { movement_date: 'desc' },
                        { movement_id: 'desc' }
                    ],
                    take,
                    skip
                }),
                this.prisma.movements.count({ where })
            ]);

            // Buscar installments separadamente
            const installmentsMap = await this.prisma.installments.findMany({
                where: {
                    payment_id: { in: result.map(m => m.movement_payments[0]?.payment_id).filter(Boolean) }
                },
                include: {
                    boletos: {
                        select: {
                            boleto_url: true,
                            status: true
                        }
                    }
                },
                orderBy: {
                    installment_number: 'asc'
                }
            });

            // Transformar o resultado
            const transformedResult = result.map(movement => {
                const movementPayment = movement.movement_payments[0];
                const relatedInstallments = installmentsMap
                    .filter(inst => inst.payment_id === movementPayment?.payment_id)
                    .map(inst => ({
                        installment_id: inst.installment_id,
                        installment_number: inst.installment_number,
                        due_date: inst.due_date,
                        amount: inst.amount,
                        status: inst.status,
                        boleto_url: inst.boletos[0]?.boleto_url || null,
                        boleto_status: inst.boletos[0]?.status || null
                    }));

                return {
                    movement_id: movement.movement_id,
                    movement_date: movement.movement_date,
                    total_amount: movement.total_amount,
                    description: movement.description,
                    license_id: movement.license_id,
                    full_name: movement.persons?.full_name,
                    fantasy_name: movement.persons?.fantasy_name,
                    person_documents: movement.persons?.person_documents,
                    type_name: movement.movement_types?.type_name,
                    status_name: movement.movement_statuses?.status_name,
                    invoice_url: movement.invoices[0]?.pdf_url || movement.invoices[0]?.xml_url || null,
                    payment_method: movementPayment?.payment_methods?.method_name || null,
                    installments: relatedInstallments
                };
            });

            logger.info(' [DEBUG] Movimentos encontrados', { 
                count: result.length,
                movements: result.map(m => ({
                    movement_id: m.movement_id,
                    payments: m.movement_payments?.map(p => ({
                        payment_id: p.payment_id
                    }))
                }))
            });

            return {
                data: transformedResult,
                pagination: {
                    total,
                    page: Math.floor(skip / take) + 1,
                    limit: take,
                    totalPages: Math.ceil(total / take)
                }
            };
        } catch (error) {
            logger.error(' [MOVEMENT-FIND-ALL-ERROR] Erro ao buscar movimentos', { 
                error: error.message, 
                stack: error.stack 
            });
            throw error;
        }
    }

    async getMovementById(id) {
        try {
            logger.info(' [MOVEMENT-FIND-BY-ID-START] Buscando movimento por ID', { id });

            const movement = await this.prisma.$transaction(async (prisma) => {
                const result = await prisma.movements.findUnique({
                    where: { movement_id: parseInt(id) },
                    select: {
                        movement_id: true,
                        movement_date: true,
                        total_amount: true,
                        description: true,
                        movement_type_id: true,
                        movement_status_id: true,
                        persons: {
                            select: {
                                person_id: true,
                                full_name: true,
                                fantasy_name: true,
                                person_documents: {
                                    select: {
                                        document_value: true,
                                        document_types: {
                                            select: {
                                                description: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        movement_types: {
                            select: {
                                movement_type_id: true,
                                type_name: true
                            }
                        },
                        movement_statuses: {
                            select: {
                                movement_status_id: true,
                                status_name: true,
                                description: true
                            }
                        },
                        movement_payments: {
                            select: {
                                payment_id: true,
                                payment_method_id: true,
                                total_amount: true,
                                status: true,
                                payment_methods: {
                                    select: {
                                        payment_method_id: true,
                                        method_name: true
                                    }
                                },
                                installments: {
                                    include: {
                                        boletos: {
                                            select: {
                                                boleto_url: true,
                                                status: true
                                            }
                                        }
                                    },
                                    orderBy: {
                                        installment_number: 'asc'
                                    }
                                }
                            }
                        }
                    }
                });

                if (!result) {
                    logger.warn(' [MOVEMENT-NOT-FOUND] Movimento não encontrado', { id });
                    throw new MovementNotFoundError(`Movimento com ID ${id} não encontrado`);
                }

                logger.info(' [MOVEMENT-FIND-BY-ID-SUCCESS] Movimento encontrado', { id });
                return result;
            });

            return movement;
        } catch (error) {
            logger.error(' [MOVEMENT-FIND-BY-ID-ERROR] Erro ao buscar movimento por ID', { 
                error: error.message, 
                stack: error.stack,
                id 
            });
            throw error;
        }
    }

    async updateMovement(id, data) {
        try {
            logger.info(' [MOVEMENT-UPDATE-START] Atualizando movimento', { 
                movement_id: id, 
                data 
            });

            const updateData = {
                ...(data.movement_date && { movement_date: new Date(data.movement_date) }),
                ...(data.person_id && { person_id: parseInt(data.person_id) }),
                ...(data.total_amount && { total_amount: parseFloat(data.total_amount) }),
                ...(data.description && { description: data.description }),
                ...(data.license_id && { license_id: parseInt(data.license_id) })
            };

            const movement = await this.prisma.movements.update({
                where: { movement_id: parseInt(id) },
                data: updateData,
                select: {
                    movement_id: true,
                    movement_date: true,
                    total_amount: true,
                    description: true,
                    movement_type_id: true,
                    movement_status_id: true,
                    persons: {
                        select: {
                            person_id: true,
                            full_name: true,
                            fantasy_name: true,
                            person_documents: {
                                select: {
                                    document_value: true,
                                    document_types: {
                                        select: {
                                            description: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    movement_types: {
                        select: {
                            movement_type_id: true,
                            type_name: true
                        }
                    },
                    movement_statuses: {
                        select: {
                            movement_status_id: true,
                            status_name: true,
                            description: true
                        }
                    }
                }
            });

            logger.info(' [MOVEMENT-UPDATE-SUCCESS] Movimento atualizado', { 
                movement_id: movement.movement_id 
            });

            return movement;
        } catch (error) {
            logger.error(' [MOVEMENT-UPDATE-ERROR] Erro ao atualizar movimento', { 
                error: error.message, 
                stack: error.stack,
                movement_id: id 
            });
            if (error.code === 'P2025') {
                throw new MovementNotFoundError(id);
            }
            throw error;
        }
    }

    async deleteMovement(id) {
        try {
            logger.info(' [MOVEMENT-DELETE-START] Excluindo movimento', { id });

            await this.prisma.movements.delete({
                where: { movement_id: parseInt(id) }
            });

            logger.info(' [MOVEMENT-DELETE-SUCCESS] Movimento excluído', { id });
        } catch (error) {
            logger.error(' [MOVEMENT-DELETE-ERROR] Erro ao excluir movimento', { 
                error: error.message, 
                stack: error.stack,
                movement_id: id 
            });
            if (error.code === 'P2025') {
                throw new MovementNotFoundError(id);
            }
            throw error;
        }
    }

    async getMovementHistory(id) {
        try {
            logger.info(' [MOVEMENT-HISTORY-START] Buscando histórico de movimento', { id });

            const history = await this.prisma.movement_status_history.findMany({
                where: { movement_id: parseInt(id) },
                orderBy: { changed_at: 'desc' },
                include: {
                    movement_statuses: true
                }
            });

            logger.info(' [MOVEMENT-HISTORY-SUCCESS] Histórico de movimento encontrado', { id });

            return history;
        } catch (error) {
            logger.error(' [MOVEMENT-HISTORY-ERROR] Erro ao buscar histórico de movimento', { 
                error: error.message, 
                stack: error.stack,
                movement_id: id 
            });
            throw error;
        }
    }

    async updateMovementStatus(id, statusId) {
        try {
            logger.info(' [MOVEMENT-STATUS-UPDATE-START] Atualizando status do movimento', { 
                movement_id: id,
                new_status_id: statusId
            });

            const movement = await this.prisma.movements.update({
                where: { movement_id: parseInt(id) },
                data: {
                    movement_status_id: parseInt(statusId)
                },
                include: {
                    movement_statuses: true,
                    movement_payments: {
                        include: {
                            installments: true
                        }
                    }
                }
            });

            // Registrar a mudança no histórico
            await this.prisma.movement_status_history.create({
                data: {
                    movement_id: parseInt(id),
                    movement_status_id: parseInt(statusId),
                    changed_at: new Date()
                }
            });

            logger.info(' [MOVEMENT-STATUS-UPDATE-SUCCESS] Status do movimento atualizado', { 
                movement_id: id,
                new_status_id: statusId
            });

            return movement;
        } catch (error) {
            logger.error(' [MOVEMENT-STATUS-UPDATE-ERROR] Erro ao atualizar status do movimento', { 
                error: error.message, 
                stack: error.stack,
                movement_id: id,
                status_id: statusId
            });
            if (error.code === 'P2025') {
                throw new MovementNotFoundError(id);
            }
            throw error;
        }
    }

    async generateBoleto(movementId) {
        // Converte para inteiro
        movementId = parseInt(movementId);

        // Busca movimento
        const movement = await this.prisma.movements.findUnique({
            where: { movement_id: movementId },
            include: {
                movement_payments: {
                    include: {
                        payment_methods: true
                    }
                }
            }
        });

        if (!movement) {
            throw new Error(`Movimento ${movementId} não encontrado`);
        }

        // Verifica se já existe boleto
        const existingBoleto = await this.prisma.boletos.findFirst({
            where: { movement_id: movementId }
        });

        if (existingBoleto) {
            return existingBoleto;
        }

        // Gera boleto
        const boletoData = {
            movement_id: movementId,
            boleto_number: `BOLETO-${movementId}-${Date.now()}`,
            boleto_url: `https://exemplo.com/boleto/${movementId}`,
            amount: movement.total_amount,
            due_date: new Date(new Date().setDate(new Date().getDate() + 15))
        };

        return this.prisma.boletos.create({
            data: boletoData
        });
    }

    async generateNfse(movementId) {
        // Converte para inteiro
        movementId = parseInt(movementId);

        // Busca movimento para validar existência
        const movement = await this.prisma.movements.findUnique({
            where: { movement_id: movementId }
        });

        if (!movement) {
            throw new Error(`Movimento ${movementId} não encontrado`);
        }

        // Preparar dados para chamada do webhook
        const webhookData = {
            movement_id: movementId
        };

        const webhookUrl = process.env.N8N_NFSE_WEBHOOK_URL;
        
        if (!webhookUrl) {
            throw new Error('URL do webhook de NFSe não configurada');
        }

        try {
            const response = await axios.post(webhookUrl, webhookData, {
                headers: {
                    'Authorization': `Bearer ${process.env.N8N_WEBHOOK_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            // Processar resposta do webhook
            if (response.data && response.data.nfse_id) {
                // Criar registro na tabela de NFSe
                return await this.prisma.nfse.create({
                    data: {
                        invoice_id: response.data.invoice_id, // Assumindo que o webhook retorna o invoice_id
                        integration_nfse_id: response.data.nfse_id
                    }
                });
            }

            throw new Error('Falha ao gerar NFSe');
        } catch (error) {
            console.error('Erro ao chamar webhook de NFSe:', error);
            throw new Error(`Erro ao gerar NFSe: ${error.message}`);
        }
    }

    generateNfseAccessKey() {
        const randomPart = () => Math.random().toString(36).substring(2, 15);
        return `NFSe-${randomPart()}-${randomPart()}`.toUpperCase();
    }

    async createNfseTask(movementId) {
        // Converte para inteiro
        movementId = parseInt(movementId);

        // Busca movimento para validar existência
        const movement = await this.prisma.movements.findUnique({
            where: { movement_id: movementId }
        });

        if (!movement) {
            throw new Error(`Movimento ${movementId} não encontrado`);
        }

        // Criar tarefa assíncrona para geração de NFSe
        const asyncTask = await this.prisma.async_tasks.create({
            data: {
                task_type: 'GENERATE_NFSE',
                status: 'PENDING',
                payload: JSON.stringify({ movement_id: movementId }),
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        return asyncTask;
    }

    async processNfseTask(taskId) {
        // Busca a tarefa
        const task = await this.prisma.async_tasks.findUnique({
            where: { task_id: taskId }
        });

        if (!task) {
            throw new Error(`Tarefa ${taskId} não encontrada`);
        }

        if (task.status !== 'PENDING') {
            throw new Error(`Tarefa ${taskId} já processada`);
        }

        const payload = JSON.parse(task.payload);
        const movementId = payload.movement_id;

        try {
            // Preparar dados para chamada do webhook
            const webhookData = {
                movement_id: movementId
            };

            const webhookUrl = `${process.env.N8N_URL}/nuvemfiscal/nfse/emitir`;
            
            if (!webhookUrl) {
                throw new Error('URL do webhook de NFSe não configurada');
            }

            const response = await axios.post(webhookUrl, webhookData, {
                headers: {
                    'Authorization': `Bearer ${process.env.N8N_API_SECRET}`,
                    'Content-Type': 'application/json'
                }
            });

            // Processar resposta do webhook
            if (response.data && response.data.invoice_id) {
                // Atualizar tarefa como concluída
                await this.prisma.async_tasks.update({
                    where: { task_id: taskId },
                    data: {
                        status: 'COMPLETED',
                        result: JSON.stringify(response.data),
                        updated_at: new Date()
                    }
                });

                // Retorna o invoice_id gerado
                return response.data.invoice_id;
            }

            // Se não gerou invoice, marca como falha
            await this.prisma.async_tasks.update({
                where: { task_id: taskId },
                data: {
                    status: 'FAILED',
                    result: JSON.stringify({ error: 'Falha ao gerar NFSe' }),
                    updated_at: new Date()
                }
            });

            throw new Error('Falha ao gerar NFSe');
        } catch (error) {
            // Em caso de erro, marca a tarefa como falha
            await this.prisma.async_tasks.update({
                where: { task_id: taskId },
                data: {
                    status: 'FAILED',
                    result: JSON.stringify({ error: error.message }),
                    updated_at: new Date()
                }
            });

            console.error('Erro ao chamar webhook de NFSe:', error);
            throw new Error(`Erro ao gerar NFSe: ${error.message}`);
        }
    }
}

module.exports = PrismaMovementRepository;
