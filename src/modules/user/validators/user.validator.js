const Joi = require("joi");
const userSchema = require('../schemas/user.schema');
const { validate } = require('../../../middlewares/validator');

class UserValidator {
  static validateUser(data) {
    const schema = Joi.object({
      // TODO: Definir schema de validação
    });

    return schema.validate(data);
  }
}

/**
 * Validadores para as rotas de usuário
 */
const userValidator = {
    /**
     * Valida criação de usuário
     */
    create: validate('body', userSchema.create),

    /**
     * Valida atualização de usuário
     */
    update: [
        validate('params', userSchema.getById),
        validate('body', userSchema.update)
    ],

    /**
     * Valida deleção de usuário
     */
    delete: validate('params', userSchema.delete),

    /**
     * Valida busca por ID
     */
    getById: validate('params', userSchema.getById),

    /**
     * Valida listagem
     */
    list: validate('query', userSchema.list),

    /**
     * Valida refresh token
     */
    refresh: validate('body', userSchema.refresh)
};

module.exports = { UserValidator, userValidator };
