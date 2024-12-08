const axios = require('axios');
const logger = require('../../config/logger');

async function callNfseWebhook(movement_id) {
    try {
        const webhookUrl = `${process.env.N8N_URL}/nuvemfiscal/nfse/emitir`;
        await axios.post(webhookUrl, { movement_id }, {
            headers: {
                'apikey': process.env.N8N_API_SECRET,
                'Content-Type': 'application/json'
            }
        });
        return true;
    } catch (error) {
        logger.error('Error calling NFSe webhook:', { 
            message: error.message,
            movement_id
        });
        throw error;
    }
}

module.exports = { callNfseWebhook };
