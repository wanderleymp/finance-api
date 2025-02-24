const MemoryCacheProvider = require('./memory.provider');
const RedisCacheProvider = require('./redis.provider');

class CacheFactory {
    static create(config = {}) {
        const { enabled = false, provider = 'memory', redis = {} } = config;

        // Se o cache estiver desabilitado, retorna o provider de memória
        if (!enabled) {
            return new MemoryCacheProvider();
        }

        // Seleciona o provider apropriado
        switch (provider.toLowerCase()) {
            case 'redis':
                return new RedisCacheProvider(redis);
            case 'memory':
            default:
                return new MemoryCacheProvider();
        }
    }
}

module.exports = CacheFactory;
