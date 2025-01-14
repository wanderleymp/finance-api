const Redis = require('ioredis');
const { logger } = require('../middlewares/logger');

class CacheService {
    constructor() {
        try {
            console.log('REDIS_HOST:', process.env.REDIS_HOST);
            console.log('REDIS_PORT:', process.env.REDIS_PORT);
            console.log('REDIS_DB:', process.env.REDIS_DB);
            console.log('REDIS_PASSWORD_LENGTH:', process.env.REDIS_PASSWORD ? process.env.REDIS_PASSWORD.length : 'NO PASSWORD');

            this.redis = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD,
                db: parseInt(process.env.REDIS_DB || '0')
            });

            this.defaultTTL = parseInt(process.env.REDIS_CACHE_TTL || '3600');

            this.redis.on('error', (error) => {
                console.error('DETAILED REDIS ERROR:', {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                    code: error.code,
                    host: process.env.REDIS_HOST || 'localhost',
                    port: process.env.REDIS_PORT || 6379
                });
                console.error('REDIS CONNECTION ATTEMPT FAILED');
                logger.error('Erro na conexão com Redis', { 
                    error: error.message,
                    host: process.env.REDIS_HOST || 'localhost',
                    port: process.env.REDIS_PORT || 6379
                });
            });

            this.redis.on('connect', () => {
                console.log('Redis connected successfully');
            });
        } catch (error) {
            console.error('FATAL ERROR INITIALIZING REDIS:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
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

    async del(key) {
        try {
            await this.redis.del(key);
        } catch (error) {
            logger.error('Erro ao deletar do cache', { 
                key, 
                error: error.message 
            });
        }
    }

    async clearPattern(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
                logger.info('Cache limpo com sucesso', { pattern, keysRemoved: keys.length });
            }
        } catch (error) {
            logger.error('Erro ao limpar cache por padrão', { 
                pattern, 
                error: error.message 
            });
        }
    }

    async clearAll() {
        try {
            await this.redis.flushall();
            logger.info('Todo o cache foi limpo');
        } catch (error) {
            logger.error('Erro ao limpar todo o cache', { 
                error: error.message 
            });
        }
    }
}

module.exports = new CacheService();
