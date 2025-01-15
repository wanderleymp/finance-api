const bcrypt = require('bcrypt');
const IAuthService = require('./interfaces/IAuthService');
const { AuthResponseDTO } = require('./dto/login.dto');
const { logger } = require('../../middlewares/logger');
const JwtService = require('../../config/jwt');

class AuthService extends IAuthService {
    constructor({ loginAuditRepository, userService }) {
        super();
        this.loginAuditRepository = loginAuditRepository;
        this.userService = userService;
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

            // Gerar tokens
            const accessToken = JwtService.generateToken({ userId: user.user_id });
            const refreshToken = JwtService.generateRefreshToken({ userId: user.user_id });

            // Atualizar refresh token do usuário
            await this.userService.updateRefreshToken(user.user_id, refreshToken);

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

    async refreshToken(refreshToken) {
        try {
            // Verificar refresh token
            const decoded = JwtService.verifyRefreshToken(refreshToken);
            if (!decoded) {
                throw new Error('Invalid refresh token');
            }

            // Buscar usuário e verificar se o refresh token está ativo
            const user = await this.userService.findById(decoded.userId);
            if (!user || user.refresh_token !== refreshToken) {
                throw new Error('Invalid refresh token');
            }

            // Gerar novos tokens
            const accessToken = JwtService.generateToken({ userId: decoded.userId });
            const newRefreshToken = JwtService.generateRefreshToken({ userId: decoded.userId });

            // Atualizar refresh token no banco
            await this.userService.updateRefreshToken(decoded.userId, newRefreshToken);

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

    async logout(userId) {
        try {
            // Remover refresh token do usuário
            await this.userService.updateRefreshToken(userId, null);

            return true;
        } catch (error) {
            logger.error('Logout error', { error });
            throw error;
        }
    }
}

module.exports = AuthService;
