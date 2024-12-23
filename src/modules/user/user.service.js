const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { logger } = require('../../middlewares/logger');
const UserRepository = require('./user.repository');
const CreateUserDTO = require('./dto/create-user.dto');
const UpdateUserDTO = require('./dto/update-user.dto');
const UserResponseDTO = require('./dto/user-response.dto');
const CacheService = require('../../services/cacheService');

class UserService {
    constructor({ 
        userRepository = new UserRepository(),
        cacheService = CacheService 
    } = {}) {
        this.repository = userRepository;
        this.cacheService = cacheService;
        this.cachePrefix = 'user:';
        this.cacheTTL = 3600; // 1 hora
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const cacheKey = `${this.cachePrefix}list:${JSON.stringify({ filters, page, limit })}`;
            
            // Tenta buscar do cache
            const cachedResult = await this.cacheService.get(cacheKey);
            if (cachedResult) {
                logger.info('Cache hit para listagem de usuários');
                return cachedResult;
            }

            const result = await this.repository.list({ filters, page, limit });
            
            // Remover campos sensíveis de todos os usuários
            result.rows = result.rows.map(user => new UserResponseDTO(user));

            // Salvar no cache
            await this.cacheService.set(cacheKey, result, this.cacheTTL);

            return result;
        } catch (error) {
            logger.error('Erro ao listar usuários', { error: error.message });
            throw error;
        }
    }

    async findById(id) {
        try {
            const cacheKey = `${this.cachePrefix}${id}`;
            
            // Tenta buscar do cache
            const cachedUser = await this.cacheService.get(cacheKey);
            if (cachedUser) {
                logger.info('Cache hit para usuário por ID');
                return cachedUser;
            }

            const user = await this.repository.findById(id);
            if (!user) {
                throw new NotFoundError('Usuário não encontrado');
            }

            const userResponse = new UserResponseDTO(user);

            // Salvar no cache
            await this.cacheService.set(cacheKey, userResponse, this.cacheTTL);

            return userResponse;
        } catch (error) {
            logger.error('Erro ao buscar usuário por ID', { error: error.message });
            throw error;
        }
    }

    async create(data) {
        try {
            // Validar e converter para DTO
            const createDTO = new CreateUserDTO(data);

            // Hash da senha
            createDTO.password = await bcrypt.hash(createDTO.password, 10);

            const user = await this.repository.create(createDTO);
            return new UserResponseDTO(user);
        } catch (error) {
            logger.error('Erro ao criar usuário', { error: error.message });
            if (error.message.includes('duplicate key value')) {
                throw new ValidationError('Username já existe');
            }
            throw error;
        }
    }

    async update(id, data) {
        try {
            // Validar e converter para DTO
            const updateDTO = new UpdateUserDTO(data);

            // Se a senha foi fornecida, fazer o hash
            if (updateDTO.password) {
                updateDTO.password = await bcrypt.hash(updateDTO.password, 10);
            }

            const user = await this.repository.update(id, updateDTO);
            if (!user) {
                throw new NotFoundError('Usuário não encontrado');
            }

            const userResponse = new UserResponseDTO(user);

            // Invalidar cache
            const cacheKey = `${this.cachePrefix}${id}`;
            await this.cacheService.del(cacheKey);
            await this.cacheService.delByPattern(`${this.cachePrefix}list:*`);

            return userResponse;
        } catch (error) {
            logger.error('Erro ao atualizar usuário', { error: error.message });
            throw error;
        }
    }

    async delete(id) {
        try {
            const user = await this.repository.findById(id);
            if (!user) {
                throw new NotFoundError('Usuário não encontrado');
            }

            await this.repository.delete(id);

            // Invalidar cache
            const cacheKey = `${this.cachePrefix}${id}`;
            await this.cacheService.del(cacheKey);
            await this.cacheService.delByPattern(`${this.cachePrefix}list:*`);
        } catch (error) {
            logger.error('Erro ao deletar usuário', { error: error.message });
            throw error;
        }
    }

    async findByUsername(username) {
        try {
            return await this.repository.findByUsername(username);
        } catch (error) {
            logger.error('Erro ao buscar usuário por username', { error: error.message });
            throw error;
        }
    }

    async updateRefreshToken(userId, refreshToken) {
        try {
            const user = await this.repository.updateRefreshToken(userId, refreshToken);
            if (!user) {
                throw new NotFoundError('Usuário não encontrado');
            }

            // Invalidar cache
            const cacheKey = `${this.cachePrefix}${userId}`;
            await this.cacheService.del(cacheKey);

            return user;
        } catch (error) {
            logger.error('Erro ao atualizar refresh token', { error: error.message });
            throw error;
        }
    }

    async refreshToken(refreshToken) {
        try {
            // Verificar refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            if (!decoded) {
                throw new ValidationError('Invalid refresh token');
            }

            // Buscar usuário e verificar se o refresh token está ativo
            const user = await this.findById(decoded.userId);
            if (!user || user.refresh_token !== refreshToken) {
                throw new ValidationError('Invalid refresh token');
            }

            // Gerar novos tokens
            const accessToken = jwt.sign(
                { userId: decoded.userId },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRATION }
            );

            const newRefreshToken = jwt.sign(
                { userId: decoded.userId },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: process.env.JWT_REFRESH_EXPIRATION }
            );

            // Atualizar refresh token no banco
            await this.updateRefreshToken(decoded.userId, newRefreshToken);

            return {
                accessToken,
                refreshToken: newRefreshToken,
                expiresIn: process.env.JWT_EXPIRATION
            };
        } catch (error) {
            logger.error('Erro ao atualizar token', { error: error.message });
            throw error;
        }
    }
}

module.exports = UserService;
