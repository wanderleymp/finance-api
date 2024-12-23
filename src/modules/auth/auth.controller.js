const AuthService = require('./auth.service');
const { LoginDTO } = require('./dto/login.dto');
const { logger } = require('../../middlewares/logger');

class AuthController {
    constructor() {
        this.authService = new AuthService();
        
        // Bind dos métodos para manter o contexto
        this.login = this.login.bind(this);
        this.refreshToken = this.refreshToken.bind(this);
        this.logout = this.logout.bind(this);
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

            const result = await this.authService.login(
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

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            const result = await this.authService.refreshToken(refreshToken);
            res.json(result);
        } catch (error) {
            logger.error('Token refresh error', { error });
            res.status(401).json({
                error: 'Invalid refresh token'
            });
        }
    }

    async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            await this.authService.logout(refreshToken);
            res.status(204).send();
        } catch (error) {
            logger.error('Logout error', { error });
            res.status(400).json({
                error: 'Error during logout'
            });
        }
    }
}

// Exporta uma instância da classe
module.exports = new AuthController();
