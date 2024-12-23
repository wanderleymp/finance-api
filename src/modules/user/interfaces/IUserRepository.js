const CreateUserDTO = require('../dto/create-user.dto');
const UpdateUserDTO = require('../dto/update-user.dto');
const UserResponseDTO = require('../dto/user-response.dto');

/**
 * Interface para o repositório de usuários
 * @interface IUserRepository
 */
class IUserRepository {
    /**
     * Cria um novo usuário no banco
     * @param {CreateUserDTO} data - Dados do usuário
     * @returns {Promise<UserResponseDTO>} Usuário criado
     */
    async create(data) {
        throw new Error('Method not implemented');
    }

    /**
     * Atualiza um usuário existente
     * @param {number} id - ID do usuário
     * @param {UpdateUserDTO} data - Dados para atualização
     * @returns {Promise<UserResponseDTO>} Usuário atualizado
     */
    async update(id, data) {
        throw new Error('Method not implemented');
    }

    /**
     * Remove um usuário
     * @param {number} id - ID do usuário
     * @returns {Promise<void>}
     */
    async delete(id) {
        throw new Error('Method not implemented');
    }

    /**
     * Busca um usuário por ID
     * @param {number} id - ID do usuário
     * @returns {Promise<UserResponseDTO>} Usuário encontrado
     */
    async findById(id) {
        throw new Error('Method not implemented');
    }

    /**
     * Lista usuários com paginação
     * @param {Object} options - Opções de listagem
     * @param {number} [options.page=1] - Página atual
     * @param {number} [options.limit=10] - Itens por página
     * @returns {Promise<{rows: UserResponseDTO[], count: number}>} Lista de usuários e total
     */
    async list(options) {
        throw new Error('Method not implemented');
    }

    /**
     * Busca um usuário por username
     * @param {string} username - Username do usuário
     * @returns {Promise<UserResponseDTO>} Usuário encontrado
     */
    async findByUsername(username) {
        throw new Error('Method not implemented');
    }

    /**
     * Atualiza o refresh token de um usuário
     * @param {number} userId - ID do usuário
     * @param {string} refreshToken - Novo refresh token
     * @returns {Promise<void>}
     */
    async updateRefreshToken(userId, refreshToken) {
        throw new Error('Method not implemented');
    }
}

module.exports = IUserRepository;