const Redis = require('ioredis');
const { logger } = require('../middlewares/logger');

class CacheService {
    constructor() {
        try {
            this.redis = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || undefined,
                db: parseInt(process.env.REDIS_DB || '0'),
            });

            this.defaultTTL = parseInt(process.env.REDIS_CACHE_TTL || '3600');

            this.redis.on('error', (error) => {
                logger.error('Erro na conexão com Redis', { 
                    error: error.message,
                    host: process.env.REDIS_HOST || 'localhost',
                    port: process.env.REDIS_PORT || 6379
                });
            });
        } catch (error) {
            logger.error('Falha ao inicializar serviço de cache', { 
                error: error.message 
            });
            throw error;
        }
    }

    async set(key, value, ttl = this.defaultTTL) {
        try {
            const serializedValue = JSON.stringify(value);
            await this.redis.set(key, serializedValue, 'EX', ttl);
        } catch (error) {
            logger.error('Erro ao salvar no cache', { 
                key, 
                error: error.message 
            });
        }
    }

    async get(key) {
        try {
            const cachedValue = await this.redis.get(key);
            return cachedValue ? JSON.parse(cachedValue) : null;
        } catch (error) {
            logger.error('Erro ao buscar do cache', { 
                key, 
                error: error.message 
            });
            return null;
        }
    }

    async delete(key) {
        try {
            await this.redis.del(key);
        } catch (error) {
            logger.error('Erro ao deletar do cache', { 
                key, 
                error: error.message 
            });
        }
    }

    async clearAll() {
        try {
            await this.redis.flushdb();
        } catch (error) {
            logger.error('Erro ao limpar cache', { 
                error: error.message 
            });
        }
    }
}

module.exports = new CacheService();
