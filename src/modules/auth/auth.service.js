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

            // Verificar senha
            const isValidPassword = await bcrypt.compare(password, user.password);
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
                process.env.JWT_SECRET,
                { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION }
            );

            // Armazenar refresh token no Redis
            await redis.set(
                `refresh_token:${user.user_id}`,
                refreshToken,
                'EX',
                7 * 24 * 60 * 60 // 7 dias
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

    async refreshToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const storedToken = await redis.get(`refresh_token:${decoded.user_id}`);

            if (!storedToken || storedToken !== token) {
                throw new Error('Invalid refresh token');
            }

            const user = await this.userService.findById(decoded.user_id);
            if (!user) {
                throw new Error('User not found');
            }

            const accessToken = jwt.sign(
                {
                    user_id: user.user_id,
                    username: user.username,
                    profile_id: user.profile_id
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRATION }
            );

            return { accessToken };
        } catch (error) {
            logger.error('Token refresh error', { error: error.message });
            throw error;
        }
    }

    async logout(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            await redis.del(`refresh_token:${decoded.user_id}`);
        } catch (error) {
            logger.error('Logout error', { error: error.message });
            throw error;
        }
    }
}

module.exports = AuthService;
