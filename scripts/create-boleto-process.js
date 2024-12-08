const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createBoletoProcess() {
    try {
        // Buscar o tipo 'automatic'
        const automaticType = await prisma.processes_type.findFirst({
            where: { name: 'automatic' }
        });

        if (!automaticType) {
            console.error('Tipo de processo "automatic" não encontrado');
            return;
        }

        // Buscar o status 'active' ou criar um padrão
        let activeStatus = await prisma.processes_status.findFirst({
            where: { name: 'active' }
        });

        if (!activeStatus) {
            activeStatus = await prisma.processes_status.create({
                data: {
                    name: 'active',
                    is_default: true
                }
            });
        }

        // Buscar o modo 'automatic' ou criar um padrão
        let automaticStartMode = await prisma.processes_start_mode.findFirst({
            where: { name: 'automatic' }
        });

        if (!automaticStartMode) {
            automaticStartMode = await prisma.processes_start_mode.create({
                data: {
                    name: 'automatic',
                    is_default: true
                }
            });
        }

        // Verificar se o processo já existe
        const existingProcess = await prisma.processes.findFirst({
            where: { name: 'Geração de Boleto' }
        });

        if (existingProcess) {
            console.log('Processo já existe:', existingProcess);
            return;
        }

        // Criar o processo
        const process = await prisma.processes.create({
            data: {
                name: 'Geração de Boleto',
                description: 'Processo para geração de boletos',
                type_id: automaticType.type_id,
                status_id: activeStatus.status_id,
                start_mode_id: automaticStartMode.start_mode_id
            }
        });

        console.log('Processo criado:', process);
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createBoletoProcess();
