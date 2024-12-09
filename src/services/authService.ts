import { PrismaClient, UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import logger from '../config/logger';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
const TOKEN_EXPIRATION = '24h';

export interface User {
  id?: string;
  user_name: string;
  password: string;
  role?: UserRole;
}

export async function registerAdmin(user_name: string, password: string): Promise<string> {
  try {
    logger.info(`Iniciando registro de admin: ${user_name}`);
    
    // Verificar se já existe um usuário administrador
    const existingAdmin = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN }
    });

    if (existingAdmin) {
      logger.warn(`Tentativa de registrar admin quando já existe: ${user_name}`);
      throw new Error('Já existe um usuário administrador');
    }

    // Hash da senha usando Argon2
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1
    });

    // Criar usuário administrador
    const newAdmin = await prisma.user.create({
      data: {
        user_name,
        password: hashedPassword,
        role: UserRole.ADMIN
      }
    });

    logger.info(`Admin criado com sucesso: ${user_name}`);

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: newAdmin.id, 
        userName: newAdmin.user_name, 
        role: newAdmin.role 
      }, 
      JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRATION }
    );

    return token;
  } catch (error) {
    logger.error(`Erro no registro de admin: ${user_name}`, error);
    throw error;
  }
}

export async function authenticateUser(user_name: string, password: string): Promise<string> {
  try {
    logger.info(`Iniciando autenticação: ${user_name}`);
    
    // Buscar usuário pelo nome de usuário
    const user = await prisma.user.findUnique({
      where: { user_name }
    });

    if (!user) {
      logger.warn(`Usuário não encontrado: ${user_name}`);
      throw new Error('Usuário não encontrado');
    }

    // Verificar senha
    const passwordMatch = await argon2.verify(user.password, password);

    if (!passwordMatch) {
      logger.warn(`Senha incorreta para usuário: ${user_name}`);
      throw new Error('Credenciais inválidas');
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        userName: user.user_name, 
        role: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRATION }
    );

    logger.info(`Usuário autenticado com sucesso: ${user_name}`);
    return token;
  } catch (error) {
    logger.error(`Erro na autenticação: ${user_name}`, error);
    throw error;
  }
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    logger.info('Token verificado com sucesso');
    return decoded;
  } catch (error) {
    logger.error('Erro na verificação do token', error);
    throw new Error('Token inválido');
  }
}

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    const isAdminUser = user?.role === UserRole.ADMIN;
    logger.info(`Verificação de admin para usuário ${userId}: ${isAdminUser}`);
    return isAdminUser;
  } catch (error) {
    logger.error(`Erro ao verificar admin para usuário ${userId}`, error);
    return false;
  }
}
