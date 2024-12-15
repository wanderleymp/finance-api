const passwordService = require('../services/passwordService');
const { logger } = require('../middlewares/logger');
const { ValidationError } = require('../utils/errors');

class PasswordController {
    async requestReset(req, res) {
        try {
            const { email } = req.body;

            logger.info('Solicitação de reset de senha recebida', { email });

            await passwordService.sendPasswordResetEmail(email);

            res.json({
                status: 'success',
                message: 'Se o email estiver cadastrado, você receberá as instruções para redefinir sua senha'
            });
        } catch (error) {
            logger.error('Erro ao solicitar reset de senha', {
                error: error.message,
                stack: error.stack
            });

            res.status(500).json({
                status: 'error',
                message: 'Erro ao processar solicitação de reset de senha'
            });
        }
    }

    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;

            await passwordService.resetPassword(token, newPassword);

            res.json({
                status: 'success',
                message: 'Senha alterada com sucesso'
            });
        } catch (error) {
            logger.error('Erro ao resetar senha', {
                error: error.message,
                stack: error.stack
            });

            if (error instanceof ValidationError) {
                return res.status(400).json({
                    status: 'error',
                    message: error.message
                });
            }

            res.status(500).json({
                status: 'error',
                message: 'Erro ao resetar senha'
            });
        }
    }

    async changePassword(req, res) {
        try {
            const userId = req.userId;
            const { currentPassword, newPassword } = req.body;

            await passwordService.changePassword(userId, currentPassword, newPassword);

            res.json({
                status: 'success',
                message: 'Senha alterada com sucesso'
            });
        } catch (error) {
            logger.error('Erro ao alterar senha', {
                error: error.message,
                stack: error.stack,
                userId: req.userId
            });

            if (error instanceof ValidationError) {
                return res.status(400).json({
                    status: 'error',
                    message: error.message
                });
            }

            res.status(500).json({
                status: 'error',
                message: 'Erro ao alterar senha'
            });
        }
    }

    async checkPasswordStatus(req, res) {
        try {
            const userId = req.userId;
            const status = await passwordService.checkPasswordExpiration(userId);

            res.json({
                status: 'success',
                data: status
            });
        } catch (error) {
            logger.error('Erro ao verificar status da senha', {
                error: error.message,
                stack: error.stack,
                userId: req.userId
            });

            if (error instanceof ValidationError) {
                return res.status(400).json({
                    status: 'error',
                    message: error.message
                });
            }

            res.status(500).json({
                status: 'error',
                message: 'Erro ao verificar status da senha'
            });
        }
    }
}

module.exports = new PasswordController();
