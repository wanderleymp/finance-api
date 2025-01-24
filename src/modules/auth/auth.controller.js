const AuthService = require('./auth.service');
const { LoginDTO } = require('./dto/login.dto');
const { logger } = require('../../middlewares/logger');
const { handleResponse, handleError } = require('../../utils/responseHandler');

class AuthController {
    constructor(service) {
        this.service = service;
    }

    async login(req, res) {
        try {
            const loginDto = new LoginDTO({
                username: req.body.username,
                password: req.body.password,
                twoFactorToken: req.body.twoFactorToken
            });

            // Validar DTO
            loginDto.validate();

            logger.info('Login attempt', { 
                username: loginDto.username,
                ip: req.ip,
                userAgent: req.get('user-agent')
            });

            logger.debug('DEBUG: Login attempt', { 
                username: loginDto.username, 
                ip: req.ip, 
                userAgent: req.get('user-agent') 
            });

            const result = await this.service.login(
                loginDto.username,
                loginDto.password,
                loginDto.twoFactorToken,
                req.ip,
                req.get('user-agent')
            );

            logger.debug('DEBUG: Login successful', { 
                userId: result.user.user_id, 
                username: result.user.username 
            });

            handleResponse(res, result);
        } catch (error) {
            logger.error('Login error', { error });
            logger.debug('DEBUG: Login error', { 
                error: error.message, 
                stack: error.stack 
            });
            handleError(res, error);
        }
    }

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            const result = await this.service.refreshToken(refreshToken);
            handleResponse(res, result);
        } catch (error) {
            logger.error('Refresh token error', { error });
            handleError(res, error);
        }
    }

    async logout(req, res) {
        try {
            await this.service.logout(req.user.userId);
            handleResponse(res, null, 204);
        } catch (error) {
            logger.error('Logout error', { error });
            handleError(res, error);
        }
    }
}

module.exports = AuthController;
