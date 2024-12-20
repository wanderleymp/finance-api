const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');

class TransactionHelper {
    /**
     * Executa uma função dentro de uma transação
     * @param {Function} callback - Função a ser executada dentro da transação
     * @returns {Promise<any>} Resultado da função
     */
    static async executeInTransaction(callback) {
        const client = await systemDatabase.pool.connect();
        
        try {
            await client.query('BEGIN');
            logger.info('Iniciando transação');

            const result = await callback(client);

            await client.query('COMMIT');
            logger.info('Transação finalizada com sucesso');

            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro na transação, realizando rollback', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Executa múltiplas funções em uma única transação
     * @param {Function[]} callbacks - Array de funções a serem executadas
     * @returns {Promise<any[]>} Array com os resultados das funções
     */
    static async executeMultipleInTransaction(callbacks) {
        const client = await systemDatabase.pool.connect();
        
        try {
            await client.query('BEGIN');
            logger.info('Iniciando transação múltipla');

            const results = [];
            for (const callback of callbacks) {
                const result = await callback(client);
                results.push(result);
            }

            await client.query('COMMIT');
            logger.info('Transação múltipla finalizada com sucesso');

            return results;
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro na transação múltipla, realizando rollback', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Verifica se um client é uma transação ativa
     * @param {Object} client - Client do pg
     * @returns {boolean} True se for uma transação ativa
     */
    static isTransaction(client) {
        return client && typeof client.query === 'function';
    }

    /**
     * Retorna o client apropriado (transação ou pool)
     * @param {Object} client - Client opcional do pg
     * @returns {Object} Client para executar queries
     */
    static getClient(client) {
        return this.isTransaction(client) ? client : systemDatabase.pool;
    }
}

module.exports = TransactionHelper;
