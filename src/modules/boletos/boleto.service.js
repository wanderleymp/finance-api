const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');
const IBoletoService = require('./interfaces/IBoletoService');
const IBoletoRepository = require('./interfaces/IBoletoRepository');
const ITaskService = require('../../interfaces/ITaskService');
const { BoletoResponseDTO } = require('./dto/boleto.dto');
const cacheService = require('../../services/cache.service');

class BoletoService extends IBoletoService {
    /**
     * @param {IBoletoRepository} boletoRepository Repositório de boletos
     * @param {ITaskService} taskService Serviço de tasks
     */
    constructor(boletoRepository, taskService) {
        super();
        this.boletoRepository = boletoRepository;
        this.taskService = taskService;
        this.cachePrefix = 'boletos';
        this.cacheTTL = {
            list: 300, // 5 minutos
            detail: 600 // 10 minutos
        };
    }

    /**
     * Lista boletos com paginação e filtros
     */
    async listBoletos(page, limit, filters) {
        try {
            logger.info('Serviço: Listando boletos', { page, limit, filters });
            
            const cacheKey = cacheService.generateKey(`${this.cachePrefix}:list`, {
                page,
                limit,
                ...filters
            });

            const result = await cacheService.getOrSet(
                cacheKey,
                async () => {
                    const data = await this.boletoRepository.findAll(page, limit, filters);
                    data.data = data.data.map(boleto => new BoletoResponseDTO(boleto));
                    return data;
                },
                this.cacheTTL.list
            );
            
            return result;
        } catch (error) {
            logger.error('Erro ao listar boletos no serviço', {
                error: error.message,
                filters
            });
            throw error;
        }
    }

    /**
     * Busca boleto por ID
     */
    async getBoletoById(id) {
        try {
            logger.info('Serviço: Buscando boleto por ID', { id });
            
            const cacheKey = cacheService.generateKey(`${this.cachePrefix}:detail`, { id });

            const boleto = await cacheService.getOrSet(
                cacheKey,
                async () => {
                    const data = await this.boletoRepository.findById(id);
                    if (!data) {
                        throw new ValidationError('Boleto não encontrado');
                    }
                    return new BoletoResponseDTO(data);
                },
                this.cacheTTL.detail
            );
            
            return boleto;
        } catch (error) {
            logger.error('Erro ao buscar boleto por ID no serviço', {
                error: error.message,
                boletoId: id
            });
            throw error;
        }
    }

    /**
     * Cria novo boleto
     */
    async createBoleto(boletoDTO) {
        try {
            logger.info('Serviço: Criando boleto', { boletoDTO });
            
            const boletoData = {
                ...boletoDTO,
                status: 'A Emitir'
            };

            const newBoleto = await this.boletoRepository.createBoleto(boletoData);
            
            // Criar tarefa assíncrona para emissão do boleto
            await this.taskService.createTask('BOLETO_GENERATION', {
                boleto_id: newBoleto.boleto_id
            });
            
            // Invalidar cache de listagem
            await cacheService.deletePattern(`${this.cachePrefix}:list:*`);
            
            logger.info('Boleto criado e enfileirado com sucesso', { 
                boletoId: newBoleto.boleto_id 
            });

            return new BoletoResponseDTO(newBoleto);
        } catch (error) {
            logger.error('Erro ao criar boleto no serviço', {
                error: error.message,
                boletoDTO
            });
            throw error;
        }
    }

    /**
     * Atualiza boleto
     */
    async updateBoleto(id, boletoDTO) {
        try {
            logger.info('Serviço: Atualizando boleto', { id, boletoDTO });
            
            const boleto = await this.boletoRepository.findById(id);
            if (!boleto) {
                throw new ValidationError('Boleto não encontrado');
            }

            // Validar se o boleto pode ser atualizado
            if (boleto.status !== 'A Emitir') {
                throw new ValidationError('Boleto não pode ser atualizado no status atual');
            }

            const updatedBoleto = await this.boletoRepository.update(id, boletoDTO);
            
            // Invalidar caches
            await cacheService.deletePattern(`${this.cachePrefix}:list:*`);
            await cacheService.delete(
                cacheService.generateKey(`${this.cachePrefix}:detail`, { id })
            );

            return new BoletoResponseDTO(updatedBoleto);
        } catch (error) {
            logger.error('Erro ao atualizar boleto no serviço', {
                error: error.message,
                boletoId: id,
                boletoDTO
            });
            throw error;
        }
    }

    /**
     * Emite boletos para um movimento
     */
    async emitirBoletosMovimento(movimentoId) {
        try {
            logger.info('Serviço: Iniciando emissão de boletos para movimento', { movimentoId });

            const parcelas = await this.boletoRepository.getParcelasMovimento(movimentoId);
            if (!parcelas || parcelas.length === 0) {
                throw new ValidationError('Movimento não possui parcelas para emissão de boletos');
            }

            const boletos = [];
            for (const parcela of parcelas) {
                const boletoDTO = {
                    installment_id: parcela.installment_id,
                    due_date: parcela.due_date,
                    amount: parcela.amount,
                    payer_id: parcela.payer_id,
                    description: `Parcela ${parcela.installment_number}/${parcela.total_installments}`
                };

                const boleto = await this.createBoleto(boletoDTO);
                boletos.push(boleto);
            }

            // Invalidar cache de listagem
            await cacheService.deletePattern(`${this.cachePrefix}:list:*`);

            logger.info('Boletos emitidos com sucesso', { 
                movimentoId,
                quantidadeBoletos: boletos.length
            });

            return boletos;
        } catch (error) {
            logger.error('Erro ao emitir boletos para movimento', {
                error: error.message,
                movimentoId
            });
            throw error;
        }
    }

    /**
     * Cancela boleto
     */
    async cancelBoleto(id, reason) {
        try {
            logger.info('Serviço: Cancelando boleto', { id, reason });
            
            const boleto = await this.boletoRepository.findById(id);
            if (!boleto) {
                throw new ValidationError('Boleto não encontrado');
            }

            // Validar se o boleto pode ser cancelado
            if (boleto.status === 'Pago') {
                throw new ValidationError('Boleto pago não pode ser cancelado');
            }

            if (boleto.status === 'Cancelado') {
                throw new ValidationError('Boleto já está cancelado');
            }

            const canceledBoleto = await this.boletoRepository.updateStatus(
                id, 
                'Cancelado',
                { reason }
            );

            // Invalidar caches
            await cacheService.deletePattern(`${this.cachePrefix}:list:*`);
            await cacheService.delete(
                cacheService.generateKey(`${this.cachePrefix}:detail`, { id })
            );

            return new BoletoResponseDTO(canceledBoleto);
        } catch (error) {
            logger.error('Erro ao cancelar boleto no serviço', {
                error: error.message,
                boletoId: id
            });
            throw error;
        }
    }
}

module.exports = BoletoService;
