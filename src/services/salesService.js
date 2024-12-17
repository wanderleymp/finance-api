const { logger } = require('../middlewares/logger');
const MovementsService = require('./movementsService');

class SalesService {
    constructor() {
        this.movementsService = new MovementsService();
        this.MOVEMENT_TYPE_ID_SALES = 1; // Tipo de movimento para vendas
    }

    async create(saleData) {
        try {
            logger.info('Criando nova venda', { 
                data: saleData 
            });

            // Adiciona movement_type_id de vendas
            const movementData = {
                ...saleData,
                movement_type_id: this.MOVEMENT_TYPE_ID_SALES
            };

            // Delega criação para movementsService
            const movement = await this.movementsService.create(movementData);

            logger.info('Venda criada com sucesso', { 
                movementId: movement.movement_id 
            });

            return movement;
        } catch (error) {
            logger.error('Erro ao criar venda', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async list(filters = {}, page = 1, limit = 10) {
        try {
            logger.info('Listando vendas', { 
                filters, 
                page, 
                limit 
            });

            const result = await this.movementsService.list(
                { ...filters, movement_type_id: this.MOVEMENT_TYPE_ID_SALES }, 
                page, 
                limit
            );

            logger.info('Listagem de vendas concluída', { 
                count: result.data.length,
                total: result.total
            });

            return result;
        } catch (error) {
            logger.error('Erro ao listar vendas', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async getById(id) {
        try {
            logger.info('Buscando venda por ID', { id });

            const sale = await this.movementsService.getById(
                id, 
                this.MOVEMENT_TYPE_ID_SALES
            );

            if (!sale) {
                const error = new Error('Venda não encontrada');
                error.status = 404;
                throw error;
            }

            return sale;
        } catch (error) {
            logger.error('Erro ao buscar venda', {
                errorMessage: error.message,
                errorStack: error.stack,
                id
            });
            throw error;
        }
    }

    async update(id, updateData) {
        try {
            logger.info('Atualizando venda', { 
                id, 
                data: updateData 
            });

            const updatedMovement = await this.movementsService.update(
                id, 
                {
                    ...updateData,
                    movement_type_id: this.MOVEMENT_TYPE_ID_SALES
                }
            );

            logger.info('Venda atualizada com sucesso', { 
                movementId: updatedMovement.movement_id 
            });

            return updatedMovement;
        } catch (error) {
            logger.error('Erro ao atualizar venda', {
                errorMessage: error.message,
                errorStack: error.stack,
                id
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            logger.info('Deletando venda', { id });

            const deletedMovement = await this.movementsService.delete(
                id, 
                this.MOVEMENT_TYPE_ID_SALES
            );

            logger.info('Venda deletada com sucesso', { 
                movementId: id 
            });

            return deletedMovement;
        } catch (error) {
            logger.error('Erro ao deletar venda', {
                errorMessage: error.message,
                errorStack: error.stack,
                id
            });
            throw error;
        }
    }
}

module.exports = SalesService;
