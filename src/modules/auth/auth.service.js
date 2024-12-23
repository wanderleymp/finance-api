const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const IAuthService = require('./interfaces/IAuthService');
const LoginAuditRepository = require('./repositories/loginAudit.repository');
const { AuthResponseDTO } = require('./dto/login.dto');
const UserService = require('../users/user.service');
const { logger } = require('../../middlewares/logger');
const redis = require('../../config/redis');

class AuthService extends IAuthService {
    constructor() {
        super();
        this.userService = new UserService();
        this.loginAuditRepository = new LoginAuditRepository();
    }

    async login(username, password, twoFactorToken = null, ip, userAgent) {
        try {
            // Buscar usuário primeiro
            const user = await this.userService.findByUsername(username);
            if (!user) {
                await this.loginAuditRepository.create({
                    username,
                    success: false,
                    ip,
                    userAgent,
                    userId: null
                });
                logger.error('User not found', { username });
                throw new Error('Invalid credentials');
            }

            // Verificar senha com Promise e timeout
            const isValidPassword = await Promise.race([
                bcrypt.compare(password, user.password),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Password verification timeout')), 5000)
                )
            ]);

            if (!isValidPassword) {
                await this.loginAuditRepository.create({
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
            await this.loginAuditRepository.create({
                username,
                success: true,
                ip,
                userAgent,
                userId: user.user_id
            });

            // Gerar tokens usando a mesma chave secreta para ambos os tokens por enquanto
            const accessToken = jwt.sign(
                { 
                    userId: user.user_id,
                    username: user.username
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRATION }
            );

            const refreshToken = jwt.sign(
                { userId: user.user_id },
                process.env.JWT_SECRET, // Usando a mesma chave do JWT_SECRET
                { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION }
            );

            // Se o Redis estiver disponível, armazenar o refresh token
            if (redis.connected) {
                try {
                    await redis.client.set(
                        `refresh_token:${user.user_id}`,
                        refreshToken,
                        'EX',
                        parseInt(process.env.REFRESH_TOKEN_EXPIRATION) * 24 * 60 * 60 // Converter dias para segundos
                    );
                } catch (redisError) {
                    logger.warn('Erro ao armazenar refresh token no Redis', { error: redisError.message });
                    // Continua mesmo se o Redis falhar
                }
            }

            return new AuthResponseDTO({
                accessToken,
                refreshToken,
                user: {
                    userId: user.user_id,
                    username: user.username
                }
            });
        } catch (error) {
            logger.error('Login error', { error: error.message, stack: error.stack });
            throw error;
        }
    }

    async refreshToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await this.userService.findById(decoded.userId);

            if (!user) {
                throw new Error('User not found');
            }

            const accessToken = jwt.sign(
                { userId: user.user_id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRATION }
            );

            const refreshToken = jwt.sign(
                { userId: user.user_id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION }
            );

            return {
                accessToken,
                refreshToken
            };
        } catch (error) {
            logger.error('Token refresh error', { error: error.message });
            throw new Error('Invalid refresh token');
        }
    }

    async logout(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (redis.connected) {
                try {
                    await redis.client.del(`refresh_token:${decoded.userId}`);
                } catch (redisError) {
                    logger.warn('Erro ao remover refresh token do Redis', { error: redisError.message });
                }
            }

            return true;
        } catch (error) {
            logger.error('Logout error', { error: error.message });
            throw error;
        }
    }
}

module.exports = AuthService;
