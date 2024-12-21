const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const IAuthService = require('./interfaces/IAuthService');
const LoginAudit = require('./models/loginAudit');
const { AuthResponseDTO } = require('./dto/login.dto');
const UserService = require('../users/user.service');
const { logger } = require('../../middlewares/logger');
const redis = require('../../config/redis');

class AuthService extends IAuthService {
    constructor() {
        super();
        this.userService = UserService;
    }

    async login(username, password, twoFactorToken = null, ip, userAgent) {
        try {
            // Buscar usuário primeiro
            const user = await this.userService.findByUsername(username);
            if (!user) {
                await LoginAudit.create({
                    username,
                    success: false,
                    ip,
                    userAgent,
                    userId: null
                });
                logger.error('User not found', { username });
                throw new Error('Invalid credentials');
            }

            // Verificar senha
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                await LoginAudit.create({
                    username,
                    success: false,
                    ip,
                    userAgent,
                    userId: user.user_id
                });
                logger.error('Invalid password', { username });
                throw new Error('Invalid credentials');
            }

            // Registrar login bem-sucedido
            await LoginAudit.create({
                username,
                success: true,
                ip,
                userAgent,
                userId: user.user_id
            });

            // Verificar 2FA se estiver habilitado
            if (user.enable_2fa && process.env.ENABLE_2FA === 'true') {
                if (!twoFactorToken) {
                    throw new Error('Two factor authentication token is required');
                }
                // TODO: Implementar verificação do token 2FA
            }

            // Gerar tokens
            const accessToken = jwt.sign(
                {
                    user_id: user.user_id,
                    username: user.username,
                    profile_id: user.profile_id
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRATION }
            );

            const refreshToken = jwt.sign(
                {
                    user_id: user.user_id,
                    username: user.username
                },
                process.env.JWT_SECRET, // Usando a mesma chave para refresh token
                { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION }
            );

            // Calcular expiração em segundos
            const refreshExpirationInSeconds = 7 * 24 * 60 * 60; // 7 dias em segundos

            // Salvar refresh token no Redis
            await redis.set(
                `refresh_token:${refreshToken}`,
                user.user_id,
                'EX',
                refreshExpirationInSeconds
            );

            return new AuthResponseDTO({
                accessToken,
                refreshToken,
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    profile_id: user.profile_id
                }
            });
        } catch (error) {
            logger.error('Login error', { error: error.message, username });
            throw error;
        }
    }

    async refreshToken(refreshToken) {
        try {
            // Verificar se o token existe no Redis
            const userId = await redis.get(`refresh_token:${refreshToken}`);
            if (!userId) {
                throw new Error('Invalid refresh token');
            }

            // Verificar e decodificar o token
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

            // Buscar usuário
            const user = await this.userService.findById(decoded.user_id);
            if (!user) {
                throw new Error('User not found');
            }

            // Gerar novo access token
            const newAccessToken = jwt.sign(
                {
                    user_id: user.user_id,
                    username: user.username,
                    profile_id: user.profile_id
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRATION }
            );

            return {
                accessToken: newAccessToken
            };
        } catch (error) {
            logger.error('Error refreshing token', { error });
            throw error;
        }
    }

    async logout(refreshToken) {
        try {
            // Remover refresh token do Redis
            await redis.del(`refresh_token:${refreshToken}`);
        } catch (error) {
            logger.error('Error during logout', { error });
            throw error;
        }
    }
}

module.exports = new AuthService();
