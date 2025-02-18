const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');
const ChannelResponseDTO = require('./dto/channel-response.dto');

class ChannelRepository extends BaseRepository {
    constructor() {
        super('channels', 'channel_id');
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        const client = await this.pool.connect();
        try {
            // Constrói as condições WHERE
            const conditions = [];
            const params = [];
            let paramCount = 1;

            if (filters.search) {
                conditions.push(`(
                    channel_name ILIKE $${paramCount}
                )`);
                params.push(`%${filters.search}%`);
                paramCount++;
            }

            if (filters.is_active !== undefined) {
                conditions.push(`is_active = $${paramCount}`);
                params.push(filters.is_active);
                paramCount++;
            }

            const whereClause = conditions.length > 0 
                ? 'WHERE ' + conditions.join(' AND ')
                : '';

            // Query principal
            const query = `
                SELECT *
                FROM channels
                ${whereClause}
                ORDER BY channel_id DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            // Query de contagem
            const countQuery = `
                SELECT COUNT(*) as total
                FROM channels
                ${whereClause}
            `;

            params.push(limit, (page - 1) * limit);

            const [resultQuery, resultCount] = await Promise.all([
                client.query(query, params),
                client.query(countQuery, params.slice(0, -2))
            ]);

            const totalItems = parseInt(resultCount.rows[0].total);

            return {
                items: resultQuery.rows.map(channel => new ChannelResponseDTO(channel)),
                meta: {
                    totalItems,
                    itemCount: resultQuery.rows.length,
                    itemsPerPage: limit,
                    totalPages: Math.ceil(totalItems / limit),
                    currentPage: page
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar canais', { 
                error: error.message, 
                filters 
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findByName(channelName) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT * FROM channels 
                WHERE channel_name = $1 
                LIMIT 1
            `;
            const values = [channelName];

            const result = await client.query(query, values);
            return result.rows[0] ? new ChannelResponseDTO(result.rows[0]) : null;
        } catch (error) {
            logger.error('Erro ao buscar canal por nome', { 
                error: error.message, 
                channelName 
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findByInstanceName(instanceName, { client = null } = {}) {
        const queryClient = client || await this.pool.connect();
        
        try {
            const query = `
                SELECT * FROM channels 
                WHERE channel_name = $1 
                ORDER BY channel_id DESC
                LIMIT 1
            `;
            const values = [instanceName];

            logger.info('BUSCANDO CANAL POR NOME', {
                instanceName,
                query,
                values
            });

            const result = await queryClient.query(query, values);
            
            if (result.rows.length > 0) {
                logger.info('CANAL ENCONTRADO', {
                    channelId: result.rows[0].channel_id,
                    channelName: result.rows[0].channel_name
                });
                return new ChannelResponseDTO(result.rows[0]);
            }

            logger.info('NENHUM CANAL ENCONTRADO', { instanceName });
            return null;
        } catch (error) {
            logger.error('ERRO AO BUSCAR CANAL POR NOME', { 
                error: error.message, 
                instanceName,
                errorStack: error.stack
            });
            throw error;
        } finally {
            if (!client) {
                queryClient.release();
            }
        }
    }

    async create(data) {
        const client = await this.pool.connect();
        try {
            logger.info('CRIANDO NOVO CANAL', {
                channelData: JSON.stringify(data)
            });

            // Verifica se já existe um canal com o mesmo nome
            const existingChannel = await this.findByInstanceName(data.channel_name);
            if (existingChannel) {
                logger.info('CANAL JÁ EXISTE', {
                    channelId: existingChannel.channel_id,
                    channelName: existingChannel.channel_name
                });
                return existingChannel;
            }

            const query = `
                INSERT INTO ${this.tableName} (
                    channel_name, 
                    contact_type,
                    is_active
                ) VALUES ($1, $2, $3)
                RETURNING *
            `;

            const values = [
                data.channel_name || 'Canal Padrão',
                data.contact_type || 'outros',
                data.is_active !== undefined ? data.is_active : true
            ];

            const result = await client.query(query, values);
            
            logger.info('CANAL CRIADO COM SUCESSO', {
                channelId: result.rows[0].channel_id,
                channelName: result.rows[0].channel_name
            });

            return new ChannelResponseDTO(result.rows[0]);
        } catch (error) {
            logger.error('ERRO AO CRIAR CANAL', { 
                error: error.message, 
                data: JSON.stringify(data),
                errorStack: error.stack
            });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = ChannelRepository;
