const authService = require('./auth.service');
const { LoginDTO } = require('./dto/login.dto');
const logger = require('../../middlewares/logger');

class AuthController {
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

            const result = await authService.login(
                loginDto.username,
                loginDto.password,
                loginDto.twoFactorToken
            );

            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            logger.error('Login error', { error });
            res.status(401).json({
                status: 'error',
                message: error.message || 'Authentication failed'
            });
        }
    }

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            const tokens = await authService.refreshToken(refreshToken);

            res.json({
                status: 'success',
                data: tokens
            });
        } catch (error) {
            logger.error('Refresh token error', { error });
            res.status(401).json({
                status: 'error',
                message: error.message || 'Invalid refresh token'
            });
        }
    }

    async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            await authService.logout(refreshToken);

            res.json({
                status: 'success',
                message: 'Logged out successfully'
            });
        } catch (error) {
            logger.error('Logout error', { error });
            res.status(500).json({
                status: 'error',
                message: error.message || 'Error during logout'
            });
        }
    }
}

module.exports = new AuthController();
