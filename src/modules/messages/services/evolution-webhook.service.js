const { logger } = require('../../../middlewares/logger');
const ChatMessageRepository = require('../chat-message.repository');

class EvolutionWebhookService {
    constructor() {
        this.chatMessageRepository = new ChatMessageRepository();
    }

    mapStatusType(status) {
        const statusMap = {
            'DELIVERY_ACK': 'DELIVERED',
            'READ': 'READ',
            'PLAYED': 'READ',  // Para mensagens de áudio
            'RECEIVED': 'DELIVERED'
        };
        return statusMap[status] || status;
    }

    extractEventData(event) {
        // Tenta extrair dados de diferentes estruturas de payload
        if (event.data) return event.data;
        if (event.type === 'messages.update') return event;
        return null;
    }

    async updateMessageStatus(webhookEvents) {
        if (!Array.isArray(webhookEvents)) {
            throw new Error('Payload inválido: esperado um array de eventos');
        }

        const results = [];
        for (const originalEvent of webhookEvents) {
            // Extrair dados do evento
            const event = this.extractEventData(originalEvent);
            
            if (!event) {
                logger.warn('Evento inválido ou não suportado', { originalEvent });
                continue;
            }

            // Garantir que todos os campos necessários estejam presentes
            const {
                type = 'messages.update',
                status,
                date_time,
                id, // ID da mensagem da Evolution
                instance,
                server_url,
                apikey
            } = event;

            if (type !== 'messages.update') {
                logger.info('Evento ignorado: não é uma atualização de mensagem', { type });
                continue;
            }

            if (!id) {
                logger.warn('ID da mensagem não fornecido no evento', { event });
                continue;
            }

            try {
                const client = await this.chatMessageRepository.pool.connect();
                try {
                    // Buscar mensagem pelo external_id (ID da Evolution)
                    const findQuery = `
                        SELECT message_id, external_id, status
                        FROM chat_messages
                        WHERE external_id = $1
                    `;

                    const findResult = await client.query(findQuery, [id]);

                    if (findResult.rowCount === 0) {
                        logger.warn('Mensagem não encontrada para atualização', {
                            external_id: id,
                            event
                        });
                        continue;
                    }

                    const mappedStatus = this.mapStatusType(status);
                    const updateQuery = `
                        UPDATE chat_messages
                        SET 
                            status = $1,
                            delivered_at = CASE 
                                WHEN $2 = 'DELIVERED' THEN $3::timestamp
                                ELSE delivered_at
                            END,
                            read_at = CASE 
                                WHEN $2 = 'READ' THEN $3::timestamp
                                ELSE read_at
                            END
                        WHERE external_id = $4
                        RETURNING *
                    `;

                    const updateValues = [
                        JSON.stringify({
                            type: mappedStatus,
                            timestamp: date_time
                        }),
                        mappedStatus,
                        date_time,
                        id
                    ];

                    const result = await client.query(updateQuery, updateValues);
                    
                    logger.info('Status da mensagem atualizado com sucesso', {
                        messageId: result.rows[0].message_id,
                        externalId: id,
                        oldStatus: findResult.rows[0].status,
                        newStatus: mappedStatus,
                        timestamp: date_time
                    });

                    results.push(result.rows[0]);
                } finally {
                    client.release();
                }
            } catch (error) {
                logger.error('Erro ao atualizar status da mensagem', {
                    error: error.message,
                    externalId: id,
                    event
                });
                throw error;
            }
        }

        return results;
    }
}

module.exports = EvolutionWebhookService;
