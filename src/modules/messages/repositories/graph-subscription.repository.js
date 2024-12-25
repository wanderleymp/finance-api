const { logger } = require('../../../middlewares/logger');
const BaseRepository = require('../../../repositories/base/BaseRepository');

class GraphSubscriptionRepository extends BaseRepository {
    constructor() {
        super('public.graph_subscriptions', 'subscription_id');
    }

    async create(data) {
        const client = await this.pool.connect();
        try {
            const query = `
                INSERT INTO public.graph_subscriptions (
                    subscription_id, resource, change_type, 
                    notification_url, expiration_date, client_state,
                    status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
            
            const values = [
                data.id,
                data.resource,
                data.changeType,
                data.notificationUrl,
                data.expirationDateTime,
                data.clientState,
                'active'
            ];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar subscription', {
                error: error.message,
                data
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findActive() {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT *
                FROM public.graph_subscriptions
                WHERE status = 'active'
                AND expiration_date > NOW()
            `;
            
            const result = await client.query(query);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar subscriptions ativas', {
                error: error.message
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findExpiring(hoursThreshold = 24) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT *
                FROM public.graph_subscriptions
                WHERE status = 'active'
                AND expiration_date <= NOW() + INTERVAL '${hoursThreshold} hours'
                AND expiration_date > NOW()
            `;
            
            const result = await client.query(query);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar subscriptions expirando', {
                error: error.message,
                hoursThreshold
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async updateExpirationDate(subscriptionId, newExpirationDate) {
        const client = await this.pool.connect();
        try {
            const query = `
                UPDATE public.graph_subscriptions
                SET expiration_date = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE subscription_id = $2
                RETURNING *
            `;
            
            const result = await client.query(query, [newExpirationDate, subscriptionId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar data de expiração', {
                error: error.message,
                subscriptionId,
                newExpirationDate
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async deactivate(subscriptionId) {
        const client = await this.pool.connect();
        try {
            const query = `
                UPDATE public.graph_subscriptions
                SET status = 'inactive',
                    updated_at = CURRENT_TIMESTAMP
                WHERE subscription_id = $1
                RETURNING *
            `;
            
            const result = await client.query(query, [subscriptionId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao desativar subscription', {
                error: error.message,
                subscriptionId
            });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = GraphSubscriptionRepository;
