const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { logger } = require('../../middlewares/logger');

class NfseController {
    constructor(nfseService) {
        this.nfseService = nfseService;
    }

    /**
     * Lista todos os NFSes
     */
    async findAll(req, res) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            
            logger.debug('NfseController.findAll - Filtros recebidos', {
                page,
                limit,
                filters: JSON.stringify(filters),
                fullQuery: JSON.stringify(req.query)
            });

            const result = await this.nfseService.list({ page: Number(page), limit: Number(limit), ...filters });
            return successResponse(res, 200, result);
        } catch (error) {
            logger.error('NfseController.findAll - Erro', {
                error: error.message,
                stack: error.stack
            });
            return errorResponse(res, 500, 'Erro ao buscar NFSes', error);
        }
    }

    /**
     * Busca um NFSe por ID
     */
    async findById(req, res) {
        try {
            const { id } = req.params;
            const result = await this.nfseService.findById(Number(id));
            return successResponse(res, 200, result);
        } catch (error) {
            logger.error('NfseController.findById - Erro', {
                error: error.message,
                id: req.params.id
            });
            return errorResponse(res, 404, 'NFSe não encontrado', error);
        }
    }

    /**
     * Busca NFSes por ID da invoice
     */
    async findByInvoiceId(req, res) {
        try {
            const { invoiceId } = req.params;
            const result = await this.nfseService.findByInvoiceId(Number(invoiceId));
            return successResponse(res, 200, result);
        } catch (error) {
            logger.error('NfseController.findByInvoiceId - Erro', {
                error: error.message,
                invoiceId: req.params.invoiceId
            });
            return errorResponse(res, 404, 'NFSes não encontrados', error);
        }
    }

    /**
     * Busca NFSes por ID de integração
     */
    async findByIntegrationId(req, res) {
        try {
            const { integrationId } = req.params;
            const result = await this.nfseService.findByIntegrationId(integrationId);
            return successResponse(res, 200, result);
        } catch (error) {
            logger.error('NfseController.findByIntegrationId - Erro', {
                error: error.message,
                integrationId: req.params.integrationId
            });
            return errorResponse(res, 404, 'NFSes não encontrados', error);
        }
    }

    /**
     * Cria um novo NFSe
     */
    async create(req, res) {
        try {
            const result = await this.nfseService.create(req.body);
            return successResponse(res, 201, result);
        } catch (error) {
            logger.error('NfseController.create - Erro', {
                error: error.message,
                data: req.body
            });
            return errorResponse(res, 400, 'Erro ao criar NFSe', error);
        }
    }

    /**
     * Atualiza um NFSe
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const result = await this.nfseService.update(Number(id), req.body);
            return successResponse(res, 200, result);
        } catch (error) {
            logger.error('NfseController.update - Erro', {
                error: error.message,
                id: req.params.id,
                data: req.body
            });
            return errorResponse(res, 400, 'Erro ao atualizar NFSe', error);
        }
    }

    /**
     * Remove um NFSe
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.nfseService.delete(Number(id));
            return successResponse(res, 204);
        } catch (error) {
            logger.error('NfseController.delete - Erro', {
                error: error.message,
                id: req.params.id
            });
            return errorResponse(res, 400, 'Erro ao remover NFSe', error);
        }
    }

    /**
     * Emitir NFS-e via Nuvem Fiscal
     * @param {Object} req - Requisição HTTP
     * @param {Object} res - Resposta HTTP
     * @returns {Promise<void>}
     */
    async emitirNfse(req, res) {
        try {
            const result = await this.nfseService.emitirNfse(req.body);
            return res.json(result);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Método de teste para emissão de NFSe
     */
    async testarEmissaoNfse(req, res) {
        try {
            const { movementId } = req.params;
            
            logger.info('NfseController.testarEmissaoNfse - Iniciando teste', {
                movementId
            });

            const result = await this.nfseService.testarEmissaoNfse(Number(movementId));
            
            return successResponse(res, 200, {
                message: 'Teste de emissão de NFSe realizado com sucesso',
                data: result
            });
        } catch (error) {
            logger.error('NfseController.testarEmissaoNfse - Erro', {
                error: error.message,
                movementId: req.params.movementId,
                stack: error.stack
            });
            return errorResponse(res, 500, 'Erro ao testar emissão de NFSe', error);
        }
    }

    /**
     * Criar NFSe a partir do retorno da Nuvem Fiscal
     */
    async criarNfseComRetorno(req, res) {
        try {
            const nuvemFiscalResponse = req.body;
            
            logger.info('NfseController.criarNfseComRetorno - Recebendo retorno da Nuvem Fiscal', {
                nuvemFiscalResponse
            });

            // Validar campos obrigatórios
            if (!nuvemFiscalResponse.id || !nuvemFiscalResponse.referencia) {
                return errorResponse(res, 400, 'Campos obrigatórios ausentes', {
                    requiredFields: ['id', 'referencia']
                });
            }

            const result = await this.nfseService.criarNfseComRetorno(nuvemFiscalResponse);
            
            return successResponse(res, 201, {
                message: 'NFSe criada com sucesso',
                data: result
            });
        } catch (error) {
            logger.error('NfseController.criarNfseComRetorno - Erro', {
                error: error.message,
                payload: req.body,
                stack: error.stack
            });
            return errorResponse(res, 500, 'Erro ao criar NFSe', error);
        }
    }

    /**
     * Criar NFSe
     */
    async criarNfse(req, res) {
        try {
            const dadosNfse = req.body;
            
            logger.info('Recebendo solicitação para criar NFSe', { dadosNfse });

            const resultado = await this.nfseService.criarNfse(dadosNfse);
            
            return successResponse(res, 201, resultado);
        } catch (error) {
            logger.error('Erro no controller ao criar NFSe', { 
                error: error.message, 
                stack: error.stack,
                body: req.body 
            });
            return errorResponse(res, 500, 'Erro ao criar NFSe', error);
        }
    }
}

module.exports = NfseController;
