const licenseService = require('../services/licenseService');
const { logger } = require('./logger');
const moment = require('moment-timezone');

async function setDefaultLicense(req, res, next) {
    try {
        console.log('DEBUG: setDefaultLicense middleware', {
            reqUser: req.user,
            reqBody: req.body,
            reqUserPersonId: req.user?.person_id,
            reqPath: req.path
        });

        // Ignorar completamente para rotas de movement-payments
        if (req.path.startsWith('/movement-payments')) {
            return next();
        }

        // Se license_id não foi fornecido e há um usuário autenticado
        if (!req.body.license_id && req.user) {
            const userLicenses = await licenseService.getLicensesByPerson(req.user.person_id);
            
            console.log('DEBUG: Licenças do usuário', {
                userLicenses,
                userLicensesLength: userLicenses.length
            });

            if (userLicenses.length === 0) {
                return res.status(403).json({ 
                    message: 'Usuário não possui licenças ativas' 
                });
            }

            // Pega primeira licença ativa como padrão
            req.body.license_id = userLicenses[0].license_id;

            logger.info('Licença padrão definida automaticamente', {
                userId: req.user.user_id,
                licenseId: req.body.license_id
            });
        }

        // Define data do movimento para hoje se não fornecida
        if (!req.body.movement_date) {
            req.body.movement_date = moment().tz('America/Sao_Paulo').format('YYYY-MM-DD');
            
            logger.info('Data de movimento definida automaticamente', {
                date: req.body.movement_date
            });
        }

        // Define status padrão como 2 se não fornecido
        if (!req.body.movement_status_id) {
            req.body.movement_status_id = 2;
            
            logger.info('Status de movimento definido automaticamente', {
                statusId: req.body.movement_status_id
            });
        }

        // Define tipo de movimento padrão como 1 se não fornecido
        if (!req.body.movement_type_id) {
            req.body.movement_type_id = 1;
            
            logger.info('Tipo de movimento definido automaticamente', {
                typeId: req.body.movement_type_id
            });
        }
        
        next();
    } catch (error) {
        console.error('DEBUG: Erro no middleware setDefaultLicense', {
            error: error.message,
            stack: error.stack
        });

        logger.error('Erro ao definir valores padrão', { 
            error: error.message,
            userId: req.user?.user_id
        });
        
        return res.status(500).json({ 
            message: 'Erro interno ao definir valores padrão',
            error: error.message 
        });
    }
}

module.exports = setDefaultLicense;
