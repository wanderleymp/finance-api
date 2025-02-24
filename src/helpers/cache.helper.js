const CacheFactory = require('../providers/cache/cache.factory');

class CacheHelper {
    static instance = null;

    static initialize(config) {
        if (!CacheHelper.instance) {
            CacheHelper.instance = CacheFactory.create(config);
        }
        return CacheHelper.instance;
    }

    static getInstance() {
        if (!CacheHelper.instance) {
            throw new Error('Cache não inicializado. Chame initialize() primeiro.');
        }
        return CacheHelper.instance;
    }

    /**
     * Obtém um valor do cache ou executa a função fallback
     * @param {string} key - Chave do cache
     * @param {Function} fallback - Função a ser executada se o cache não existir
     * @param {number} [ttl] - Tempo de vida em segundos (opcional)
     * @returns {Promise<any>}
     */
    static async getOrSet(key, fallback, ttl = 0) {
        const cache = CacheHelper.getInstance();
        
        // Tenta obter do cache
        const cached = await cache.get(key);
        if (cached !== null) {
            return cached;
        }

        // Se não encontrou no cache, executa o fallback
        const value = await fallback();
        
        // Salva no cache se o valor não for null/undefined
        if (value != null) {
            await cache.set(key, value, ttl);
        }

        return value;
    }
}

module.exports = CacheHelper;
