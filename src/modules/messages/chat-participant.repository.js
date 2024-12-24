const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');

class ChatParticipantRepository extends BaseRepository {
    constructor() {
        super('chat_participants');
    }

    async create(data) {
        const client = await this.pool.connect();
        try {
            const query = `
                INSERT INTO chat_participants (
                    chat_id,
                    person_contact_id,
                    role,
                    status
                )
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const values = [
                data.chat_id,
                data.person_contact_id,
                data.role,
                data.status || 'ACTIVE'
            ];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar participante do chat', {
                error: error.message,
                data
            });
            throw error;
        } finally {
            client.release();
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
                JOIN person_contacts pc ON cp.person_contact_id = pc.person_contact_id
                JOIN persons p ON pc.person_id = p.person_id
                WHERE cp.chat_id = $1
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

    async findByPersonContactId(personContactId) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT 
                    cp.*,
                    c.status as chat_status,
                    c.last_message_id
                FROM chat_participants cp
                JOIN chats c ON cp.chat_id = c.chat_id
                WHERE cp.person_contact_id = $1
            `;
            const values = [personContactId];

            const result = await client.query(query, values);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar chats do participante', {
                error: error.message,
                personContactId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async updateStatus(chatId, personContactId, status) {
        const client = await this.pool.connect();
        try {
            const query = `
                UPDATE chat_participants
                SET status = $1
                WHERE chat_id = $2 AND person_contact_id = $3
                RETURNING *
            `;
            const values = [status, chatId, personContactId];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar status do participante', {
                error: error.message,
                chatId,
                personContactId,
                status
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
                DELETE FROM chat_participants
                WHERE chat_id = $1 AND person_contact_id = $2
            `;
            const values = [chatId, personContactId];

            await client.query(query, values);
            return true;
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
}

module.exports = ChatParticipantRepository;
