const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addBoletoProcess() {
    try {
        // Encontrar o tipo 'automatic'
        const automaticType = await prisma.processes_type.findFirst({
            where: { name: 'automatic' }
        });

        if (!automaticType) {
            console.error('Tipo de processo "automatic" não encontrado');
            return;
        }

        // Verificar se o processo já existe
        const existingProcess = await prisma.processes.findFirst({
            where: { name: 'Geração de Boleto' }
        });

        if (existingProcess) {
            console.log('Processo de geração de boleto já existe');
            return;
        }

        // Criar o processo
        const process = await prisma.processes.create({
            data: {
                name: 'Geração de Boleto',
                description: 'Processo para geração de boletos',
                type_id: automaticType.type_id
            }
        });

        console.log('Processo de boleto criado com sucesso:', process);
    } catch (error) {
        console.error('Erro ao criar processo:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addBoletoProcess();
