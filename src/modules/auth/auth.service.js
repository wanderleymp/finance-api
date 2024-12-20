const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const IAuthService = require('./interfaces/IAuthService');
const LoginAudit = require('./models/loginAudit');
const { AuthResponseDTO } = require('./dto/login.dto');
const UserService = require('../users/user.service');
const logger = require('../../middlewares/logger');
const redis = require('../../config/redis');

class AuthService extends IAuthService {
    constructor() {
        super();
        this.userService = UserService;
    }

    async login(username, password, twoFactorToken = null) {
        try {
            // Registrar tentativa de login
            await LoginAudit.create({
                username,
                success: false,
                ip: null, // Será preenchido no controller
                userAgent: null // Será preenchido no controller
            });

            // Verificar tentativas falhas
            const failedAttempts = await LoginAudit.getFailedAttempts(
                username,
                process.env.LOGIN_BLOCK_DURATION
            );

            if (failedAttempts >= process.env.MAX_LOGIN_ATTEMPTS) {
                throw new Error('Too many failed attempts. Try again later.');
            }

            // Buscar usuário
            const user = await this.userService.findByUsername(username);
            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Verificar senha
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                await LoginAudit.create({
                    username,
                    success: false,
                    ip: null,
                    userAgent: null
                });
                throw new Error('Invalid credentials');
            }

            // Verificar 2FA se estiver habilitado
            if (user.enable_2fa) {
                if (!twoFactorToken) {
                    await LoginAudit.create({
                        username,
                        success: false,
                        ip: null,
                        userAgent: null
                    });
                    throw new Error('Two factor token is required');
                }

                const isValid2FA = await this.verify2FA(user.user_id, twoFactorToken);
                if (!isValid2FA) {
                    throw new Error('Invalid two factor token');
                }
            }

            // Gerar tokens
            const accessToken = this.generateAccessToken(user);
            const refreshToken = this.generateRefreshToken(user);

            // Salvar refresh token no Redis
            await redis.set(
                `refresh_token:${refreshToken}`,
                user.user_id,
                'EX',
                process.env.REFRESH_TOKEN_EXPIRATION
            );

            // Atualizar último login
            await this.userService.update(user.user_id, {
                last_login: new Date().toISOString()
            });

            // Registrar login bem-sucedido
            await LoginAudit.create({
                username,
                success: true,
                ip: null,
                userAgent: null
            });

            logger.info('Login successful', { username });

            return new AuthResponseDTO({
                accessToken,
                refreshToken,
                user
            });
        } catch (error) {
            logger.error('Login error', { username, error });
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

            // Buscar usuário
            const user = await this.userService.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Gerar novos tokens
            const newAccessToken = this.generateAccessToken(user);
            const newRefreshToken = this.generateRefreshToken(user);

            // Invalidar token antigo e salvar novo
            await redis.del(`refresh_token:${refreshToken}`);
            await redis.set(
                `refresh_token:${newRefreshToken}`,
                user.user_id,
                'EX',
                process.env.REFRESH_TOKEN_EXPIRATION
            );

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            };
        } catch (error) {
            logger.error('Refresh token error', { error });
            throw error;
        }
    }

    async validateToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    async logout(refreshToken) {
        try {
            await redis.del(`refresh_token:${refreshToken}`);
        } catch (error) {
            logger.error('Logout error', { error });
            throw error;
        }
    }

    generateAccessToken(user) {
        return jwt.sign(
            {
                user_id: user.user_id,
                username: user.username,
                profile_id: user.profile_id
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION }
        );
    }

    generateRefreshToken(user) {
        return jwt.sign(
            {
                user_id: user.user_id,
                type: 'refresh'
            },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION }
        );
    }

    async verify2FA(userId, token) {
        // Implementar verificação 2FA
        return true; // Placeholder
    }
}

module.exports = new AuthService();
