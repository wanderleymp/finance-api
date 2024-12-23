/**
 * DTO para resposta de usuário
 * @typedef {Object} UserResponseDTO
 * @property {number} id - ID do usuário
 * @property {string} username - Nome de usuário
 * @property {number} person_id - ID da pessoa associada
 * @property {number} profile_id - ID do perfil do usuário
 * @property {boolean} enable_2fa - Status da autenticação de dois fatores
 * @property {boolean} active - Status do usuário
 * @property {Date} created_at - Data de criação
 * @property {Date} updated_at - Data de atualização
 */
class UserResponseDTO {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.person_id = data.person_id;
        this.profile_id = data.profile_id;
        this.enable_2fa = data.enable_2fa;
        this.active = data.active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    /**
     * Converte um objeto de usuário em DTO de resposta
     * @param {Object} data Dados do usuário
     * @returns {UserResponseDTO} DTO de resposta
     */
    static from(data) {
        // Remover campos sensíveis
        const { password, refresh_token, ...safeData } = data || {};
        return new UserResponseDTO(safeData);
    }

    /**
     * Converte uma lista de usuários em DTOs de resposta
     * @param {Array} users Lista de usuários
     * @returns {Array<UserResponseDTO>} Lista de DTOs de resposta
     */
    static fromMany(users) {
        return users.map(user => UserResponseDTO.from(user));
    }
}

module.exports = UserResponseDTO;
