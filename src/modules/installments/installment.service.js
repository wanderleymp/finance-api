const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');
const IInstallmentService = require('./interfaces/IInstallmentService');
const { InstallmentResponseDTO } = require('./dto/installment.dto');

class InstallmentService extends IInstallmentService {
    /**
     * @param {Object} params
     * @param {import('../../repositories/installmentRepository')} params.installmentRepository
     * @param {import('../../services/cache.service')} params.cacheService
     */
    constructor({ installmentRepository, cacheService }) {
        super();
        this.installmentRepository = installmentRepository;
        this.cacheService = cacheService;
        this.cachePrefix = 'installments';
        this.cacheTTL = {
            list: 300, // 5 minutos
            detail: 600 // 10 minutos
        };
    }

    /**
     * Busca parcela por ID
     */
    async getInstallmentById(id) {
        try {
            logger.info('Serviço: Buscando parcela por ID', { id });
            
            const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:detail`, { id });

            const installment = await this.cacheService.getOrSet(
                cacheKey,
                async () => {
                    const data = await this.installmentRepository.findById(id);
                    if (!data) {
                        throw new ValidationError('Parcela não encontrada');
                    }
                    return new InstallmentResponseDTO(data);
                },
                this.cacheTTL.detail
            );
            
            return installment;
        } catch (error) {
            logger.error('Erro ao buscar parcela por ID no serviço', {
                error: error.message,
                installmentId: id
            });
            throw error;
        }
    }

    /**
     * Lista parcelas com paginação e filtros
     */
    async listInstallments(page, limit, filters) {
        try {
            logger.info('Serviço: Listando parcelas', { page, limit, filters });
            
            const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:list`, {
                page,
                limit,
                ...filters
            });

            const result = await this.cacheService.getOrSet(
                cacheKey,
                async () => {
                    const data = await this.installmentRepository.findAll(page, limit, filters);
                    data.data = data.data.map(installment => new InstallmentResponseDTO(installment));
                    return data;
                },
                this.cacheTTL.list
            );
            
            return result;
        } catch (error) {
            logger.error('Erro ao listar parcelas no serviço', {
                error: error.message,
                filters
            });
            throw error;
        }
    }
}

module.exports = InstallmentService;
