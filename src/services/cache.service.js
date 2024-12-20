const redis = require('../config/redis');
const { logger } = require('../middlewares/logger');

class CacheService {
    constructor() {
        this.defaultTTL = 3600; // 1 hora em segundos
    }

    /**
     * Gera uma chave única para o cache
     * @param {string} prefix Prefixo da chave
     * @param {Object} params Parâmetros para compor a chave
     * @returns {string} Chave formatada
     */
    generateKey(prefix, params = {}) {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc, key) => {
                acc[key] = params[key];
                return acc;
            }, {});

        return `${prefix}:${JSON.stringify(sortedParams)}`;
    }

    /**
     * Obtém um valor do cache
     * @param {string} key Chave do cache
     * @returns {Promise<any>} Valor armazenado
     */
    async get(key) {
        try {
            const value = await redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Erro ao obter valor do cache', {
                error: error.message,
                key
            });
            return null;
        }
    }

    /**
     * Armazena um valor no cache
     * @param {string} key Chave do cache
     * @param {any} value Valor a ser armazenado
     * @param {number} ttl Tempo de vida em segundos
     */
    async set(key, value, ttl = this.defaultTTL) {
        try {
            await redis.set(
                key,
                JSON.stringify(value),
                'EX',
                ttl
            );
            
            logger.debug('Valor armazenado no cache', { key });
        } catch (error) {
            logger.error('Erro ao armazenar valor no cache', {
                error: error.message,
                key
            });
        }
    }

    /**
     * Remove um valor do cache
     * @param {string} key Chave do cache
     */
    async delete(key) {
        try {
            await redis.del(key);
            logger.debug('Valor removido do cache', { key });
        } catch (error) {
            logger.error('Erro ao remover valor do cache', {
                error: error.message,
                key
            });
        }
    }

    /**
     * Remove valores do cache por padrão
     * @param {string} pattern Padrão da chave
     */
    async deletePattern(pattern) {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
                logger.debug('Valores removidos do cache por padrão', {
                    pattern,
                    count: keys.length
                });
            }
        } catch (error) {
            logger.error('Erro ao remover valores do cache por padrão', {
                error: error.message,
                pattern
            });
        }
    }

    /**
     * Obtém um valor do cache ou executa função para obtê-lo
     * @param {string} key Chave do cache
     * @param {Function} fn Função para obter o valor
     * @param {number} ttl Tempo de vida em segundos
     */
    async getOrSet(key, fn, ttl = this.defaultTTL) {
        try {
            const cached = await this.get(key);
            if (cached) {
                logger.debug('Valor obtido do cache', { key });
                return cached;
            }

            const value = await fn();
            await this.set(key, value, ttl);
            return value;
        } catch (error) {
            logger.error('Erro ao obter/armazenar valor no cache', {
                error: error.message,
                key
            });
            // Em caso de erro no cache, executa a função diretamente
            return fn();
        }
    }
}

module.exports = new CacheService();
