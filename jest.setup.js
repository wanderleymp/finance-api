// Configurações globais para os testes
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

// Configurar variáveis de ambiente de teste
dotenv.config({ path: '.env.test' });

// Configurar cliente Prisma para testes
const prisma = new PrismaClient();
global.prisma = prisma;

// Limpar dados do banco antes de cada teste
beforeEach(async () => {
  // Limpar dados de todas as tabelas
  await prisma.notification.deleteMany();
  await prisma.userActionLog.deleteMany();
  await prisma.user.deleteMany();
});

// Fechar conexão do Prisma após todos os testes
afterAll(async () => {
  await prisma.$disconnect();
});
