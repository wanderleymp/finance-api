const ContractRecurringService = require('../service/contract-recurring.service');
const ContractRecurringRepository = require('../repository/contract-recurring.repository');
const MovementRepository = require('../../movements/movement.repository');
const MovementService = require('../../movements/movement.service');
const ContractAdjustmentHistoryRepository = require('../../contract-adjustment-history/repository/contract-adjustment-history.repository');
const MovementItemService = require('../../movement-items/movement-item.service');
const { logger } = require('../../../middlewares/logger');
const { systemDatabase } = require('../../../config/database');

class ContractRecurringController {
    constructor() {
        this.service = new ContractRecurringService(
            new ContractRecurringRepository(),
            new MovementRepository(),
            new MovementService({
                movementRepository: new MovementRepository()
            }),
            new ContractAdjustmentHistoryRepository(),
            logger
        );
        this.logger = logger;
        this.movementItemService = new MovementItemService();
    }

    async findAll(req, res, next) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            const result = await this.service.findAll(Number(page), Number(limit), filters);
            
            logger.info('Contratos recorrentes listados', { 
                page, 
                limit, 
                totalItems: result.meta.totalItems 
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async findById(req, res, next) {
        try {
            const { id } = req.params;
            const result = await this.service.findById(Number(id));
            
            logger.info('Contrato recorrente encontrado', { id });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async create(req, res, next) {
        try {
            const result = await this.service.create(req.body);
            
            this.logger.info('Contrato recorrente criado', { 
                data: result 
            });

            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const { id } = req.params;
            const result = await this.service.update(Number(id), req.body);
            
            logger.info('Contrato recorrente atualizado', { 
                id,
                name: result.contract_name 
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await this.service.delete(Number(id));
            
            logger.info('Contrato recorrente removido', { id });

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async findPendingBillings(req, res, next) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const currentDate = new Date();
            
            const result = await this.service.findPendingBillings(
                Number(page), 
                Number(limit), 
                currentDate
            );
            
            logger.info('Contratos pendentes listados', { 
                page, 
                limit, 
                totalItems: result.meta.totalItems 
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async processBilling(req, res, next) {
        try {
            const contractIds = req.body.body || req.body;

            if (!Array.isArray(contractIds)) {
                return res.status(400).json({ error: 'Lista de contratos inválida' });
            }

            const result = await this.service.billing(contractIds);
            
            logger.info('Processamento de faturamento concluído', { 
                totalContracts: contractIds.length 
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async processSingleContractBilling(req, res, next) {
        try {
            const { id } = req.params;
            
            const result = await this.service.billing([Number(id)]);
            
            logger.info('Processamento de faturamento para contrato específico', { 
                contractId: id 
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async contractAdjustment(req, res, next) {
        try {
            const { contractIds } = req.body;

            if (!contractIds || !Array.isArray(contractIds) || contractIds.length === 0) {
                return res.status(400).json({ error: 'Lista de contratos inválida' });
            }

            const result = await this.service.contractAdjustment(contractIds);

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async processSingleContractAdjustment(req, res) {
        try {
            // Extrair dados do corpo da requisição
            const { 
                adjustmentMode, 
                adjustmentType, 
                adjustmentValue, 
                description 
            } = req.body;

            // Extrair ID do contrato dos parâmetros da rota
            const { id } = req.params;

            // Recuperar ID do usuário do token JWT
            const changedBy = req.user ? req.user.userId : null;

            // Garantir que changedBy seja um número
            const changedById = changedBy ? Number(changedBy) : null;

            this.logger.info('Dados de ajuste de contrato', {
                contractId: id,
                changedBy,
                changedById,
                userInfo: req.user
            });

            // Processar ajuste do contrato
            const adjustmentResult = await this.service.processContractAdjustment(
                id, 
                adjustmentValue, 
                adjustmentType, 
                adjustmentMode,
                changedById,
                description
            );

            // Retornar resultado do ajuste
            return res.status(200).json(adjustmentResult);

        } catch (error) {
            // Log do erro
            this.logger.error(`Erro no ajuste de contrato: ${error.message}`);

            // Retornar erro
            return res.status(500).json({
                message: 'Erro ao processar ajuste de contrato',
                error: error.message
            });
        }
    }

    async processBatchContractAdjustment(req, res, next) {
        try {
            const payload = req.body;
            
            // Log da requisição de ajuste em lote
            this.logger.info('Requisição de ajuste em lote de contratos', { 
                payload 
            });

            const result = await this.service.processContractAdjustmentBatch(payload);
            
            // Log do resultado
            this.logger.info('Ajuste em lote de contratos processado', { 
                totalContracts: result.length,
                successCount: result.filter(r => r.success).length,
                failureCount: result.filter(r => !r.success).length
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async updateContractItem(req, res, next) {
        try {
            const { contractId, movementItemId } = req.params;
            const { item_id, quantidade, valorUnitario } = req.body;

            // Validar se o item pertence ao movimento do contrato
            const movementItem = await this.movementItemService.findById(movementItemId);
            
            if (movementItem.item_id !== item_id) {
                throw new Error('Item de movimento não corresponde ao item informado');
            }

            // Usar MovementItemService para atualizar o item
            await this.movementItemService.update(movementItemId, {
                quantity: quantidade,
                unit_price: valorUnitario
            });

            // Buscar o contrato atualizado com todos os detalhes
            const updatedContract = await this.service.findById(Number(contractId));

            // Retornar o contrato completo
            res.json(updatedContract);
        } catch (error) {
            next(error);
        }
    }

    async updateContractRecurringItem(req, res, next) {
        try {
            const { id, movementItemId } = req.params;
            const result = await this.service.updateContractRecurringItem(Number(id), Number(movementItemId), req.body);
            
            this.logger.info('Item de contrato recorrente atualizado', {
                contractId: id,
                movementItemId,
                result
            });
            
            res.json(result);
        } catch (error) {
            this.logger.error('Erro ao atualizar item de contrato recorrente', {
                error: error.message,
                stack: error.stack
            });
            next(error);
        }
    }

    async adjustBillingDate(req, res) {
        try {
            const { id } = req.params;
            const { next_billing_date, description } = req.body;
            
            // Recuperar ID do usuário do token JWT
            const changedBy = req.user ? req.user.userId : null;

            const result = await this.service.adjustBillingDate(
                Number(id),
                next_billing_date,
                description,
                changedBy
            );

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Encerra um contrato recorrente, atualizando seu status para 'inactive',
     * definindo a data de encerramento e registrando o motivo no histórico.
     */
    async terminateContract(req, res, next) {
        try {
            const { id } = req.params;
            const { endDate, reason } = req.body;
            
            // Extrair ID do usuário do token JWT
            const changedBy = req.user.userId;

            this.logger.info('Requisição de encerramento de contrato recebida', { 
                contractId: id, 
                endDate, 
                reason,
                changedBy 
            });

            const result = await this.service.terminateContract(id, { 
                endDate, 
                reason, 
                changedBy 
            });

            // Se o contrato já estava inativo, retorna 200 com mensagem informativa
            if (result.wasAlreadyInactive) {
                return res.status(200).json({
                    message: 'Contrato já estava inativo. Histórico de ajuste registrado.',
                    contract: result.contract,
                    adjustmentHistory: result.adjustmentHistory
                });
            }

            // Para novos encerramentos, retorna 200 com detalhes
            return res.status(200).json({
                message: 'Contrato encerrado com sucesso',
                contract: result.contract,
                adjustmentHistory: result.adjustmentHistory
            });
        } catch (error) {
            this.logger.error('Erro ao processar encerramento de contrato', {
                errorMessage: error.message,
                errorStack: error.stack
            });

            // Tratamento de erro padrão
            next(error);
        }
    }
}

module.exports = ContractRecurringController;
