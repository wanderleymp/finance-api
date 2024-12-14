const personLicenseRepository = require('../repositories/personLicenseRepository');
const licenseRepository = require('../repositories/licenseRepository');
const personRepository = require('../repositories/personRepository');
const { ValidationError } = require('../utils/errors');
const { logger } = require('../middlewares/logger');

class PersonLicenseService {
    async listPersonLicenses(options = {}) {
        logger.info('Buscando associações pessoa-licença', { options });

        const { page = 1, limit = 10 } = options;

        return await personLicenseRepository.findAll({ page, limit });
    }

    async createPersonLicense(data) {
        logger.info('Criando associação pessoa-licença', { data });

        // Validação de dados
        if (!data.person_id) {
            throw new ValidationError('ID da pessoa é obrigatório');
        }

        if (!data.license_id) {
            throw new ValidationError('ID da licença é obrigatório');
        }

        // Verificar se pessoa existe
        const person = await personRepository.findById(data.person_id);
        if (!person) {
            throw new ValidationError('Pessoa não encontrada');
        }

        // Verificar se licença existe
        const license = await licenseRepository.findById(data.license_id);
        if (!license) {
            throw new ValidationError('Licença não encontrada');
        }

        // Verificar se já existe associação
        const existingAssociations = await personLicenseRepository.findByPerson(data.person_id);
        const hasActiveLicense = existingAssociations.data.some(assoc => 
            assoc.license_id === data.license_id
        );

        if (hasActiveLicense) {
            throw new ValidationError('Pessoa já possui esta licença');
        }

        return await personLicenseRepository.create(data);
    }

    async getPersonLicenses(personId, options = {}) {
        logger.info('Buscando licenças da pessoa', { personId, options });

        if (!personId) {
            throw new ValidationError('ID da pessoa é obrigatório');
        }

        return await personLicenseRepository.findByPerson(personId, options);
    }

    async getLicensePersons(licenseId, options = {}) {
        logger.info('Buscando pessoas da licença', { licenseId, options });

        if (!licenseId) {
            throw new ValidationError('ID da licença é obrigatório');
        }

        return await personLicenseRepository.findByLicense(licenseId, options);
    }

    async removePersonLicense(personId, licenseId) {
        logger.info('Removendo associação pessoa-licença', { personId, licenseId });

        if (!personId) {
            throw new ValidationError('ID da pessoa é obrigatório');
        }

        if (!licenseId) {
            throw new ValidationError('ID da licença é obrigatório');
        }

        const deletedAssociation = await personLicenseRepository.delete(personId, licenseId);

        if (!deletedAssociation) {
            throw new ValidationError('Associação pessoa-licença não encontrada');
        }

        return deletedAssociation;
    }
}

module.exports = new PersonLicenseService();
