const testRoutes = require('./test.routes');
const chatController = require('./chat.controller');
const registerProcessors = require('./register-processors');
const { logger } = require('../../middlewares/logger');

module.exports = (app, { taskService, taskWorker } = {}) => {
    logger.info('Registrando módulo de mensagens', { 
        taskService: !!taskService, 
        taskWorker: !!taskWorker 
    });
    
    // Se não receber taskService e taskWorker, tenta obter do app
    const appTaskService = taskService || app.get('taskService');
    const appTaskWorker = taskWorker || app.get('taskWorker');

    if (!appTaskService || !appTaskWorker) {
        logger.warn('TaskService ou TaskWorker não encontrados. O módulo de tasks pode não estar completamente inicializado.');
        return;
    }
    
    // Registra processadores de tasks
    registerProcessors(appTaskService, appTaskWorker);
    
    // Registra rotas de chat
    app.use('/messages/chat', chatController);
    
    // Registra rotas de teste
    app.use('/messages/test', testRoutes(appTaskService));

    logger.info('Módulo de mensagens registrado com sucesso', {
        routes: [
            '/messages/chat',
            '/messages/chat/:chatId/messages',
            '/messages/chat/billing/:personId',
            '/messages/test/*'
        ]
    });
};
