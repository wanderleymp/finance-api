"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdmin = registerAdmin;
exports.authenticateUser = authenticateUser;
exports.verifyToken = verifyToken;
exports.isAdmin = isAdmin;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const argon2_1 = __importDefault(require("argon2"));
const logger_1 = __importDefault(require("../config/logger"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
const TOKEN_EXPIRATION = '24h';
async function registerAdmin(user_name, password) {
    try {
        logger_1.default.info(`Iniciando registro de admin: ${user_name}`);
        // Verificar se já existe um usuário administrador
        const existingAdmin = await prisma.user.findFirst({
            where: { role: client_1.UserRole.ADMIN }
        });
        if (existingAdmin) {
            logger_1.default.warn(`Tentativa de registrar admin quando já existe: ${user_name}`);
            throw new Error('Já existe um usuário administrador');
        }
        // Hash da senha usando Argon2
        const hashedPassword = await argon2_1.default.hash(password, {
            type: argon2_1.default.argon2id,
            memoryCost: 2 ** 16,
            timeCost: 3,
            parallelism: 1
        });
        // Criar usuário administrador
        const newAdmin = await prisma.user.create({
            data: {
                user_name,
                password: hashedPassword,
                role: client_1.UserRole.ADMIN
            }
        });
        logger_1.default.info(`Admin criado com sucesso: ${user_name}`);
        // Gerar token JWT
        const token = jsonwebtoken_1.default.sign({
            userId: newAdmin.id,
            userName: newAdmin.user_name,
            role: newAdmin.role.toLowerCase()
        }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
        return token;
    }
    catch (error) {
        logger_1.default.error(`Erro no registro de admin: ${user_name}`, error);
        throw error;
    }
}
async function authenticateUser(user_name, password) {
    try {
        logger_1.default.info(`Iniciando autenticação: ${user_name}`);
        // Buscar usuário pelo nome de usuário
        const user = await prisma.user.findUnique({
            where: { user_name }
        });
        if (!user) {
            logger_1.default.warn(`Usuário não encontrado: ${user_name}`);
            throw new Error('Usuário não encontrado');
        }
        // Verificar senha
        const passwordMatch = await argon2_1.default.verify(user.password, password);
        if (!passwordMatch) {
            logger_1.default.warn(`Senha incorreta para usuário: ${user_name}`);
            throw new Error('Credenciais inválidas');
        }
        // Gerar token JWT
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            userName: user.user_name,
            role: user.role.toLowerCase()
        }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
        logger_1.default.info(`Usuário autenticado com sucesso: ${user_name}`);
        return token;
    }
    catch (error) {
        logger_1.default.error(`Erro na autenticação: ${user_name}`, error);
        throw error;
    }
}
function verifyToken(token) {
    try {
        console.log('🔐 DEBUG - Verificando token:', token);
        console.log('🔑 DEBUG - Chave secreta usada:', JWT_SECRET.substring(0, 10) + '...');
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        console.log('✅ DEBUG - Token decodificado:', decoded);
        logger_1.default.info('Token verificado com sucesso', {
            decoded,
            tokenLength: token.length
        });
        return decoded;
    }
    catch (error) {
        console.log('❌ DEBUG - Erro na verificação do token:', error);
        logger_1.default.error('Erro na verificação do token', {
            error: error,
            tokenLength: token.length,
            errorName: error.name,
            errorMessage: error.message
        });
        throw new Error(`Token inválido: ${error.message}`);
    }
}
async function isAdmin(userId) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        const isAdminUser = user?.role === client_1.UserRole.ADMIN;
        logger_1.default.info(`Verificação de admin para usuário ${userId}: ${isAdminUser}`);
        return isAdminUser;
    }
    catch (error) {
        logger_1.default.error(`Erro ao verificar admin para usuário ${userId}`, error);
        return false;
    }
}
//# sourceMappingURL=authService.js.map