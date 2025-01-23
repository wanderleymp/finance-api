const { Router } = require('express');
const NfseController = require('./nfse.controller');
const { validateRequest } = require('../../middlewares/validator');
const { logger } = require('../../middlewares/logger');
const { authMiddleware } = require('../../middlewares/auth');
const { 
    listNFSeSchema, 
    createNFSeSchema, 
    updateStatusSchema, 
    cancelNFSeSchema 
} = require('./validators/nfse.validator');

/**
 * Configura rotas de NFSe com suporte a injeção de dependência
 * @param {Object} dependencies Dependências para injeção no controlador
 * @returns {Router} Roteador configurado
 */
class NfseRoutes {
    constructor(dependencies = {}) {
        this.router = Router();
        const nfseService = dependencies.nfseService || dependencies;
        this.nfseController = new NfseController(nfseService);
        this.setupRoutes();
    }

    setupRoutes() {
        // Middleware de autenticação para todas as rotas
        this.router.use(authMiddleware);

        // Middleware de log para todas as rotas
        this.router.use((req, res, next) => {
            logger.info('Requisição NFSe recebida', {
                method: req.method,
                path: req.path,
                query: req.query,
                body: req.body
            });
            next();
        });

        // Buscar todos os NFSes
        this.router.get('/', 
            (req, res, next) => validateRequest(listNFSeSchema, 'query')(req, res, next),
            (req, res, next) => this.nfseController.findAll(req, res, next)
        );

        // Emitir NFSe
        this.router.post('/emitir', 
            (req, res, next) => validateRequest(createNFSeSchema, 'body')(req, res, next),
            (req, res, next) => this.nfseController.emitirNfse(req, res, next)
        );

        // Criar NFSe com retorno
        this.router.post('/criar-nfse', 
            (req, res, next) => validateRequest(createNFSeSchema, 'body')(req, res, next),
            (req, res, next) => this.nfseController.criarNfseComRetorno(req, res, next)
        );

        // Lista todas NFSes com status "processando"
        this.router.get('/status/pending', 
            (req, res, next) => this.nfseController.listarNfsesProcessando(req, res, next)
        );

        // Consulta status de uma NFSe específica
        this.router.get('/:id/status', 
            (req, res, next) => this.nfseController.consultarStatusNfse(req, res, next)
        );

        // Atualiza manualmente o status de uma NFSe
        this.router.put('/:id/update-status', 
            (req, res, next) => this.nfseController.atualizarStatusNfse(req, res, next)
        );

        // Buscar NFSe por ID
        this.router.get('/:id', 
            (req, res, next) => this.nfseController.findById(req, res, next)
        );

        // Atualizar status do NFSe
        this.router.patch('/:id/status', 
            (req, res, next) => validateRequest(updateStatusSchema, 'body')(req, res, next),
            (req, res, next) => this.nfseController.update(req, res, next)
        );

        // Cancelar NFSe
        this.router.post('/:id/cancel', 
            (req, res, next) => validateRequest(cancelNFSeSchema, 'body')(req, res, next),
            (req, res, next) => this.nfseController.update(req, res, next)
        );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = (dependencies = {}) => {
    const routes = new NfseRoutes(dependencies);
    return routes.getRouter();
};
