const { logger } = require('../../middlewares/logger');
const { PaymentMethodResponseDTO } = require('./dto/payment-method.dto');

class PaymentMethodService {
    constructor({ paymentMethodRepository, cacheService }) {
        this.paymentMethodRepository = paymentMethodRepository;
        this.cacheService = cacheService;
    }

    /**
     * Lista formas de pagamento com filtros
     */
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('Serviço: Listando formas de pagamento', { page, limit, filters });

            const cacheKey = `payment-methods:list:${page}:${limit}:${JSON.stringify(filters)}`;
            const result = await this.cacheService.getOrSet(
                cacheKey,
                async () => this.paymentMethodRepository.findAll(page, limit, filters),
                300 // 5 minutos
            );

            return {
                data: result.data.map(row => new PaymentMethodResponseDTO(row)),
                meta: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    pages: Math.ceil(result.total / result.limit)
                }
            };
        } catch (error) {
            logger.error('Erro ao listar formas de pagamento no serviço', {
                error: error.message,
                page,
                limit,
                filters
            });
            throw error;
        }
    }

    /**
     * Busca forma de pagamento por ID
     */
    async findById(id) {
        try {
            logger.info('Serviço: Buscando forma de pagamento', { id });

            const cacheKey = `payment-methods:${id}`;
            const result = await this.cacheService.getOrSet(
                cacheKey,
                async () => this.paymentMethodRepository.findById(id),
                300 // 5 minutos
            );

            if (!result) {
                return null;
            }

            return new PaymentMethodResponseDTO(result);
        } catch (error) {
            logger.error('Erro ao buscar forma de pagamento no serviço', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    /**
     * Cria uma nova forma de pagamento
     */
    async create(data) {
        try {
            logger.info('Serviço: Criando forma de pagamento', { data });

            const result = await this.paymentMethodRepository.create(data);
            await this.cacheService.invalidatePattern('payment-methods:*');

            return new PaymentMethodResponseDTO(result);
        } catch (error) {
            logger.error('Erro ao criar forma de pagamento no serviço', {
                error: error.message,
                data
            });
            throw error;
        }
    }

    /**
     * Atualiza uma forma de pagamento
     */
    async update(id, data) {
        try {
            logger.info('Serviço: Atualizando forma de pagamento', { id, data });

            const result = await this.paymentMethodRepository.update(id, data);
            if (!result) {
                return null;
            }

            await this.cacheService.invalidatePattern('payment-methods:*');
            return new PaymentMethodResponseDTO(result);
        } catch (error) {
            logger.error('Erro ao atualizar forma de pagamento no serviço', {
                error: error.message,
                id,
                data
            });
            throw error;
        }
    }

    /**
     * Remove uma forma de pagamento
     */
    async delete(id) {
        try {
            logger.info('Serviço: Removendo forma de pagamento', { id });

            const result = await this.paymentMethodRepository.delete(id);
            if (!result) {
                return null;
            }

            await this.cacheService.invalidatePattern('payment-methods:*');
            return new PaymentMethodResponseDTO(result);
        } catch (error) {
            logger.error('Erro ao remover forma de pagamento no serviço', {
                error: error.message,
                id
            });
            throw error;
        }
    }
}

module.exports = PaymentMethodService;
