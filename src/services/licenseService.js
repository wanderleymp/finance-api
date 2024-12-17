const licenseRepository = require('../repositories/licenseRepository');
const { ValidationError } = require('../utils/errors');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class LicenseService {
    async listLicenses(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('SERVICE: Iniciando listagem de licenças', { 
                page, 
                limit, 
                filters,
                pageType: typeof page,
                limitType: typeof limit,
                filtersType: typeof filters
            });
            
            // Converte page e limit para números inteiros
            const pageNum = Number(page);
            const limitNum = Number(limit);
            
            logger.info('SERVICE: Parâmetros convertidos', { 
                pageNum, 
                limitNum,
                pageNumType: typeof pageNum,
                limitNumType: typeof limitNum
            });
            
            const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(pageNum, limitNum);
            
            logger.info('SERVICE: Parâmetros de paginação validados', { 
                validPage, 
                validLimit 
            });
            
            const result = await licenseRepository.findAll(filters, validPage, validLimit);
            
            logger.info('SERVICE: Resultado do repositório', { 
                resultDataLength: result.data.length,
                resultTotal: result.total,
                resultDataType: typeof result.data,
                resultTotalType: typeof result.total
            });
            
            return PaginationHelper.formatResponse(
                result.data,
                result.total,
                validPage,
                validLimit
            );
        } catch (error) {
            logger.error('SERVICE: Erro completo ao listar licenças', {
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack,
                page,
                limit,
                filters
            });
            throw error;
        }
    }

    async getLicense(id) {
        logger.info('Buscando licença por ID', { id });
        
        const license = await licenseRepository.findById(id);
        if (!license) {
            throw new ValidationError('Licença não encontrada', 404);
        }
        
        return license;
    }

    async getLicensesByPerson(personId) {
        logger.info('Buscando licenças por pessoa', { 
            personId,
            personIdType: typeof personId,
            personIdValue: personId
        });
        
        if (!personId) {
            logger.warn('ID da pessoa não fornecido');
            return [];
        }

        const licenses = await licenseRepository.findByPerson(personId);
        
        logger.info('Licenças encontradas', { 
            personId, 
            licensesCount: licenses.length,
            licenses 
        });

        return licenses;
    }

    async findByPerson(personId) {
        logger.info('SERVICE: Buscando licenças por pessoa', { personId });
        
        if (!personId) {
            throw new ValidationError('ID da pessoa é obrigatório');
        }

        const licenses = await licenseRepository.findByPerson(personId);
        
        logger.info('SERVICE: Resultado da busca por pessoa', { 
            rowCount: licenses.length,
            resultLicenses: licenses
        });

        return licenses;
    }

    async createLicense(data) {
        logger.info('Criando nova licença', { data });

        // Validações iniciais
        await this.validateLicenseData(data);

        // Verifica se já existe alguma licença para esta pessoa
        const existingLicenses = await licenseRepository.findByPerson(data.person_id);
        
        if (existingLicenses && existingLicenses.length > 0) {
            const activeLicense = existingLicenses.find(license => 
                license.active === true || 
                (!license.end_date || new Date(license.end_date) > new Date())
            );

            if (activeLicense) {
                const error = new ValidationError('Já existe uma licença ativa para esta pessoa');
                error.details = {
                    existingLicense: {
                        id: activeLicense.license_id,
                        name: activeLicense.license_name,
                        startDate: activeLicense.start_date,
                        endDate: activeLicense.end_date,
                        status: activeLicense.status
                    }
                };
                throw error;
            }
        }

        // Se passou por todas as validações, cria a licença
        return await licenseRepository.create(data);
    }

    async updateLicense(id, data) {
        logger.info('Atualizando licença', { id, data });

        // Verifica se a licença existe
        const existingLicense = await this.getLicense(id);
        if (!existingLicense) {
            throw new ValidationError('Licença não encontrada');
        }

        // Validações adicionais
        await this.validateLicenseData(data);

        // Verifica se já existe outra licença ativa com o mesmo nome
        const existingLicenses = await licenseRepository.findByPerson(data.person_id);
        const hasActiveLicense = existingLicenses.some(license => 
            license.license_id !== parseInt(id) &&
            license.license_name === data.license_name && 
            (!license.end_date || new Date(license.end_date) > new Date())
        );

        if (hasActiveLicense) {
            throw new ValidationError('Já existe outra licença ativa com este nome para esta pessoa');
        }

        return await licenseRepository.update(id, data);
    }

    async deleteLicense(id) {
        logger.info('Excluindo licença', { id });

        // Verifica se a licença existe
        const license = await this.getLicense(id);
        if (!license) {
            throw new ValidationError('Licença não encontrada');
        }

        // Define a licença como inativa
        const updateData = {
            active: false,
            status: 'Inativa',
            end_date: new Date().toISOString()
        };

        logger.info('Dados para atualização da licença', { 
            id, 
            updateData,
            currentLicense: license 
        });

        const updatedLicense = await licenseRepository.update(id, updateData);
        
        logger.info('Licença atualizada', { updatedLicense });

        return updatedLicense;
    }

    async validateLicenseData(data) {
        if (!data.person_id) {
            throw new ValidationError('ID da pessoa é obrigatório');
        }

        if (!data.license_name) {
            throw new ValidationError('Nome da licença é obrigatório');
        }

        if (!data.start_date) {
            throw new ValidationError('Data de início é obrigatória');
        }

        // Verifica se a data de fim é posterior à data de início
        if (data.end_date && new Date(data.end_date) <= new Date(data.start_date)) {
            throw new ValidationError('Data de fim deve ser posterior à data de início');
        }

        // Valida o status
        const validStatus = ['Ativa', 'Inativa', 'Suspensa', 'Cancelada'];
        if (data.status && !validStatus.includes(data.status)) {
            throw new ValidationError('Status inválido');
        }
    }
}

module.exports = new LicenseService();
