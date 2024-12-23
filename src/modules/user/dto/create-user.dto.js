const { ValidationError } = require('../../../utils/errors');

/**
 * DTO para criação de usuário
 * @typedef {Object} CreateUserDTO
 * @property {string} username - Nome de usuário (3-50 caracteres)
 * @property {string} password - Senha (min 8 caracteres, deve conter maiúscula, minúscula, número e caractere especial)
 * @property {number} person_id - ID da pessoa associada
 * @property {number} profile_id - ID do perfil do usuário
 * @property {boolean} [enable_2fa=false] - Habilitar autenticação de dois fatores
 * @property {boolean} [active=true] - Status do usuário
 */
class CreateUserDTO {
    constructor(data) {
        if (!data) {
            throw new ValidationError('Dados são obrigatórios');
        }

        this.validate(data);

        this.username = data.username;
        this.password = data.password;
        this.person_id = data.person_id;
        this.profile_id = data.profile_id;
        this.enable_2fa = data.enable_2fa ?? false;
        this.active = data.active ?? true;
    }

    /**
     * Valida os dados de entrada
     * @param {Object} data - Dados brutos
     * @throws {ValidationError} Se os dados forem inválidos
     */
    validate(data) {
        // Validar campos obrigatórios
        const requiredFields = ['username', 'password', 'person_id', 'profile_id'];
        for (const field of requiredFields) {
            if (!data[field]) {
                throw new ValidationError(`Campo ${field} é obrigatório`);
            }
        }

        // Validar username
        if (typeof data.username !== 'string' || data.username.length < 3 || data.username.length > 50) {
            throw new ValidationError('Username deve ter entre 3 e 50 caracteres');
        }

        // Validar formato do username (apenas letras, números e underline)
        if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
            throw new ValidationError('Username deve conter apenas letras, números e underline');
        }

        // Validar senha
        if (typeof data.password !== 'string' || data.password.length < 8) {
            throw new ValidationError('Senha deve ter no mínimo 8 caracteres');
        }

        // Validar força da senha
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(data.password)) {
            throw new ValidationError('Senha deve conter maiúscula, minúscula, número e caractere especial');
        }

        // Validar person_id
        if (typeof data.person_id !== 'number' || data.person_id <= 0) {
            throw new ValidationError('Person ID deve ser um número positivo');
        }

        // Validar profile_id
        if (typeof data.profile_id !== 'number' || data.profile_id <= 0) {
            throw new ValidationError('Profile ID deve ser um número positivo');
        }

        // Validar campos opcionais
        if (data.enable_2fa !== undefined && typeof data.enable_2fa !== 'boolean') {
            throw new ValidationError('Enable 2FA deve ser um booleano');
        }

        if (data.active !== undefined && typeof data.active !== 'boolean') {
            throw new ValidationError('Active deve ser um booleano');
        }
    }
}

module.exports = CreateUserDTO;
