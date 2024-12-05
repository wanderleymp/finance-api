const PrismaBoletoRepository = require('../repositories/implementations/PrismaBoletoRepository');
const logger = require('../../config/logger');
const axios = require('axios');
const db = require('../../config/db'); // assuming db is defined in this file

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

exports.generateBoletoWebhook = async (req, res, params = {}) => {
    try {
        const movement_id = params.movement_id || req.body.movement_id;
        
        // Validar se existe parcela para este movimento
        const { rows } = await db.query(
            `SELECT i.installment_id 
             FROM installments i
             INNER JOIN movement_payments mp ON mp.payment_id = i.payment_id
             WHERE mp.movement_id = $1`,
            [movement_id]
        );

        if (!rows || rows.length === 0) {
            return res.status(400).json({ 
                error: 'Validação falhou',
                details: 'Não foi encontrada nenhuma parcela para esta venda. É necessário ter parcelas cadastradas para gerar o boleto.'
            });
        }
        
        const webhookBaseUrl = process.env.N8N_URL;
        const apiKey = process.env.N8N_API_SECRET;
        const webhookUrl = `${webhookBaseUrl}/vendas/boleto`;

        console.log('DEBUG: Enviando requisição para webhook:', {
            url: webhookUrl,
            movement_id,
            headers: { 'apikey': apiKey }
        });

        await axios.post(webhookUrl, 
            { movement_id },
            { headers: { 'apikey': apiKey } }
        );

        console.log('DEBUG: Requisição enviada com sucesso');
        res.json({ message: 'Solicitação de geração de boleto enviada com sucesso' });
    } catch (error) {
        console.error('Erro ao enviar para webhook:', error);
        console.error('Detalhes do erro:', {
            message: error.message,
            response: error.response?.data,
            config: {
                url: error.config?.url,
                headers: error.config?.headers,
                data: error.config?.data
            }
        });
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: 'Ocorreu um erro ao tentar gerar o boleto. Por favor, tente novamente.'
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
