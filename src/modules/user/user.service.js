const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ValidationError } = require('../../utils/errors');
const { logger } = require('../../middlewares/logger');
const UserRepository = require('./user.repository');
const CreateUserDto = require('./dto/create-user.dto');
const UpdateUserDto = require('./dto/update-user.dto');

class UserService {
    static repository = new UserRepository();

    /**
     * Cria um novo usuário
     * @param {Object} data Dados do usuário
     * @returns {Promise<Object>} Usuário criado
     * @throws {ValidationError} Se os dados forem inválidos
     */
    static async create(data) {
        try {
            // Validar e converter para DTO
            const createDTO = new CreateUserDto(data);

            // Hash da senha antes de salvar
            const hashedPassword = await bcrypt.hash(createDTO.password, 10);

            // Criar usuário com senha hasheada
            const userData = {
                ...createDTO,
                password: hashedPassword
            };

            const user = await this.repository.create(userData);
            
            // Remover campos sensíveis
            delete user.password;
            delete user.refresh_token;

            return user;
        } catch (error) {
            logger.error('Erro ao criar usuário', { error: error.message });
            if (error.message.includes('duplicate key value')) {
                throw new ValidationError('Username já existe');
            }
            throw error;
        }
    }

    /**
     * Atualiza um usuário existente
     * @param {number} id ID do usuário
     * @param {Object} data Dados para atualizar
     * @returns {Promise<Object>} Usuário atualizado
     * @throws {ValidationError} Se os dados forem inválidos ou usuário não encontrado
     */
    static async update(id, data) {
        try {
            // Validar e converter para DTO
            const updateDTO = new UpdateUserDto(data);

            // Atualizar usuário
            const user = await this.repository.update(id, updateDTO);
            if (!user) {
                throw new ValidationError('Usuário não encontrado');
            }

            // Remover campos sensíveis
            delete user.password;
            delete user.refresh_token;

            return user;
        } catch (error) {
            logger.error('Erro ao atualizar usuário', { error: error.message, id });
            throw error;
        }
    }

    /**
     * Atualiza a senha do usuário
     * @param {number} id ID do usuário
     * @param {string} oldPassword Senha atual
     * @param {string} newPassword Nova senha
     * @returns {Promise<Object>} Usuário atualizado
     * @throws {ValidationError} Se as senhas forem inválidas ou usuário não encontrado
     */
    static async updatePassword(id, oldPassword, newPassword) {
        try {
            // Buscar usuário
            const user = await this.repository.findById(id);
            if (!user) {
                throw new ValidationError('Usuário não encontrado');
            }

            // Verificar senha atual
            const isValid = await bcrypt.compare(oldPassword, user.password);
            if (!isValid) {
                throw new ValidationError('Senha atual inválida');
            }

            // Validar nova senha
            if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8 || 
                !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(newPassword)) {
                throw new ValidationError('Nova senha deve ter no mínimo 8 caracteres, uma maiúscula, uma minúscula, um número e um caractere especial');
            }

            // Hash da nova senha
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Atualizar senha
            const updatedUser = await this.repository.update(id, { password: hashedPassword });

            // Remover campos sensíveis
            delete updatedUser.password;
            delete updatedUser.refresh_token;

            return updatedUser;
        } catch (error) {
            logger.error('Erro ao atualizar senha', { error: error.message, id });
            throw error;
        }
    }

    /**
     * Busca um usuário pelo ID
     * @param {number} id ID do usuário
     * @returns {Promise<Object|null>} Usuário encontrado ou null
     */
    static async findById(id) {
        try {
            const user = await this.repository.findById(id);
            if (user) {
                delete user.password;
                delete user.refresh_token;
            }
            return user;
        } catch (error) {
            logger.error('Erro ao buscar usuário', { error: error.message, id });
            throw error;
        }
    }

    /**
     * Busca um usuário pelo username
     * @param {string} username Username do usuário
     * @returns {Promise<Object|null>} Usuário encontrado ou null
     */
    static async findByUsername(username) {
        try {
            return await this.repository.findByUsername(username);
        } catch (error) {
            logger.error('Erro ao buscar usuário por username', { error: error.message, username });
            throw error;
        }
    }

    /**
     * Atualiza o refresh token do usuário
     * @param {number} userId ID do usuário
     * @param {string} refreshToken Novo refresh token
     * @returns {Promise<Object>} Usuário atualizado
     */
    static async updateRefreshToken(userId, refreshToken) {
        try {
            const user = await this.repository.updateRefreshToken(userId, refreshToken);
            if (!user) {
                throw new ValidationError('Usuário não encontrado');
            }
            return user;
        } catch (error) {
            logger.error('Erro ao atualizar refresh token', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Atualiza o token de acesso usando o refresh token
     * @param {string} refreshToken Refresh token atual
     * @returns {Promise<Object>} Novos tokens
     * @throws {ValidationError} Se o refresh token for inválido
     */
    static async refreshToken(refreshToken) {
        try {
            // Verificar refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

            // Buscar usuário e verificar se o refresh token está ativo
            const user = await this.repository.findById(decoded.userId);
            if (!user || user.refresh_token !== refreshToken) {
                throw new ValidationError('Refresh token inválido');
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
            logger.error('Erro ao atualizar tokens', { error: error.message });
            throw error;
        }
    }
}

module.exports = UserService;
