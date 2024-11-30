const { PrismaClient } = require('@prisma/client');

async function addActiveToLicenses() {
    const prisma = new PrismaClient();
    
    try {
        // Executar SQL raw para adicionar a coluna
        await prisma.$executeRaw`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;`;
        
        console.log('Column added successfully');
        
    } catch (error) {
        console.error('Error adding column:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addActiveToLicenses();
