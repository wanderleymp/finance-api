const CreateUserDTO = require('../dto/create-user.dto');
const UpdateUserDTO = require('../dto/update-user.dto');
const UserResponseDTO = require('../dto/user-response.dto');

/**
 * Interface para o serviço de usuários
 * @interface IUserService
 */
class IUserService {
    /**
     * Cria um novo usuário
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
     * @returns {Promise<{data: UserResponseDTO[], pagination: Object}>} Lista de usuários e dados de paginação
     */
    async list(options) {
        throw new Error('Method not implemented');
    }

    /**
     * Atualiza o token de acesso usando refresh token
     * @param {string} refreshToken - Refresh token válido
     * @returns {Promise<{accessToken: string, refreshToken: string, expiresIn: number}>} Novos tokens
     */
    async refreshToken(refreshToken) {
        throw new Error('Method not implemented');
    }
}

module.exports = IUserService;