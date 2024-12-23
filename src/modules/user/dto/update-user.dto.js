const { ValidationError } = require('../../../utils/errors');

/**
 * DTO para atualização de usuário
 * @typedef {Object} UpdateUserDTO
 * @property {string} [username] - Nome de usuário (3-50 caracteres)
 * @property {string} [password] - Senha (min 8 caracteres, deve conter maiúscula, minúscula, número e caractere especial)
 * @property {number} [profile_id] - ID do perfil do usuário
 * @property {boolean} [enable_2fa] - Habilitar autenticação de dois fatores
 * @property {boolean} [active] - Status do usuário
 */
class UpdateUserDTO {
    constructor(data) {
        if (!data) {
            throw new ValidationError('Dados são obrigatórios');
        }

        this.validate(data);

        if (data.username !== undefined) this.username = data.username;
        if (data.profile_id !== undefined) this.profile_id = data.profile_id;
        if (data.enable_2fa !== undefined) this.enable_2fa = data.enable_2fa;
        if (data.active !== undefined) this.active = data.active;
    }

    /**
     * Valida os dados de entrada
     * @param {Object} data - Dados brutos
     * @throws {ValidationError} Se os dados forem inválidos
     */
    validate(data) {
        // Validar se há pelo menos um campo para atualizar
        const allowedFields = ['username', 'profile_id', 'enable_2fa', 'active'];
        const hasValidField = allowedFields.some(field => data[field] !== undefined);
        if (!hasValidField) {
            throw new ValidationError('Pelo menos um campo deve ser fornecido para atualização');
        }

        // Validar campos não permitidos
        const forbiddenFields = ['password', 'refresh_token', 'created_at', 'updated_at', 'person_id'];
        for (const field of forbiddenFields) {
            if (data[field] !== undefined) {
                throw new ValidationError(`Campo ${field} não pode ser atualizado diretamente`);
            }
        }

        // Validar username se fornecido
        if (data.username !== undefined) {
            if (typeof data.username !== 'string' || data.username.length < 3 || data.username.length > 50) {
                throw new ValidationError('Username deve ter entre 3 e 50 caracteres');
            }

            // Validar formato do username (apenas letras, números e underline)
            if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
                throw new ValidationError('Username deve conter apenas letras, números e underline');
            }
        }

        // Validar profile_id se fornecido
        if (data.profile_id !== undefined) {
            if (typeof data.profile_id !== 'number' || data.profile_id <= 0) {
                throw new ValidationError('Profile ID deve ser um número positivo');
            }
        }

        // Validar enable_2fa se fornecido
        if (data.enable_2fa !== undefined && typeof data.enable_2fa !== 'boolean') {
            throw new ValidationError('Enable 2FA deve ser um booleano');
        }

        // Validar active se fornecido
        if (data.active !== undefined && typeof data.active !== 'boolean') {
            throw new ValidationError('Active deve ser um booleano');
        }
    }
}

module.exports = UpdateUserDTO;
