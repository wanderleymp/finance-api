const logger = require('../middlewares/logger').logger;
const { ValidationError } = require('../utils/errors');
const boletoRepository = require('../repositories/boletoRepository');

class BoletoService {
    async createBoleto(boletoData) {
        try {
            logger.info('Criando boleto', { boletoData });
            
            const defaultBoletoData = {
                ...boletoData,
                status: 'A Emitir'
            };

            const newBoleto = await boletoRepository.createBoleto(defaultBoletoData);
            
            logger.info('Boleto criado com sucesso', { 
                boletoId: newBoleto.boleto_id 
            });

            return newBoleto;
        } catch (error) {
            logger.error('Erro ao criar boleto', {
                boletoData,
                errorMessage: error.message
            });
            throw error;
        }
    }
}

module.exports = BoletoService;
