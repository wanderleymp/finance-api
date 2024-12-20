const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');
const IMovementPaymentService = require('./interfaces/IMovementPaymentService');
const { MovementPaymentResponseDTO } = require('./dto/movement-payment.dto');

class MovementPaymentService extends IMovementPaymentService {
    /**
     * @param {Object} params
     * @param {import('../../repositories/movementPaymentsRepository')} params.movementPaymentsRepository
     * @param {import('../../services/cache.service')} params.cacheService
     */
    constructor({ movementPaymentsRepository, cacheService }) {
        super();
        this.movementPaymentsRepository = movementPaymentsRepository;
        this.cacheService = cacheService;
        this.cachePrefix = 'movement-payments';
        this.cacheTTL = {
            list: 300, // 5 minutos
            detail: 600 // 10 minutos
        };
    }

    /**
     * Busca pagamento por ID
     */
    async getPaymentById(id) {
        try {
            logger.info('Serviço: Buscando pagamento por ID', { id });
            
            const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:detail`, { id });

            const payment = await this.cacheService.getOrSet(
                cacheKey,
                async () => {
                    const data = await this.movementPaymentsRepository.findById(id);
                    if (!data) {
                        throw new ValidationError('Pagamento não encontrado');
                    }
                    return new MovementPaymentResponseDTO(data);
                },
                this.cacheTTL.detail
            );
            
            return payment;
        } catch (error) {
            logger.error('Erro ao buscar pagamento por ID no serviço', {
                error: error.message,
                paymentId: id
            });
            throw error;
        }
    }

    /**
     * Lista pagamentos com paginação e filtros
     */
    async listPayments(page, limit, filters) {
        try {
            logger.info('Serviço: Listando pagamentos', { page, limit, filters });
            
            const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:list`, {
                page,
                limit,
                ...filters
            });

            const result = await this.cacheService.getOrSet(
                cacheKey,
                async () => {
                    const data = await this.movementPaymentsRepository.findAll(page, limit, filters);
                    data.data = data.data.map(payment => new MovementPaymentResponseDTO(payment));
                    return data;
                },
                this.cacheTTL.list
            );
            
            return result;
        } catch (error) {
            logger.error('Erro ao listar pagamentos no serviço', {
                error: error.message,
                filters
            });
            throw error;
        }
    }
}

module.exports = MovementPaymentService;
