const messagingService = require('../services/messagingService');
const logger = require('../../config/logger');

exports.sendInvoiceMessage = async (req, res) => {
    try {
        const { movement_id } = req.body;

        if (!movement_id) {
            return res.status(400).json({ 
                error: 'Movement ID is required' 
            });
        }

        const result = await messagingService.sendInvoiceMessage(movement_id);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        logger.error('Error in sendInvoiceMessage controller', { 
            error: error.message 
        });
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

exports.sendInstallmentMessage = async (req, res) => {
    try {
        const { installment_id } = req.body;

        if (!installment_id) {
            return res.status(400).json({ 
                error: 'Installment ID is required' 
            });
        }

        const result = await messagingService.sendInstallmentMessage(installment_id);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        logger.error('Error in sendInstallmentMessage controller', { 
            error: error.message 
        });
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};
