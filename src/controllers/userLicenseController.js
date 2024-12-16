const logger = require('../middlewares/logger').logger;
const userLicenseService = require('../services/userLicenseService');

class UserLicenseController {
    async create(req, res) {
        try {
            const userData = {
                user_id: req.user.user_id,
                license_id: req.body.license_id
            };

            const userLicense = await userLicenseService.createUserLicense(userData);

            res.status(201).json({
                status: 'success',
                message: 'Licença de usuário criada com sucesso',
                data: userLicense
            });
        } catch (error) {
            logger.error('Erro no controlador ao criar licença de usuário', {
                errorMessage: error.message,
                errorStack: error.stack
            });

            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    status: 'error',
                    message: error.message
                });
            }

            res.status(500).json({
                status: 'error',
                message: 'Erro interno ao criar licença de usuário'
            });
        }
    }

    async list(req, res) {
        try {
            const userId = req.user.user_id;
            const { page = 1, limit = 10 } = req.query;

            const userLicenses = await userLicenseService.getUserLicenses(userId, { page, limit });

            res.status(200).json({
                status: 'success',
                message: 'Licenças de usuário recuperadas com sucesso',
                data: userLicenses
            });
        } catch (error) {
            logger.error('Erro no controlador ao listar licenças de usuário', {
                errorMessage: error.message,
                errorStack: error.stack
            });

            res.status(500).json({
                status: 'error',
                message: 'Erro interno ao listar licenças de usuário'
            });
        }
    }

    async delete(req, res) {
        try {
            const userId = req.user.user_id;
            const { license_id } = req.params;

            await userLicenseService.deleteUserLicense(userId, license_id);

            res.status(200).json({
                status: 'success',
                message: 'Licença de usuário removida com sucesso'
            });
        } catch (error) {
            logger.error('Erro no controlador ao remover licença de usuário', {
                errorMessage: error.message,
                errorStack: error.stack
            });

            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    status: 'error',
                    message: error.message
                });
            }

            res.status(500).json({
                status: 'error',
                message: 'Erro interno ao remover licença de usuário'
            });
        }
    }
}

module.exports = new UserLicenseController();
