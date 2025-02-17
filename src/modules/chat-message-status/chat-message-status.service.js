const { logger } = require('../../middlewares/logger');
const ChatMessageStatusRepository = require('./chat-message-status.repository');
const ChatMessageRepository = require('../messages/chat-message.repository');

class ChatMessageStatusService {
    constructor(dependencies = {}) {
        this.repository = dependencies.repository || new ChatMessageStatusRepository();
        this.chatMessageRepository = dependencies.chatMessageRepository || new ChatMessageRepository();
    }

    async create(data) {
        try {
            logger.info('Criando status de mensagem', { data });
            
            // Validações básicas
            if (!data) {
                throw new Error('Dados do status são obrigatórios');
            }

            // Adicionar validações específicas conforme necessário
            const createdStatus = await this.repository.create(data);
            
            logger.info('Status de mensagem criado com sucesso', { createdStatus });
            return createdStatus;
        } catch (error) {
            logger.error('Erro ao criar status de mensagem', { 
                error: error.message, 
                data 
            });
            throw error;
        }
    }

    async findAll(filters = {}, page = 1, limit = 20) {
        try {
            logger.info('Buscando status de mensagens', { filters, page, limit });
            
            const result = await this.repository.findAll(filters, page, limit);
            
            logger.info('Status de mensagens encontrados', { 
                count: result.items.length,
                total: result.meta.totalItems
            });
            
            return result;
        } catch (error) {
            logger.error('Erro ao buscar status de mensagens', { 
                error: error.message, 
                filters, 
                page, 
                limit 
            });
            throw error;
        }
    }

    async update(id, data) {
        try {
            logger.info('Atualizando status de mensagem', { id, data });
            
            if (!id) {
                throw new Error('ID do status é obrigatório');
            }

            const updatedStatus = await this.repository.update(id, data);
            
            logger.info('Status de mensagem atualizado com sucesso', { updatedStatus });
            return updatedStatus;
        } catch (error) {
            logger.error('Erro ao atualizar status de mensagem', { 
                error: error.message, 
                id, 
                data 
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            logger.info('Deletando status de mensagem', { id });
            
            if (!id) {
                throw new Error('ID do status é obrigatório');
            }

            await this.repository.delete(id);
            
            logger.info('Status de mensagem deletado com sucesso', { id });
        } catch (error) {
            logger.error('Erro ao deletar status de mensagem', { 
                error: error.message, 
                id 
            });
            throw error;
        }
    }

    // Mapeamento de status do WhatsApp para nossos status padrão
    _mapWhatsAppStatus(whatsappStatus) {
        const statusMap = {
            'DELIVERY_ACK': 'DELIVERED',
            'READ': 'READ',
            'SENT': 'SENT'
        };
        return statusMap[whatsappStatus] || 'SENT';
    }

    async processMessageStatus(statusData) {
        try {
            const { 
                messageId, 
                status: whatsappStatus, 
                fromMe, 
                participant, 
                remoteJid 
            } = statusData;

            // Buscar a mensagem correspondente
            const message = await this.chatMessageRepository.findByExternalId(messageId);

            if (!message) {
                logger.warn('Mensagem não encontrada para atualização de status', { 
                    externalMessageId: messageId 
                });
                return null;
            }

            // Mapear status do WhatsApp para nosso status padrão
            const status = this._mapWhatsAppStatus(whatsappStatus);

            // Criar/atualizar status da mensagem
            const messageStatus = await this.repository.createOrUpdateMessageStatus({
                message_id: message.message_id,
                status
            });

            logger.info('Status de mensagem processado com sucesso', { 
                messageId: message.message_id, 
                status,
                externalMessageId: messageId
            });

            return messageStatus;
        } catch (error) {
            logger.error('Erro ao processar status de mensagem', { 
                error: error.message, 
                statusData 
            });
            throw error;
        }
    }
}

module.exports = ChatMessageStatusService;
