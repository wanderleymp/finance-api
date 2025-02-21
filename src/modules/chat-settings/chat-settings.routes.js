const express = require('express');
const { authMiddleware } = require('../../middlewares/auth');
const { logger } = require('../../middlewares/logger');

/**
 * @param {import('./chat-settings.controller')} chatSettingsController
 */
module.exports = (chatSettingsController) => {
    const router = express.Router();

    // Middleware de log
    router.use((req, res, next) => {
        logger.info('Nova requisição de configurações de chat recebida', {
            method: req.method,
            path: req.path,
            body: req.body
        });
        next();
    });

    // Middleware de autenticação para todas as rotas
    router.use('/', authMiddleware);

    // Buscar configurações de um chat
    router.get('/:chatId', 
        (req, res) => chatSettingsController.getSettings(req, res)
    );

    // Atualizar configurações de um chat
    router.put('/:chatId', 
        (req, res) => chatSettingsController.updateSettings(req, res)
    );

    // Deletar configurações de um chat
    router.delete('/:chatId', 
        (req, res) => chatSettingsController.deleteSettings(req, res)
    );

    return router;
};
