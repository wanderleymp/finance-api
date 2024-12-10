"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const authService_1 = require("../src/services/authService");
async function createInitialAdmin() {
    const prisma = new client_1.PrismaClient();
    try {
        const token = await (0, authService_1.registerAdmin)('admin', 'Agile2025');
        console.log('Usuário administrador criado com sucesso!');
        console.log('Token:', token);
    }
    catch (error) {
        console.error('Erro ao criar usuário administrador:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
createInitialAdmin();
