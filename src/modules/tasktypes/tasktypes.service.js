const { logger } = require('../../middlewares/logger');
const TaskTypesRepository = require('./tasktypes.repository');
const TaskTypesResponseDTO = require('./dto/tasktypes-response.dto');

class TaskTypesService {
    constructor() {
        this.repository = new TaskTypesRepository();
    }

    async create(data) {
        try {
            logger.info('Criando tipo de task', { data });
            const existingType = await this.repository.findByName(data.name);
            if (existingType) {
                throw new Error('Tipo de task já existe com este nome');
            }

            const result = await this.repository.create(data);
            return new TaskTypesResponseDTO(result);
        } catch (error) {
            logger.error('Erro ao criar tipo de task', {
                error: error.message,
                data
            });
            throw error;
        }
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            logger.info('Buscando tipos de task', { page, limit });
            const result = await this.repository.findAll(page, limit, filters);
            return {
                items: TaskTypesResponseDTO.toList(result.items),
                total: result.total,
                page,
                limit
            };
        } catch (error) {
            logger.error('Erro ao buscar tipos de task', {
                error: error.message,
                page,
                limit
            });
            throw error;
        }
    }

    async findById(id) {
        try {
            logger.info('Buscando tipo de task por ID', { id });
            const result = await this.repository.findById(id);
            if (!result) {
                throw new Error('Tipo de task não encontrado');
            }
            return new TaskTypesResponseDTO(result);
        } catch (error) {
            logger.error('Erro ao buscar tipo de task', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async update(id, data) {
        try {
            logger.info('Atualizando tipo de task', { id, data });
            if (data.name) {
                const existingType = await this.repository.findByName(data.name);
                if (existingType && existingType.type_id !== id) {
                    throw new Error('Já existe outro tipo de task com este nome');
                }
            }

            const result = await this.repository.update(id, data);
            if (!result) {
                throw new Error('Tipo de task não encontrado');
            }
            return new TaskTypesResponseDTO(result);
        } catch (error) {
            logger.error('Erro ao atualizar tipo de task', {
                error: error.message,
                id,
                data
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            logger.info('Deletando tipo de task', { id });
            const result = await this.repository.delete(id);
            if (!result) {
                throw new Error('Tipo de task não encontrado');
            }
            return true;
        } catch (error) {
            logger.error('Erro ao deletar tipo de task', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async getActiveTypes() {
        try {
            const result = await this.repository.getActiveTypes();
            return TaskTypesResponseDTO.toList(result);
        } catch (error) {
            logger.error('Erro ao buscar tipos de tasks ativos', {
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = TaskTypesService;
