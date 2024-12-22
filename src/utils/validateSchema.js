/**
 * Valida os dados contra um schema Joi
 * @param {Object} schema - Schema Joi para validação
 * @param {Object} data - Dados a serem validados
 * @returns {Object} Dados validados
 * @throws {Error} Se a validação falhar
 */
async function validateSchema(schema, data) {
    try {
        const validatedData = await schema.validateAsync(data, {
            abortEarly: false,
            stripUnknown: true
        });
        return validatedData;
    } catch (error) {
        if (error.isJoi) {
            const errorMessage = error.details
                .map(detail => detail.message)
                .join(', ');
            throw new Error(errorMessage);
        }
        throw error;
    }
}

module.exports = {
    validateSchema
};
