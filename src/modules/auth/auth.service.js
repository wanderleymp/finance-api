const bcrypt = require('bcrypt');
const IAuthService = require('./interfaces/IAuthService');
const LoginAuditRepository = require('./repositories/loginAudit.repository');
const { AuthResponseDTO } = require('./dto/login.dto');
const UserService = require('../user/user.service');
const { logger } = require('../../middlewares/logger');
const redis = require('../../config/redis');
const JwtService = require('../../config/jwt');

class AuthService extends IAuthService {
    constructor() {
        super();
        this.loginAuditRepository = new LoginAuditRepository();
    }

    async login(username, password, twoFactorToken = null, ip, userAgent) {
        try {
            // Buscar usuário primeiro
            const user = await UserService.findByUsername(username);
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

            // Verificar se a conta está ativa
            if (!user.active) {
                await this.loginAuditRepository.create({
                    username,
                    success: false,
                    ip,
                    userAgent,
                    userId: user.user_id
                });
                logger.error('Account is inactive', { username });
                throw new Error('Account is inactive');
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

            // Verificar 2FA se estiver habilitado
            if (user.enable_2fa) {
                if (!twoFactorToken) {
                    throw new Error('2FA token is required');
                }
                // TODO: Implementar validação do token 2FA
            }

            // Gerar tokens usando o JwtService
            const accessToken = JwtService.generateToken({ userId: user.user_id });
            const refreshToken = JwtService.generateRefreshToken({ userId: user.user_id });

            // Atualizar refresh token no banco
            await UserService.updateRefreshToken(user.user_id, refreshToken);

            // Registrar login bem-sucedido
            await this.loginAuditRepository.create({
                username,
                success: true,
                ip,
                userAgent,
                userId: user.user_id
            });

            // Remover campos sensíveis
            delete user.password;
            delete user.refresh_token;

            return new AuthResponseDTO({
                user,
                accessToken,
                refreshToken,
                expiresIn: JwtService.config.expiration
            });
        } catch (error) {
            logger.error('Login error', { error });
            throw error;
        }
    }

    async logout(userId) {
        try {
            // Invalidar refresh token
            await UserService.updateRefreshToken(userId, null);

            // Invalidar token no Redis se estiver configurado
            if (redis.isEnabled()) {
                const key = `user:${userId}:token`;
                await redis.client.del(key);
            }
        } catch (error) {
            logger.error('Logout error', { error: error.message, userId });
            throw error;
        }
    }

    async refreshToken(refreshToken) {
        try {
            // Verificar refresh token
            const decoded = JwtService.verifyRefreshToken(refreshToken);
            if (!decoded) {
                throw new Error('Invalid refresh token');
            }

            // Buscar usuário e verificar se o refresh token está ativo
            const user = await UserService.findById(decoded.userId);
            if (!user || user.refresh_token !== refreshToken) {
                throw new Error('Invalid refresh token');
            }

            // Gerar novos tokens
            const accessToken = JwtService.generateToken({ userId: decoded.userId });
            const newRefreshToken = JwtService.generateRefreshToken({ userId: decoded.userId });

            // Atualizar refresh token no banco
            await UserService.updateRefreshToken(decoded.userId, newRefreshToken);

            return {
                accessToken,
                refreshToken: newRefreshToken,
                expiresIn: JwtService.config.expiration
            };
        } catch (error) {
            logger.error('Refresh token error', { error: error.message });
            throw error;
        }
    }
}

module.exports = AuthService;
