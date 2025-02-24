/**
 * Interface para providers de cache
 * @interface
 */
class ICacheProvider {
    /**
     * Salva um valor no cache
     * @param {string} key - Chave para armazenar o valor
     * @param {any} value - Valor a ser armazenado
     * @param {number} [ttl] - Tempo de vida em segundos (opcional)
     * @returns {Promise<void>}
     */
    async set(key, value, ttl) {
        throw new Error('Método set não implementado');
    }

    /**
     * Recupera um valor do cache
     * @param {string} key - Chave do valor a ser recuperado
     * @returns {Promise<any>} - Valor armazenado ou null se não encontrado
     */
    async get(key) {
        throw new Error('Método get não implementado');
    }

    /**
     * Remove um valor do cache
     * @param {string} key - Chave do valor a ser removido
     * @returns {Promise<void>}
     */
    async del(key) {
        throw new Error('Método del não implementado');
    }

    /**
     * Limpa todo o cache
     * @returns {Promise<void>}
     */
    async clear() {
        throw new Error('Método clear não implementado');
    }
}

module.exports = ICacheProvider;
