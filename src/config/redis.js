const Redis = require('ioredis');
const { logger } = require('../middlewares/logger');

class RedisWrapper {
    constructor() {
        this.client = null;
        this.enabled = process.env.REDIS_ENABLED === 'true';
        this.connected = false;
        this.connecting = false;
    }

    getConfig() {
        const config = {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            maxRetriesPerRequest: 1,
            retryStrategy: null // Desabilita tentativas automáticas de reconexão
        };

        // Adiciona autenticação apenas se a senha estiver definida
        if (process.env.REDIS_PASSWORD) {
            config.password = process.env.REDIS_PASSWORD;
        }

        return config;
    }

    async connect() {
        if (!this.enabled) {
            logger.info('Redis está desabilitado por configuração');
            return false;
        }

        if (this.connected) return true;
        if (this.connecting) return false;

        try {
            this.connecting = true;
            this.client = new Redis(this.getConfig());
            
            // Testa a conexão
            await this.client.ping();
            
            this.connected = true;
            this.connecting = false;
            logger.info('Conexão com Redis estabelecida com sucesso');
            return true;
        } catch (error) {
            this.connected = false;
            this.connecting = false;
            logger.warn('Redis não está disponível, operando sem cache', {
                error: error.message
            });
            return false;
        }
    }

    async get(key) {
        if (!this.enabled || !await this.connect()) return null;
        try {
            return await this.client.get(key);
        } catch (error) {
            logger.error('Erro ao buscar do Redis', { error: error.message });
            return null;
        }
    }

    async set(key, value, ...args) {
        if (!this.enabled || !await this.connect()) return false;
        try {
            await this.client.set(key, value, ...args);
            return true;
        } catch (error) {
            logger.error('Erro ao gravar no Redis', { error: error.message });
            return false;
        }
    }

    async del(key) {
        if (!this.enabled || !await this.connect()) return false;
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error('Erro ao deletar do Redis', { error: error.message });
            return false;
        }
    }
}

module.exports = new RedisWrapper();
