import { PrismaClient } from '@prisma/client';
import { registerAdmin } from '../src/services/authService';

async function createInitialAdmin() {
  const prisma = new PrismaClient();

  try {
    const token = await registerAdmin('admin', 'Agile2025');
    console.log('Usuário administrador criado com sucesso!');
    console.log('Token:', token);
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createInitialAdmin();
