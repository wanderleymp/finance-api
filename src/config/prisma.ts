import { PrismaClient } from '@prisma/client';

// Cria uma única instância do PrismaClient
const prisma = new PrismaClient();

export default prisma;
