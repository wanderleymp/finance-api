const { logger } = require('../middlewares/logger');

// Classe de erro personalizada para validações
class ValidationError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'ValidationError';
        this.code = code;
    }
}

const userRepository = require('../repositories/userRepository');
const PaginationHelper = require('../utils/paginationHelper');
const bcrypt = require('bcrypt');

class UserService {
    async listUsers(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('SERVICE: Iniciando listagem de usuários', { 
                page, 
                limit, 
                filters,
                pageType: typeof page,
                limitType: typeof limit,
                filtersType: typeof filters
            });
            
            // Converte page e limit para números inteiros
            const pageNum = Number(page);
            const limitNum = Number(limit);
            
            logger.info('SERVICE: Parâmetros convertidos', { 
                pageNum, 
                limitNum,
                pageNumType: typeof pageNum,
                limitNumType: typeof limitNum
            });
            
            const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(pageNum, limitNum);
            
            logger.info('SERVICE: Parâmetros de paginação validados', { 
                validPage, 
                validLimit 
            });
            
            const result = await userRepository.findAll(filters, validPage, validLimit);
            
            logger.info('SERVICE: Resultado do repositório', { 
                resultDataLength: result.data.length,
                resultTotal: result.total,
                resultDataType: typeof result.data,
                resultTotalType: typeof result.total
            });
            
            return PaginationHelper.formatResponse(
                result.data,
                result.total,
                validPage,
                validLimit
            );
        } catch (error) {
            logger.error('SERVICE: Erro ao listar usuários', { 
                error: error.message,
                stack: error.stack 
            });
            throw error;
        }
    }

    async getUserById(id) {
        try {
            logger.info('SERVICE: Buscando usuário por ID', { id });
            
            const user = await userRepository.findById(id);
            
            if (!user) {
                throw new ValidationError('Usuário não encontrado', 404);
            }
            
            return user;
        } catch (error) {
            logger.error('SERVICE: Erro ao buscar usuário por ID', { 
                error: error.message,
                stack: error.stack,
                userId: id 
            });
            throw error;
        }
    }

    async getUser(id) {
        logger.info('Buscando usuário por ID', { id });
        
        const user = await userRepository.findById(id);
        if (!user) {
            throw new ValidationError('Usuário não encontrado', 404);
        }
        
        return user;
    }

    async getUsersByPerson(personId) {
        try {
            logger.info('SERVICE: Buscando usuários por pessoa', { personId });
            
            const users = await userRepository.findByPerson(personId);
            
            logger.info('SERVICE: Usuários encontrados', { 
                personId,
                usersCount: users.length 
            });
            
            return users;
        } catch (error) {
            logger.error('SERVICE: Erro ao buscar usuários por pessoa', { 
                error: error.message,
                stack: error.stack,
                personId 
            });
            throw error;
        }
    }

    async findByPerson(personId) {
        logger.info('SERVICE: Buscando usuários por pessoa', { personId });
        
        if (!personId) {
            throw new ValidationError('ID da pessoa é obrigatório');
        }

        const users = await userRepository.findByPerson(personId);
        
        logger.info('SERVICE: Resultado da busca por pessoa', { 
            rowCount: users.length,
            resultUsers: users
        });

        return users;
    }

    async createUser(data) {
        try {
            logger.info('SERVICE: Criando novo usuário', { 
                data: {
                    ...data,
                    password: '********' // Ocultar senha
                }
            });

            // Criptografar a senha antes de salvar
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(data.password, saltRounds);
            
            // Substituir a senha original pela senha criptografada
            const userDataWithHashedPassword = {
                ...data,
                password: hashedPassword
            };

            const user = await userRepository.create(userDataWithHashedPassword);

            logger.info('SERVICE: Usuário criado com sucesso', { 
                userId: user.user_id,
                username: user.username
            });

            return user;
        } catch (error) {
            logger.error('SERVICE: Erro ao criar usuário', { 
                error: error.message,
                stack: error.stack,
                data: {
                    ...data,
                    password: '********' // Ocultar senha
                }
            });
            throw error;
        }
    }

    async updateUser(id, data) {
        try {
            logger.info('SERVICE: Atualizando usuário', { 
                userId: id, 
                data: Object.keys(data) 
            });

            // Verifica se o usuário existe
            const existingUser = await this.getUser(id);
            if (!existingUser) {
                throw new ValidationError('Usuário não encontrado');
            }

            // Validações adicionais
            await this.validateUserData(data, true);

            // Verificar se o email já existe em outro usuário
            if (data.email && data.email !== existingUser.email) {
                const existingEmail = await userRepository.findByEmail(data.email);
                if (existingEmail && existingEmail.user_id !== parseInt(id)) {
                    throw new ValidationError('Já existe um usuário com este email');
                }
            }

            // Verificar se o username já existe em outro usuário
            if (data.username && data.username !== existingUser.username) {
                const existingUsername = await userRepository.findByUsername(data.username);
                if (existingUsername && existingUsername.user_id !== parseInt(id)) {
                    throw new ValidationError('Já existe um usuário com este nome de usuário');
                }
            }

            // Hash da senha se for alterada
            if (data.password) {
                const saltRounds = 10;
                data.password = await bcrypt.hash(data.password, saltRounds);
            }

            const updatedUser = await userRepository.update(id, data);
            
            logger.info('SERVICE: Usuário atualizado com sucesso', { 
                userId: id,
                updatedFields: Object.keys(data)
            });

            return updatedUser;
        } catch (error) {
            logger.error('SERVICE: Erro ao atualizar usuário', { 
                userId: id,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async deleteUser(id) {
        try {
            logger.info('Excluindo usuário', { id });

            // Verifica se o usuário existe
            const user = await this.getUser(id);
            if (!user) {
                throw new ValidationError('Usuário não encontrado');
            }

            // Define o usuário como inativo
            const updateData = {
                active: false,
                status: 'Inativo'
            };

            logger.info('Dados para atualização do usuário', { 
                id, 
                updateData,
                currentUser: user 
            });

            const updatedUser = await userRepository.update(id, updateData);
            
            logger.info('Usuário atualizado', { updatedUser });

            return updatedUser;
        } catch (error) {
            logger.error('SERVICE: Erro ao excluir usuário', { 
                error: error.message,
                stack: error.stack,
                userId: id 
            });
            throw error;
        }
    }

    async login(username, password, twoFactorToken = null) {
        const LoginAudit = require('../models/loginAudit');
        const JwtMiddleware = require('../middlewares/jwtMiddleware');
        const TwoFactorAuth = require('../middlewares/security/twoFactorAuth');
        const jwt = require('jsonwebtoken');

        // Busca o usuário pelo username
        const user = await userRepository.findByUsername(username);

        if (!user) {
            logger.info('SERVICE: Usuário não encontrado', { username });
            await LoginAudit.create({
                userId: null,
                success: false,
                ipAddress: require('os').networkInterfaces().eth0[0].address,
                userAgent: 'Service'
            });
            throw new ValidationError('Credenciais inválidas');
        }

        // Verifica tentativas falhas recentes
        const failedAttempts = await LoginAudit.getFailedAttempts(
            user.user_id, 
            process.env.LOGIN_BLOCK_DURATION
        );

        if (failedAttempts >= process.env.MAX_LOGIN_ATTEMPTS) {
            logger.info('SERVICE: Usuário bloqueado por tentativas excessivas', { 
                username,
                failedAttempts 
            });
            throw new ValidationError('Conta temporariamente bloqueada');
        }

        // Verifica se o usuário está ativo
        if (user.active === false) {
            logger.info('SERVICE: Usuário inativo', { 
                username, 
                active: user.active
            });
            throw new ValidationError('Usuário inativo ou bloqueado');
        }

        // Compara a senha
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            logger.info('SERVICE: Senha inválida', { username });
            await LoginAudit.create({
                userId: user.user_id,
                success: false,
                ipAddress: require('os').networkInterfaces().eth0[0].address,
                userAgent: 'Service'
            });
            throw new ValidationError('Credenciais inválidas');
        }

        // Verifica 2FA se estiver habilitado
        if (user.enable_2fa) {
            if (!twoFactorToken) {
                throw new ValidationError('Token 2FA é necessário');
            }

            const isValidToken = TwoFactorAuth.verifyToken(user.two_factor_secret, twoFactorToken);
            if (!isValidToken) {
                logger.info('SERVICE: Token 2FA inválido', { username });
                await LoginAudit.create({
                    userId: user.user_id,
                    success: false,
                    ipAddress: require('os').networkInterfaces().eth0[0].address,
                    userAgent: 'Service'
                });
                throw new ValidationError('Token 2FA inválido');
            }
        }

        // Gera tokens
        const accessToken = JwtMiddleware.generateToken({ 
            user_id: user.user_id, 
            username: user.username,
            profile_id: user.profile_id 
        });

        const refreshToken = jwt.sign(
            { user_id: user.user_id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION }
        );

        // Atualiza último login
        await this.updateUser(user.user_id, { 
            last_login: new Date().toISOString(),
            refresh_token: refreshToken
        });

        // Registra login bem-sucedido
        await LoginAudit.create({
            userId: user.user_id,
            success: true,
            ipAddress: require('os').networkInterfaces().eth0[0].address,
            userAgent: 'Service'
        });

        logger.info('SERVICE: Login realizado com sucesso', { 
            username, 
            userId: user.user_id 
        });

        return {
            accessToken,
            refreshToken,
            user
        };
    }

    async updatePassword(userId, currentPassword, newPassword) {
        try {
            logger.info('SERVICE: Iniciando atualização de senha', { 
                userId 
            });

            // Buscar usuário atual
            const user = await userRepository.findById(userId);
            if (!user) {
                throw new ValidationError('Usuário não encontrado');
            }

            // Validar nova senha
            if (newPassword.length < 8) {
                throw new ValidationError('A nova senha deve ter pelo menos 8 caracteres');
            }

            // Gerar hash da nova senha
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            // Atualizar senha no banco de dados
            await userRepository.update(userId, { password: hashedPassword });

            logger.info('SERVICE: Senha atualizada com sucesso', { 
                userId 
            });

            return { 
                status: 'success', 
                message: 'Senha atualizada com sucesso' 
            };
        } catch (error) {
            logger.error('SERVICE: Erro ao atualizar senha', { 
                error: error.message,
                userId 
            });
            throw error;
        }
    }

    validateUserData(data, isUpdate = false) {
        return true;
    }
}

module.exports = new UserService();
