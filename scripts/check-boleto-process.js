const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBoletoProcess() {
    try {
        // Verificar processo
        const process = await prisma.processes.findFirst({
            where: { name: 'Geração de Boleto' }
        });

        console.log('Processo encontrado:', process);

        // Verificar status
        const statuses = await prisma.tasks_status.findMany();
        console.log('\nStatus disponíveis:', statuses);

        // Verificar modos de execução
        const modes = await prisma.tasks_execution_mode.findMany();
        console.log('\nModos de execução:', modes);

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkBoletoProcess();
