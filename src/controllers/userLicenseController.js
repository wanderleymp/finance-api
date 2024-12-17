const logger = require('../middlewares/logger').logger;
const userLicenseService = require('../services/userLicenseService');

class UserLicenseController {
    async create(req, res) {
        try {
            const { userId } = req.params;

            // Validar se o usuário tem permissão para criar licenças
            if (parseInt(userId) !== req.user.user_id && !req.user.isAdmin) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Você não tem permissão para criar licenças para este usuário'
                });
            }

            const userData = {
                user_id: userId,
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
            const { userId } = req.params;
            const { page = 1, limit = 10 } = req.query;

            console.log('CONTROLLER: Recebendo requisição de listagem de licenças', {
                userId,
                userIdType: typeof userId,
                page,
                limit,
                requestUser: req.user,
                requestParams: req.params,
                requestQuery: req.query
            });

            // Validar se o usuário tem permissão para acessar essas licenças
            if (parseInt(userId) !== req.user.user_id && !req.user.isAdmin) {
                console.warn('CONTROLLER: Usuário sem permissão para acessar licenças', {
                    requestUserId: req.user.user_id,
                    targetUserId: userId,
                    isAdmin: req.user.isAdmin
                });

                return res.status(403).json({
                    status: 'error',
                    message: 'Você não tem permissão para acessar as licenças deste usuário'
                });
            }

            const userLicenses = await userLicenseService.getUserLicenses(userId, { page, limit });

            console.log('CONTROLLER: Licenças recuperadas com sucesso', {
                userId,
                totalLicenses: userLicenses.total,
                licensesReturned: userLicenses.data.length
            });

            res.json(userLicenses);
        } catch (error) {
            console.error('CONTROLLER: Erro completo ao listar licenças de usuário', {
                error: error.message,
                errorName: error.name,
                errorStack: error.stack,
                userId: req.params.userId
            });

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

    async get(req, res) {
        try {
            const { userId, license_id } = req.params;

            // Validar se o usuário tem permissão para acessar esta licença
            if (parseInt(userId) !== req.user.user_id && !req.user.isAdmin) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Você não tem permissão para acessar esta licença'
                });
            }

            const userLicense = await userLicenseService.getUserLicense(userId, license_id);

            res.status(200).json({
                status: 'success',
                message: 'Licença de usuário recuperada com sucesso',
                data: userLicense
            });
        } catch (error) {
            logger.error('Erro no controlador ao recuperar licença de usuário', {
                errorMessage: error.message,
                errorStack: error.stack
            });

            res.status(500).json({
                status: 'error',
                message: 'Erro interno ao recuperar licença de usuário'
            });
        }
    }

    async update(req, res) {
        try {
            const { userId, license_id } = req.params;
            const updateData = req.body;

            // Validar se o usuário tem permissão para atualizar esta licença
            if (parseInt(userId) !== req.user.user_id && !req.user.isAdmin) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Você não tem permissão para atualizar esta licença'
                });
            }

            const updatedUserLicense = await userLicenseService.updateUserLicense(userId, license_id, updateData);

            res.status(200).json({
                status: 'success',
                message: 'Licença de usuário atualizada com sucesso',
                data: updatedUserLicense
            });
        } catch (error) {
            logger.error('Erro no controlador ao atualizar licença de usuário', {
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
                message: 'Erro interno ao atualizar licença de usuário'
            });
        }
    }

    async delete(req, res) {
        try {
            const { userId, license_id } = req.params;

            // Validar se o usuário tem permissão para deletar esta licença
            if (parseInt(userId) !== req.user.user_id && !req.user.isAdmin) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Você não tem permissão para deletar esta licença'
                });
            }

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
