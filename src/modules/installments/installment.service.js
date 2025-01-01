const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');
const CreateInstallmentDTO = require('./dto/create-installment.dto');
const UpdateInstallmentDTO = require('./dto/update-installment.dto');
const InstallmentResponseDTO = require('./dto/installment-response.dto');

class InstallmentService {
    constructor({ 
        installmentRepository, 
        cacheService,
        boletoService
    } = {}) {
        this.repository = installmentRepository;
        this.cacheService = cacheService;
        this.boletoService = boletoService;
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
            result.items = result.items.map(item => new InstallmentResponseDTO(item));
            
            await this.cacheService.set(cacheKey, result, this.cacheTTL.list);
            
            return result;
        } catch (error) {
            logger.error('Erro ao listar parcelas', { error });
            throw error;
        }
    }

    /**
     * Lista parcelas com detalhes (boletos)
     */
    async listInstallmentsWithDetails(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('Serviço: Listando parcelas com detalhes', { page, limit, filters });
            
            const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:details`, { page, limit, ...filters });
            const cached = await this.cacheService.get(cacheKey);
            
            if (cached) {
                logger.info('Cache hit: Retornando parcelas com detalhes do cache');
                return cached;
            }

            // Busca parcelas com boletos
            const result = await this.repository.findAllWithDetails(page, limit, filters);
            
            // Transforma os resultados em DTOs
            result.items = await Promise.all(result.items.map(async (item) => {
                const installmentResponse = new InstallmentResponseDTO(item);
                
                // Busca boletos da parcela
                const boletos = await this.boletoService.listBoletosByInstallmentId(item.installment_id);
                installmentResponse.boletos = boletos;
                
                return installmentResponse;
            }));
            
            await this.cacheService.set(cacheKey, result, this.cacheTTL.list);
            
            return result;
        } catch (error) {
            logger.error('Erro ao listar parcelas com detalhes', { error });
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
            const installment = await this.repository.createWithClient(client, {
                payment_id: dto.payment_id,
                installment_number: dto.installment_number,
                due_date: dto.due_date,
                amount: dto.amount,
                balance: dto.balance,
                status: dto.status,
                account_entry_id: dto.account_entry_id
            });

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

    async createInstallmentWithTransaction(client, data) {
        try {
            const dto = new CreateInstallmentDTO(data);
            dto.validate();

            const installment = await this.repository.createWithClient(client, {
                payment_id: dto.payment_id,
                installment_number: dto.installment_number,
                due_date: dto.due_date,
                amount: dto.amount,
                balance: dto.balance,
                status: dto.status,
                account_entry_id: dto.account_entry_id
            });

            return installment;
        } catch (error) {
            logger.error('Erro ao criar parcela', { error });
            throw error;
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

    async generateBoleto(installmentId) {
        try {
            logger.info('Service: Gerando boleto para parcela', { installmentId });

            // 1. Buscar parcela
            const installment = await this.repository.findById(installmentId);
            if (!installment) {
                throw new ValidationError('Parcela não encontrada');
            }

            // 2. Buscar dados do movimento/pagamento
            const payment = await this.repository.findPaymentByInstallmentId(installmentId);
            if (!payment) {
                throw new ValidationError('Pagamento não encontrado');
            }

            // 3. Gerar boleto
            const boletoData = {
                installment_id: installmentId,
                due_date: installment.due_date,
                amount: installment.amount,
                payer_id: payment.person_id,
                description: payment.description,
                status: 'A_EMITIR'
            };

            logger.info('Service: Criando boleto', { boletoData });

            const boleto = await this.boletoService.createBoleto(boletoData);

            return boleto;
        } catch (error) {
            logger.error('Service: Erro ao gerar boleto', {
                error: error.message,
                error_stack: error.stack,
                installmentId
            });
            throw error;
        }
    }
}

module.exports = InstallmentService;
