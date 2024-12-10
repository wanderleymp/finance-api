const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function checkPersonTable() {
    try {
        const result = await prisma.$queryRaw `
      SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Person';
    `;
        console.log(result);
    }
    catch (error) {
        console.error('Erro ao verificar tabela:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
checkPersonTable();
//# sourceMappingURL=check_person_table.js.map