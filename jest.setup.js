// Configurações globais para os testes
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

// Configurar variáveis de ambiente de teste
dotenv.config({ path: '.env.test' });

// Configurar cliente Prisma para testes
const prisma = new PrismaClient();

module.exports = async () => {
  // Configurações globais de setup
  global.prisma = prisma;

  // Limpar dados do banco antes de cada teste
  await prisma.notification.deleteMany();
  await prisma.userActionLog.deleteMany();
  await prisma.user.deleteMany();

  // Retornar uma função de teardown
  return async () => {
    // Fechar conexão do Prisma após todos os testes
    await prisma.$disconnect();
  };
};
