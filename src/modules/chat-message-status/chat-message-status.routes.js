const { Router } = require('express');
const { logger } = require('../../middlewares/logger');
const ChatMessageStatusService = require('./chat-message-status.service');
const { authMiddleware } = require('../../middlewares/auth');

class ChatMessageStatusRoutes {
    constructor(dependencies = {}) {
        this.router = Router();
        this.chatMessageStatusService = dependencies.chatMessageStatusService || new ChatMessageStatusService();
        this.setupRoutes();
    }

    setupRoutes() {
        // Middleware de autenticação para todas as rotas
        this.router.use(authMiddleware);

        // Middleware de log para todas as rotas
        this.router.use((req, res, next) => {
            logger.info('Requisição de chat-message-status recebida', {
                method: req.method,
                path: req.path,
                body: req.body,
                params: req.params,
                query: req.query
            });
            next();
        });

        // Rota para criar status de mensagem
        this.router.post('/', async (req, res) => {
            try {
                const statusData = req.body;
                
                logger.info('Criando status de mensagem', { statusData });
                
                const createdStatus = await this.chatMessageStatusService.create(statusData);
                
                logger.info('Status de mensagem criado', { createdStatus });
                
                res.status(201).json(createdStatus);
            } catch (error) {
                this.handleError(res, error, 'Erro ao criar status de mensagem');
            }
        });

        // Rota para buscar status de mensagem
        this.router.get('/', async (req, res) => {
            try {
                const { page = 1, limit = 20, ...filters } = req.query;
                
                logger.info('Buscando status de mensagens', { page, limit, filters });
                
                const statuses = await this.chatMessageStatusService.findAll(
                    filters, 
                    parseInt(page), 
                    parseInt(limit)
                );
                
                logger.info('Status de mensagens encontrados', { 
                    count: statuses.items.length,
                    total: statuses.meta.totalItems
                });
                
                res.json(statuses);
            } catch (error) {
                this.handleError(res, error, 'Erro ao buscar status de mensagens');
            }
        });

        // Rota para atualizar status de mensagem
        this.router.put('/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const statusData = req.body;
                
                logger.info('Atualizando status de mensagem', { id, statusData });
                
                const updatedStatus = await this.chatMessageStatusService.update(id, statusData);
                
                logger.info('Status de mensagem atualizado', { updatedStatus });
                
                res.json(updatedStatus);
            } catch (error) {
                this.handleError(res, error, 'Erro ao atualizar status de mensagem');
            }
        });

        // Rota para deletar status de mensagem
        this.router.delete('/:id', async (req, res) => {
            try {
                const { id } = req.params;
                
                logger.info('Deletando status de mensagem', { id });
                
                await this.chatMessageStatusService.delete(id);
                
                logger.info('Status de mensagem deletado', { id });
                
                res.status(204).send();
            } catch (error) {
                this.handleError(res, error, 'Erro ao deletar status de mensagem');
            }
        });
    }

    // Método para tratamento de erros
    handleError(res, error, message) {
        logger.error(message, { error: error.message });
        res.status(error.status || 500).json({ 
            error: message, 
            details: error.message 
        });
    }

    // Retorna o roteador
    getRouter() {
        return this.router;
    }
}

// Exporta uma função que permite injeção de dependências
module.exports = (dependencies = {}) => {
    const routes = new ChatMessageStatusRoutes(dependencies);
    return routes.getRouter();
};
