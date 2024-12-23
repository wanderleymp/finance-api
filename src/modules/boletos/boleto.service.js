const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');
const { BoletoResponseDTO } = require('./dto/boleto.dto');

class BoletoService {
    constructor({ 
        boletoRepository, 
        n8nService,
        taskService,
        cacheService 
    }) {
        this.repository = boletoRepository;
        this.n8nService = n8nService;
        this.taskService = taskService;
        this.cacheService = cacheService;
        this.cachePrefix = 'boletos';
        this.cacheTTL = {
            list: 300, // 5 minutos
            detail: 600 // 10 minutos
        };
    }

    /**
     * Lista boletos com paginação e filtros
     */
    async listBoletos(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('Serviço: Listando boletos', { page, limit, filters });
            
            const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:list`, {
                page,
                limit,
                ...filters
            });

            const cached = await this.cacheService.get(cacheKey);
            if (cached) {
                logger.info('Cache hit: Retornando boletos do cache');
                return cached;
            }

            const result = await this.repository.findAll(page, limit, filters);
            result.data = result.data.map(boleto => new BoletoResponseDTO(boleto));
            
            await this.cacheService.set(cacheKey, result, this.cacheTTL.list);
            return result;
        } catch (error) {
            logger.error('Erro ao listar boletos', { error });
            throw error;
        }
    }

    /**
     * Busca boleto por ID
     */
    async getBoletoById(id) {
        try {
            logger.info('Serviço: Buscando boleto por ID', { id });

            const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:detail`, { id });
            const cached = await this.cacheService.get(cacheKey);
            
            if (cached) {
                logger.info('Cache hit: Retornando boleto do cache');
                return cached;
            }

            const boleto = await this.repository.findById(id);
            if (!boleto) {
                throw new ValidationError('Boleto não encontrado');
            }

            const result = new BoletoResponseDTO(boleto);
            await this.cacheService.set(cacheKey, result, this.cacheTTL.detail);
            return result;
        } catch (error) {
            logger.error('Erro ao buscar boleto', { error });
            throw error;
        }
    }

    /**
     * Cria um novo boleto
     */
    async createBoleto(data) {
        try {
            logger.info('Serviço: Criando boleto', { data });

            const boleto = await this.repository.createBoleto(data);
            
            // Limpa o cache de listagem
            const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:list`);
            await this.cacheService.del(cacheKey);

            // Cria tarefa para emitir boleto no N8N
            await this.taskService.createTask('emitir_boleto', {
                boletoId: boleto.boleto_id
            });

            return new BoletoResponseDTO(boleto);
        } catch (error) {
            logger.error('Erro ao criar boleto', { error });
            throw error;
        }
    }

    /**
     * Atualiza um boleto existente
     */
    async updateBoleto(id, data) {
        try {
            logger.info('Serviço: Atualizando boleto', { id, data });

            const boleto = await this.repository.findById(id);
            if (!boleto) {
                throw new ValidationError('Boleto não encontrado');
            }

            const updatedBoleto = await this.repository.updateBoleto(id, data);

            // Limpa os caches
            await Promise.all([
                this.cacheService.del(this.cacheService.generateKey(`${this.cachePrefix}:list`)),
                this.cacheService.del(this.cacheService.generateKey(`${this.cachePrefix}:detail`, { id }))
            ]);

            return new BoletoResponseDTO(updatedBoleto);
        } catch (error) {
            logger.error('Erro ao atualizar boleto', { error });
            throw error;
        }
    }

    /**
     * Cancela um boleto
     */
    async cancelBoleto(id, data) {
        try {
            logger.info('Serviço: Cancelando boleto', { id, data });

            const boleto = await this.repository.findById(id);
            if (!boleto) {
                throw new ValidationError('Boleto não encontrado');
            }

            const updatedBoleto = await this.repository.updateBoleto(id, {
                status: 'Cancelado',
                cancellation_reason: data.reason
            });

            // Limpa os caches
            await Promise.all([
                this.cacheService.del(this.cacheService.generateKey(`${this.cachePrefix}:list`)),
                this.cacheService.del(this.cacheService.generateKey(`${this.cachePrefix}:detail`, { id }))
            ]);

            // Cria tarefa para cancelar boleto no N8N
            await this.taskService.createTask('cancelar_boleto', {
                boletoId: id,
                reason: data.reason
            });

            return new BoletoResponseDTO(updatedBoleto);
        } catch (error) {
            logger.error('Erro ao cancelar boleto', { error });
            throw error;
        }
    }
}

module.exports = BoletoService;
