const AuthService = require('./auth.service');
const { LoginDTO } = require('./dto/login.dto');
const { logger } = require('../../middlewares/logger');

class AuthController {
    static authService = new AuthService();

    static async login(req, res) {
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

            const result = await AuthController.authService.login(
                loginDto.username,
                loginDto.password,
                loginDto.twoFactorToken,
                req.ip,
                req.get('user-agent')
            );

            res.json(result);
        } catch (error) {
            logger.error('Login error', { error });
            res.status(401).json({
                error: 'Invalid credentials'
            });
        }
    }

    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            const result = await AuthController.authService.refreshToken(refreshToken);
            res.json(result);
        } catch (error) {
            logger.error('Refresh token error', { error });
            res.status(401).json({
                error: 'Invalid refresh token'
            });
        }
    }

    static async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            await AuthController.authService.logout(refreshToken);
            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            logger.error('Logout error', { error });
            res.status(400).json({
                error: 'Invalid logout request'
            });
        }
    }
}

module.exports = AuthController;
