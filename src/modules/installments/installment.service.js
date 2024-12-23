const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');
const CreateInstallmentDTO = require('./dto/create-installment.dto');
const UpdateInstallmentDTO = require('./dto/update-installment.dto');
const InstallmentResponseDTO = require('./dto/installment-response.dto');

class InstallmentService {
    constructor({ 
        installmentRepository, 
        cacheService
    } = {}) {
        this.repository = installmentRepository;
        this.cacheService = cacheService;
        this.cachePrefix = 'installments';
        this.cacheTTL = {
            list: 300, // 5 minutos
            detail: 600 // 10 minutos
        };
    }

    async listInstallments(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('Serviço: Listando parcelas', { page, limit, filters });
            
            const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:list`, { page, limit, ...filters });
            const cached = await this.cacheService.get(cacheKey);
            
            if (cached) {
                logger.info('Cache hit: Retornando parcelas do cache');
                return cached;
            }

            const result = await this.repository.findAll(page, limit, filters);
            
            // Transforma os resultados em DTOs
            result.data = result.data.map(item => new InstallmentResponseDTO(item));
            
            await this.cacheService.set(cacheKey, result, this.cacheTTL.list);
            
            return result;
        } catch (error) {
            logger.error('Erro ao listar parcelas', { error });
            throw error;
        }
    }

    async getInstallmentById(id) {
        try {
            logger.info('Serviço: Buscando parcela por ID', { id });
            
            const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:detail`, { id });
            const cached = await this.cacheService.get(cacheKey);
            
            if (cached) {
                logger.info('Cache hit: Retornando parcela do cache');
                return cached;
            }

            const installment = await this.repository.findById(id);
            
            if (!installment) {
                throw new ValidationError('Parcela não encontrada');
            }
            
            const response = new InstallmentResponseDTO(installment);
            await this.cacheService.set(cacheKey, response, this.cacheTTL.detail);
            
            return response;
        } catch (error) {
            logger.error('Erro ao buscar parcela', { error });
            throw error;
        }
    }

    async createInstallment(data) {
        const client = await this.repository.pool.connect();
        try {
            await client.query('BEGIN');

            // Criar DTO e validar
            const dto = new CreateInstallmentDTO(data);
            dto.validate();

            // Criar parcela
            const installment = await this.repository.create(dto);

            await client.query('COMMIT');

            // Invalidar cache
            await this.cacheService.del(`${this.cachePrefix}:list:*`);
            
            return new InstallmentResponseDTO(installment);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro ao criar parcela', { error });
            throw error;
        } finally {
            client.release();
        }
    }

    async updateInstallment(id, data) {
        const client = await this.repository.pool.connect();
        try {
            await client.query('BEGIN');

            // Verificar se parcela existe
            const existing = await this.repository.findById(id);
            if (!existing) {
                throw new ValidationError('Parcela não encontrada');
            }

            // Criar DTO e validar
            const dto = new UpdateInstallmentDTO(data);
            dto.validate();

            // Atualizar parcela
            const updated = await this.repository.update(id, dto);

            await client.query('COMMIT');

            // Invalidar cache
            await this.cacheService.del(`${this.cachePrefix}:list:*`);
            await this.cacheService.del(`${this.cachePrefix}:detail:${id}`);
            
            return new InstallmentResponseDTO(updated);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro ao atualizar parcela', { error });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = InstallmentService;
