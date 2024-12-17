const logger = require('../middlewares/logger').logger;
const userLicenseRepository = require('../repositories/userLicenseRepository');
const PaginationHelper = require('../utils/paginationHelper');
const { ValidationError } = require('../utils/errors');

class UserLicenseService {
    async createUserLicense(userData) {
        try {
            const { user_id, license_id } = userData;

            // Validações
            if (!user_id) {
                throw new ValidationError('ID do usuário é obrigatório');
            }

            if (!license_id) {
                throw new ValidationError('ID da licença é obrigatório');
            }

            // Verificar se já existe
            try {
                const existingLicenses = await userLicenseRepository.findByUser(user_id);
                
                // Se já existir licença, não criar novamente
                if (existingLicenses.total > 0) {
                    logger.info('Usuário já possui licença', { 
                        userId: user_id, 
                        existingLicenses: existingLicenses.total 
                    });
                    return existingLicenses.data[0];
                }
            } catch (checkError) {
                // Ignorar erros na verificação de existência
                logger.warn('Erro ao verificar licenças existentes', { 
                    userId: user_id, 
                    error: checkError.message 
                });
            }

            // Criar nova associação
            const newUserLicense = await userLicenseRepository.create({
                user_id,
                license_id
            });

            // Se retornar null (já existente), retornar primeira licença existente
            if (!newUserLicense) {
                const existingLicenses = await userLicenseRepository.findByUser(user_id);
                return existingLicenses.data[0];
            }

            logger.info('Licença de usuário criada', { 
                userId: user_id, 
                licenseId: license_id 
            });

            return newUserLicense;
        } catch (error) {
            logger.error('Erro ao criar licença de usuário', { 
                error: error.message,
                userData 
            });
            throw error;
        }
    }

    async getUserLicenses(userId, options = {}) {
        try {
            console.log('SERVICE: Iniciando busca de licenças do usuário', { 
                userId, 
                options,
                userIdType: typeof userId,
                userIdValue: userId
            });

            // Validação de entrada
            if (!userId) {
                console.error('SERVICE: ID de usuário não fornecido', { userId });
                throw new ValidationError('ID de usuário é obrigatório');
            }

            const { page = 1, limit = 10 } = options;
            const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);

            const licenses = await userLicenseRepository.findByUser(userId, { page: validPage, limit: validLimit });
            
            return PaginationHelper.formatResponse(
                licenses.data, 
                licenses.total, 
                validPage, 
                validLimit
            );
        } catch (error) {
            console.error('SERVICE: Erro completo ao buscar licenças do usuário', { 
                userId,
                error: error.message,
                errorName: error.name,
                errorStack: error.stack
            });

            logger.error('Erro ao buscar licenças do usuário', { 
                userId,
                error: error.message 
            });
            throw error;
        }
    }

    async getUserLicense(userId, licenseId) {
        try {
            const licenses = await userLicenseRepository.findByUser(userId);
            const userLicense = licenses.data.find(license => license.license_id === parseInt(licenseId));

            if (!userLicense) {
                throw new ValidationError('Licença não encontrada para este usuário');
            }

            return userLicense;
        } catch (error) {
            logger.error('Erro ao buscar licença específica do usuário', { 
                userId,
                licenseId,
                error: error.message 
            });
            throw error;
        }
    }

    async updateUserLicense(userId, licenseId, updateData) {
        try {
            // Validações básicas
            if (!updateData || Object.keys(updateData).length === 0) {
                throw new ValidationError('Dados para atualização são obrigatórios');
            }

            // Verificar se a licença pertence ao usuário
            await this.getUserLicense(userId, licenseId);

            const updatedLicense = await userLicenseRepository.update(userId, licenseId, updateData);
            
            if (!updatedLicense) {
                throw new ValidationError('Não foi possível atualizar a licença');
            }

            logger.info('Licença de usuário atualizada', { 
                userId, 
                licenseId 
            });

            return updatedLicense;
        } catch (error) {
            logger.error('Erro ao atualizar licença de usuário', { 
                userId,
                licenseId,
                updateData,
                error: error.message 
            });
            throw error;
        }
    }

    async deleteUserLicense(userId, licenseId) {
        try {
            const deletedLicense = await userLicenseRepository.delete(userId, licenseId);
            
            if (!deletedLicense) {
                throw new ValidationError('Associação usuário-licença não encontrada');
            }

            logger.info('Licença de usuário removida', { 
                userId, 
                licenseId 
            });

            return deletedLicense;
        } catch (error) {
            logger.error('Erro ao remover licença de usuário', { 
                userId,
                licenseId,
                error: error.message 
            });
            throw error;
        }
    }
}

module.exports = new UserLicenseService();
