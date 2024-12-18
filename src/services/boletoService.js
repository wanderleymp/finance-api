const logger = require('../middlewares/logger').logger;
const { ValidationError } = require('../utils/errors');
const boletoRepository = require('../repositories/boletoRepository');
const PaginationHelper = require('../utils/paginationHelper');

class BoletoService {
    async listBoletos(page = 1, limit = 10, filters = {}) {
        try {
            const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);
            
            // Preparar filtros dinâmicos
            const dynamicFilters = {};
            
            if (filters.installment_id) {
                dynamicFilters.installment_id = filters.installment_id;
            }
            
            if (filters.status) {
                dynamicFilters.status = filters.status;
            }
            
            const boletos = await boletoRepository.findAll(validPage, validLimit, dynamicFilters);
            
            logger.info('Serviço: Listagem de boletos', {
                totalBoletos: boletos.total,
                page: validPage,
                limit: validLimit,
                filters: dynamicFilters
            });

            return PaginationHelper.formatResponse(
                boletos.data, 
                boletos.total, 
                validPage, 
                validLimit
            );
        } catch (error) {
            logger.error('Erro no serviço ao listar boletos', {
                errorMessage: error.message,
                page,
                limit,
                filters
            });
            throw error;
        }
    }

    async getBoletoById(boletoId) {
        try {
            const boleto = await boletoRepository.findById(boletoId);
            
            if (!boleto) {
                throw new ValidationError('Boleto não encontrado');
            }
            
            logger.info('Serviço: Detalhes do boleto', {
                boletoId
            });

            return boleto;
        } catch (error) {
            logger.error('Erro no serviço ao buscar boleto', {
                errorMessage: error.message,
                boletoId
            });
            throw error;
        }
    }

    async createBoleto(boletoData) {
        try {
            // Validações podem ser adicionadas aqui
            
            logger.info('Serviço: Criando novo boleto', { 
                installmentId: boletoData.installment_id,
                status: boletoData.status
            });

            return await boletoRepository.createBoleto(boletoData);
        } catch (error) {
            logger.error('Erro no serviço ao criar boleto', {
                errorMessage: error.message,
                boletoData
            });
            throw error;
        }
    }

    async updateBoleto(boletoId, updateData) {
        try {
            // Verificar se o boleto existe antes de atualizar
            await this.getBoletoById(boletoId);

            logger.info('Serviço: Atualizando boleto', { 
                boletoId, 
                updatedFields: Object.keys(updateData)
            });

            return await boletoRepository.updateBoleto(boletoId, updateData);
        } catch (error) {
            logger.error('Erro no serviço ao atualizar boleto', {
                errorMessage: error.message,
                boletoId,
                updateData
            });
            throw error;
        }
    }

    async deleteBoleto(boletoId, installmentId = null) {
        try {
            // Verificar se o boleto existe e pertence à installment (se especificada)
            const boleto = await this.getBoletoById(boletoId);
            
            if (installmentId && boleto.installment_id !== installmentId) {
                throw new ValidationError('Boleto não pertence à parcela especificada');
            }

            logger.info('Serviço: Deletando boleto', { 
                boletoId, 
                installmentId 
            });

            return await boletoRepository.deleteBoleto(boletoId);
        } catch (error) {
            logger.error('Erro no serviço ao deletar boleto', {
                errorMessage: error.message,
                boletoId,
                installmentId
            });
            throw error;
        }
    }

    // Métodos auxiliares para geração de códigos
    generateCodigoBarras() {
        // Implementação simplificada para geração de código de barras
        const randomPart = Math.random().toString(36).substring(2, 15);
        return `${new Date().getFullYear()}${randomPart}`.substring(0, 44);
    }

    generateLinhaDigitavel() {
        // Implementação simplificada para geração de linha digitável
        const randomPart = Math.random().toString(36).substring(2, 15);
        return `${new Date().getFullYear()}${randomPart}`.substring(0, 47);
    }
}

module.exports = new BoletoService();
