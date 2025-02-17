const express = require('express');
const { logger } = require('../../middlewares/logger');
const { authMiddleware } = require('../../middlewares/auth');
const ChatMessageStatusService = require('./chat-message-status.service');
const { chatMessageStatusSchema } = require('./chat-message-status.schema');

class ChatMessageStatusRoutes {
    constructor() {
        this.router = express.Router();
        this.chatMessageStatusService = new ChatMessageStatusService();
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
        this.router.post('/create', async (req, res) => {
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

        // Rota para processar status de mensagens
        this.router.post('/', async (req, res) => {
            try {
                const { data } = req.body;

                // Validação básica do payload
                if (!data || !data.messageId || !data.status) {
                    return res.status(400).json({ 
                        error: 'Payload inválido. Campos obrigatórios: messageId, status' 
                    });
                }

                const result = await this.chatMessageStatusService.processMessageStatus({
                    messageId: data.messageId,
                    status: data.status,
                    fromMe: data.fromMe || false,
                    participant: data.participant,
                    remoteJid: data.remoteJid
                });

                if (!result) {
                    return res.status(404).json({ 
                        error: 'Mensagem não encontrada' 
                    });
                }

                res.status(200).json(result);
            } catch (error) {
                logger.error('Erro ao processar status de mensagem', { 
                    error: error.message, 
                    payload: req.body 
                });

                res.status(500).json({ 
                    error: 'Erro interno ao processar status de mensagem' 
                });
            }
        });
    }

    // Método para tratamento de erros
    handleError(res, error, message) {
        logger.error(message, { error: error.message });
        res.status(500).json({ 
            error: message, 
            details: error.message 
        });
    }

    // Método para retornar o roteador
    getRouter() {
        return this.router;
    }
}

module.exports = new ChatMessageStatusRoutes().getRouter();
