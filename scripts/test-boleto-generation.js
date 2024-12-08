const boletoService = require('../src/services/boletoRabbitMqService');
const { PrismaClient } = require('@prisma/client');

async function testBoletoGeneration() {
    const prisma = new PrismaClient();
    
    try {
        // Verificar se o processo existe
        const process = await prisma.processes.findFirst({
            where: { name: 'Geração de Boleto' }
        });
        
        console.log('Processo encontrado:', process);

        // Gerar boleto para o movimento ID 1 (ou substitua pelo ID desejado)
        console.log('\nAgendando geração de boleto...');
        const result = await boletoService.publishBoletoGenerationTask(1);
        
        console.log('\nBoleto agendado:', result);
        
        // Consultar o status inicial
        console.log('\nConsultando status inicial...');
        const status = await boletoService.getBoletoStatus(result.task_id);
        console.log('Status:', status);
        
        // Iniciar o processamento da fila
        console.log('\nIniciando processamento da fila...');
        await boletoService.processBoletoGenerationQueue();
    } catch (error) {
        console.error('Erro ao testar geração de boleto:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testBoletoGeneration();
