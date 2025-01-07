const personDocumentRepository = require('../repositories/personDocumentRepository');
const personContactRepository = require('../repositories/personContactRepository');
const personAddressRepository = require('../repositories/personAddressRepository');
const { logger } = require('../middlewares/logger');

class PersonRelationService {
    /**
     * Busca relacionamentos de uma pessoa
     * @param {number} personId - ID da pessoa
     * @returns {Promise<Object>} Relacionamentos da pessoa
     */
    async findPersonRelations(personId) {
        try {
            const [documents, contacts, addresses] = await Promise.all([
                personDocumentRepository.findAll({ person_id: personId }),
                personContactRepository.findAll({ person_id: personId }),
                personAddressRepository.findByPersonId(personId)
            ]);

            return {
                documents,
                contacts,
                addresses
            };
        } catch (error) {
            logger.error('Erro ao buscar relacionamentos da pessoa', {
                personId,
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    /**
     * Busca relacionamentos em lote para múltiplas pessoas
     * @param {Array<number>} personIds - Lista de IDs de pessoas
     * @returns {Promise<Object>} Mapa de relacionamentos por pessoa
     */
    async findBatchPersonRelations(personIds) {
        try {
            const batchRelations = await Promise.all(
                personIds.map(personId => this.findPersonRelations(personId))
            );

            return personIds.reduce((acc, personId, index) => {
                acc[personId] = batchRelations[index];
                return acc;
            }, {});
        } catch (error) {
            logger.error('Erro ao buscar relacionamentos em lote', {
                personIds,
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }
}

module.exports = new PersonRelationService();
