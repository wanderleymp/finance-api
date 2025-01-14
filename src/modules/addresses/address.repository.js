const BaseRepository = require('../../repositories/base/BaseRepository');
const AddressResponseDTO = require('./dto/address-response.dto');
const { logger } = require('../../middlewares/logger');

class AddressRepository extends BaseRepository {
    constructor() {
        super('person_addresses', 'id');
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            logger.debug('Repository findAll - params:', {
                page,
                limit,
                filters
            });

            const result = await super.findAll(page, limit, filters);

            logger.debug('Repository findAll - base result:', {
                result
            });

            return {
                items: result.data ? result.data.map(AddressResponseDTO.fromDatabase) : [],
                meta: {
                    currentPage: result.page,
                    itemsPerPage: result.limit,
                    totalItems: result.total,
                    totalPages: Math.ceil(result.total / result.limit)
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar endereços', {
                error: error.message,
                filters,
                page,
                limit
            });
            throw error;
        }
    }

    async findById(id) {
        try {
            const result = await super.findById(id);
            return result ? AddressResponseDTO.fromDatabase(result) : null;
        } catch (error) {
            logger.error('Erro ao buscar endereço por ID', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async findByPersonId(personId) {
        try {
            const result = await super.findAll(1, 100, { person_id: personId });
            
            // Log adicional para debug
            logger.info('Debug: Resultado findAll no repository', { 
                personId, 
                result,
                resultItems: result?.items,
                resultType: typeof result,
                resultItemsType: typeof result?.items
            });

            // Adiciona verificação adicional
            if (!result) {
                logger.warn('Resultado de findAll é undefined', { personId });
                return [];
            }

            return result.items ? result.items.map(AddressResponseDTO.fromDatabase) : [];
        } catch (error) {
            logger.error('Erro ao buscar endereços da pessoa', {
                error: error.message,
                personId,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async create(data) {
        try {
            const result = await super.create(data);
            return AddressResponseDTO.fromDatabase(result);
        } catch (error) {
            logger.error('Erro ao criar endereço', {
                error: error.message,
                data
            });
            throw error;
        }
    }

    async update(id, data) {
        try {
            const result = await super.update(id, data);
            return result ? AddressResponseDTO.fromDatabase(result) : null;
        } catch (error) {
            logger.error('Erro ao atualizar endereço', {
                error: error.message,
                id,
                data
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            const result = await super.delete(id);
            return result ? AddressResponseDTO.fromDatabase(result) : null;
        } catch (error) {
            logger.error('Erro ao deletar endereço', {
                error: error.message,
                id
            });
            throw error;
        }
    }
}

module.exports = AddressRepository;
