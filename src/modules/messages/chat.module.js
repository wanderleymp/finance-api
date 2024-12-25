const testRoutes = require('./test.routes');
const chatController = require('./chat.controller');
const registerProcessors = require('./register-processors');
const { logger } = require('../../middlewares/logger');

module.exports = (app) => {
    logger.info('Registrando módulo de mensagens');
    
    // Pega o taskService e taskWorker do app
    const taskService = app.get('taskService');
    const taskWorker = app.get('taskWorker');
    if (!taskService || !taskWorker) {
        throw new Error('TaskService e TaskWorker não encontrados. O módulo de tasks deve ser registrado antes do módulo de mensagens.');
    }
    
    // Registra processadores de tasks
    registerProcessors(taskService, taskWorker);
    
    // Registra rotas de chat
    app.use('/messages/chat', chatController);
    
    // Registra rotas de teste
    app.use('/messages/test', testRoutes(taskService));

    logger.info('Módulo de mensagens registrado com sucesso', {
        routes: [
            '/messages/chat',
            '/messages/chat/:chatId/messages',
            '/messages/chat/billing/:personId',
            '/messages/test/*'
        ]
    });
};
