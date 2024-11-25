const { PrismaClient } = require('@prisma/client');
const IUserRepository = require('../interfaces/IUserRepository');
const logger = require('../../../config/logger');

class PrismaUserRepository extends IUserRepository {
  constructor() {
    super();
    this.prisma = new PrismaClient();
  }

  async getAllUsers() {
    const startTime = Date.now();
    try {
      logger.info('Iniciando busca de todos os usuários', {
        operation: 'getAllUsers',
        timestamp: new Date().toISOString()
      });

      const users = await this.prisma.user_accounts.findMany();
      const duration = Date.now() - startTime;

      logger.info('Busca de usuários concluída com sucesso', {
        operation: 'getAllUsers',
        duration,
        count: users.length,
        data: { userCount: users.length }
      });

      return users;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Erro ao buscar usuários', {
        operation: 'getAllUsers',
        duration,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async getUserById(id) {
    const startTime = Date.now();
    try {
      logger.info('Iniciando busca de usuário por ID', {
        operation: 'getUserById',
        data: { id }
      });

      const user = await this.prisma.user_accounts.findUnique({
        where: { id: parseInt(id) }
      });

      const duration = Date.now() - startTime;
      logger.info('Busca de usuário por ID concluída', {
        operation: 'getUserById',
        duration,
        data: { id, found: !!user }
      });

      return user;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Erro ao buscar usuário por ID', {
        operation: 'getUserById',
        duration,
        error: error.message,
        data: { id }
      });
      throw error;
    }
  }

  async createUser(userData) {
    const startTime = Date.now();
    try {
      logger.info('Iniciando criação de usuário', {
        operation: 'createUser',
        data: { ...userData, password: '[REDACTED]' }
      });

      const user = await this.prisma.user_accounts.create({
        data: userData
      });

      const duration = Date.now() - startTime;
      logger.info('Usuário criado com sucesso', {
        operation: 'createUser',
        duration,
        data: { id: user.id }
      });

      return user;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Erro ao criar usuário', {
        operation: 'createUser',
        duration,
        error: error.message,
        data: { ...userData, password: '[REDACTED]' }
      });
      throw error;
    }
  }

  async updateUser(id, userData) {
    const startTime = Date.now();
    try {
      logger.info('Iniciando atualização de usuário', {
        operation: 'updateUser',
        data: { id, ...userData, password: userData.password ? '[REDACTED]' : undefined }
      });

      const user = await this.prisma.user_accounts.update({
        where: { id: parseInt(id) },
        data: userData
      });

      const duration = Date.now() - startTime;
      logger.info('Usuário atualizado com sucesso', {
        operation: 'updateUser',
        duration,
        data: { id }
      });

      return user;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Erro ao atualizar usuário', {
        operation: 'updateUser',
        duration,
        error: error.message,
        data: { id }
      });
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      return await this.prisma.user_accounts.delete({
        where: { id: parseInt(id) }
      });
    } catch (error) {
      logger.error(`Erro ao deletar usuário no repositório Prisma: ${error.message}`);
      throw error;
    }
  }
}

module.exports = PrismaUserRepository;
