const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');

class ChatParticipantRepository extends BaseRepository {
    constructor() {
        super('chat_participants', ['chat_id', 'person_contact_id']);
    }

    async create(data) {
        try {
            // Garantir que todos os campos necessários estejam presentes
            const participantData = {
                chat_id: data.chat_id,
                person_contact_id: data.person_contact_id || null,
                contact_id: data.contact_id || null,
                role: data.role || 'PARTICIPANT',
                status: data.status || 'ACTIVE'
            };

            logger.info('Criando participante de chat', { participantData });

            // Usar método create do BaseRepository
            const participant = await super.create(participantData, ['chat_id', 'person_contact_id']);
            
            return participant;
        } catch (error) {
            logger.error('Erro ao criar participante do chat', {
                error: error.message,
                data
            });
            throw error;
        }
    }

    async findByChatId(chatId) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT 
                    cp.*,
                    pc.contact_value as email,
                    p.full_name as person_name,
                    p.person_id
                FROM chat_participants cp
                LEFT JOIN person_contacts pc ON cp.person_contact_id = pc.id AND pc.type = 'EMAIL'
                LEFT JOIN persons p ON pc.person_id = p.person_id
                WHERE cp.chat_id = $1 AND cp.status = 'ACTIVE'
                ORDER BY cp.created_at
            `;
            const values = [chatId];

            const result = await client.query(query, values);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar participantes do chat', {
                error: error.message,
                chatId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async delete(chatId, personContactId) {
        const client = await this.pool.connect();
        try {
            const query = `
                UPDATE chat_participants
                SET status = 'INACTIVE'
                WHERE chat_id = $1 AND person_contact_id = $2
                RETURNING *
            `;
            const values = [chatId, personContactId];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao remover participante do chat', {
                error: error.message,
                chatId,
                personContactId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findByPersonId(personId) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT 
                    cp.*,
                    c.status as chat_status,
                    c.last_message_id,
                    lm.content as last_message,
                    lm.created_at as last_message_date
                FROM chat_participants cp
                JOIN chats c ON cp.chat_id = c.chat_id
                LEFT JOIN chat_messages lm ON c.last_message_id = lm.message_id
                WHERE cp.person_contact_id = $1 AND cp.status = 'ACTIVE'
                ORDER BY COALESCE(lm.created_at, c.created_at) DESC
            `;
            const values = [personId];

            const result = await client.query(query, values);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar chats da pessoa', {
                error: error.message,
                personId
            });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = ChatParticipantRepository;
