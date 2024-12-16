const logger = require('../middlewares/logger').logger;
const userLicenseRepository = require('../repositories/userLicenseRepository');
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
            const licenses = await userLicenseRepository.findByUser(userId, options);
            
            return licenses;
        } catch (error) {
            logger.error('Erro ao buscar licenças do usuário', { 
                userId,
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
