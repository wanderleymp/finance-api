require('dotenv').config();
const axios = require('axios');
const logger = require('../config/logger');
const BoletoService = require('../src/services/boletoRabbitMqService');

async function testSaleWithBoleto() {
    try {
        // 1. Criar uma venda
        logger.info('Criando venda...');
        const saleData = {
            movement_date: new Date(),
            person_id: 1,
            total_amount: 13.00,
            license_id: 1,
            items: [
                {
                    item_id: 1,
                    quantity: 1,
                    unit_price: 13.00,
                    total_price: 13.00
                }
            ]
        };

        const saleResponse = await axios.post('http://localhost:3000/sales', saleData);
        const sale = saleResponse.data;
        logger.info('Venda criada:', sale);

        // 2. Gerar boleto
        logger.info('Gerando boleto...');
        const result = await BoletoService.publishBoletoGenerationTask(sale.movement_id, new Date());
        logger.info('Boleto agendado:', result);

        // 3. Processar a fila por no máximo 10 segundos
        logger.info('Processando fila de boletos (timeout: 10s)...');
        const timeout = setTimeout(() => {
            logger.info('Timeout atingido, parando processamento...');
            process.exit(0);
        }, 10000);

        try {
            await BoletoService.processBoletoGenerationQueue();
        } catch (error) {
            logger.error('Erro ao processar fila:', error);
        } finally {
            clearTimeout(timeout);
        }

        // 4. Verificar o status
        logger.info('Verificando status...');
        const status = await BoletoService.getBoletoStatus(result.task_id);
        logger.info('Status final:', status);

    } catch (error) {
        logger.error('Erro no teste:', error);
    } finally {
        process.exit(0);
    }
}

testSaleWithBoleto();
