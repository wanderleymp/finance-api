const PrismaBoletoRepository = require('../repositories/implementations/PrismaBoletoRepository');
const logger = require('../../config/logger');
const axios = require('axios');

const boletoRepository = new PrismaBoletoRepository();

// Função para buscar o movement_id de uma installment
async function getMovementIdFromInstallment(installmentId) {
    try {
        const installment = await boletoRepository.prisma.installments.findUnique({
            where: { installment_id: installmentId },
            include: { 
                movement_payment: { 
                    select: { movement_id: true } 
                } 
            }
        });

        if (!installment || !installment.movement_payment) {
            throw new Error('Installment or movement not found');
        }

        return installment.movement_payment.movement_id;
    } catch (error) {
        logger.error('Error getting movement ID from installment', { 
            installmentId, 
            error: error.message 
        });
        throw error;
    }
}

exports.createBoleto = async (req, res) => {
    try {
        logger.info('Create Boleto Request', { body: req.body });
        const boleto = await boletoRepository.create(req.body);
        res.status(201).json(boleto);
    } catch (error) {
        logger.error('Error creating boleto', { error: error.message });
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
};

exports.getBoletoById = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info('Get Boleto by ID', { id });
        const boleto = await boletoRepository.findById(parseInt(id));
        
        if (!boleto) {
            return res.status(404).json({ error: 'Boleto not found' });
        }
        
        res.json(boleto);
    } catch (error) {
        logger.error('Error getting boleto', { error: error.message });
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
};

exports.getAllBoletos = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10,
            ...filters 
        } = req.query;

        logger.info('Get All Boletos Request', { query: req.query });

        const skip = (page - 1) * limit;
        const result = await boletoRepository.findAll(filters, skip, parseInt(limit));
        
        res.json(result);
    } catch (error) {
        logger.error('Error getting boletos', { error: error.message });
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
};

exports.updateBoleto = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info('Update Boleto Request', { id, body: req.body });
        
        const boleto = await boletoRepository.update(parseInt(id), req.body);
        res.json(boleto);
    } catch (error) {
        logger.error('Error updating boleto', { error: error.message });
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
};

exports.deleteBoleto = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info('Delete Boleto Request', { id });
        
        await boletoRepository.delete(parseInt(id));
        res.status(204).send();
    } catch (error) {
        logger.error('Error deleting boleto', { error: error.message });
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
};

exports.generateBoletoWebhook = async (req, res) => {
    try {
        const { movement_id, installment_id } = req.body;

        logger.info('Recebendo solicitação de geração de boleto', {
            movement_id, 
            installment_id,
            user_id: req.user?.id,
            user_name: req.user?.username
        });

        const result = await boletoRepository.generateBoletoWebhook({ 
            movement_id, 
            installment_id 
        });

        logger.info('Boleto gerado com sucesso', {
            movement_id, 
            installment_id,
            result_id: result?.boleto_id
        });

        res.json(result);
    } catch (error) {
        logger.error('Erro na geração de boleto', { 
            movement_id, 
            installment_id,
            error: error.message, 
            stack: error.stack,
            user_id: req.user?.id,
            user_name: req.user?.username
        });

        // Erros de validação específicos
        if (error.message.includes('already exists')) {
            return res.status(400).json({ 
                error: 'Boleto já existe',
                details: 'Um boleto com status A_RECEBER já foi gerado para esta parcela.'
            });
        }

        if (error.message.includes('must be provided')) {
            return res.status(400).json({ 
                error: 'Parâmetros inválidos',
                details: 'É necessário fornecer movement_id ou installment_id para gerar o boleto.'
            });
        }

        if (error.message.includes('Movement has no installments')) {
            return res.status(400).json({ 
                error: 'Movimento sem parcelas',
                details: 'Não é possível gerar boleto para um movimento que não possui parcelas. Verifique se o movimento foi processado corretamente.'
            });
        }

        if (error.message.includes('Movement not found')) {
            return res.status(404).json({ 
                error: 'Movimento não encontrado',
                details: 'O movimento especificado não existe no sistema.'
            });
        }

        if (error.message.includes('Installment not found')) {
            return res.status(404).json({ 
                error: 'Parcela não encontrada',
                details: 'A parcela especificada não existe no sistema.'
            });
        }

        res.status(500).json({ 
            error: 'Erro interno do servidor', 
            details: 'Ocorreu um erro inesperado ao tentar gerar o boleto. Por favor, tente novamente.'
        });
    }
};

exports.cancelBoleto = async (req, res) => {
    try {
        const { installment_id } = req.body;
        
        if (!installment_id) {
            return res.status(400).json({ 
                error: 'installment_id is required' 
            });
        }

        const result = await boletoRepository.cancelBoleto(parseInt(installment_id));
        
        res.json(result);
    } catch (error) {
        logger.error('Error in cancelBoleto controller', { 
            error: error.message, 
            stack: error.stack 
        });

        if (error.message.includes('not found')) {
            return res.status(404).json({ 
                error: error.message 
            });
        }

        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
};
