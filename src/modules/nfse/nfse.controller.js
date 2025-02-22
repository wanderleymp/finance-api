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
            logger.info('Buscando NFSe por ID', {
                id: req.params.id,
                method: 'findById',
                service: 'NfseController'
            });

            const nfse = await this.nfseService.findById(req.params.id);
            
            if (!nfse) {
                logger.warn('NFSe não encontrada', {
                    id: req.params.id,
                    method: 'findById',
                    service: 'NfseController'
                });
                return res.status(404).json({ error: 'NFSe não encontrada' });
            }

            logger.info('NFSe encontrada com sucesso', {
                id: req.params.id,
                method: 'findById',
                service: 'NfseController'
            });

            return res.json(nfse);
        } catch (error) {
            logger.error('Erro ao buscar NFSe', {
                id: req.params.id,
                error: error.message,
                method: 'findById',
                service: 'NfseController'
            });
            return res.status(500).json({ error: 'Erro ao buscar NFSe' });
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
    async remove(req, res) {
        try {
            const { id } = req.params;
            await this.nfseService.remove(Number(id));
            return successResponse(res, 204);
        } catch (error) {
            logger.error('NfseController.remove - Erro', {
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

    /**
     * Consulta status de uma NFSe
     * @param {Object} req - Request do Express
     * @param {Object} res - Response do Express
     */
    async consultarStatusNfse(req, res) {
        try {
            const { id } = req.params;

            logger.info('Consultando status da NFSe', {
                id,
                method: 'consultarStatusNfse',
                service: 'NFSeController'
            });

            const status = await this.nfseService.consultarStatusNfse(Number(id));
            
            logger.info('Status da NFSe consultado com sucesso', {
                id,
                statusLocal: status.local.status,
                statusRemoto: status.remoto.status,
                method: 'consultarStatusNfse',
                service: 'NFSeController'
            });

            res.json(status);
        } catch (error) {
            // Log do erro com detalhes para debug, mas sem dados sensíveis
            logger.error('Erro ao consultar status da NFSe', {
                errorMessage: error.message,
                id: req.params.id,
                method: 'consultarStatusNfse',
                service: 'NFSeController'
            });

            // Retorna mensagem amigável para o usuário
            res.status(400).json({
                success: false,
                message: 'Erro ao consultar status da NFSe',
                error: {
                    message: error.message || 'Não foi possível consultar o status da NFSe no momento'
                }
            });
        }
    }

    /**
     * Lista todas as NFSes com status "processando"
     * @param {Object} req - Request do Express
     * @param {Object} res - Response do Express
     */
    async listarNfsesProcessando(req, res) {
        try {
            logger.info('Listando NFSes com status processando', {
                method: 'listarNfsesProcessando',
                service: 'NFSeController'
            });

            const nfses = await this.nfseService.listarNfsesProcessando();
            
            logger.info('NFSes processando listadas com sucesso', {
                quantidade: nfses.length,
                method: 'listarNfsesProcessando',
                service: 'NFSeController'
            });

            return successResponse(res, 200, nfses);
        } catch (error) {
            logger.error('Erro ao listar NFSes processando', {
                error: error.message,
                stack: error.stack,
                method: 'listarNfsesProcessando',
                service: 'NFSeController'
            });
            return errorResponse(res, 400, 'Erro ao listar NFSes processando', error);
        }
    }

    /**
     * Atualiza o status de uma NFSe
     * @param {Object} req - Request do Express
     * @param {Object} res - Response do Express
     */
    async atualizarStatusNfse(req, res) {
        try {
            const { id } = req.params;

            logger.info('Atualizando status da NFSe', {
                id,
                method: 'atualizarStatusNfse',
                service: 'NFSeController'
            });

            const resultado = await this.nfseService.atualizarStatusNfse(Number(id));
            
            logger.info('Status da NFSe atualizado com sucesso', {
                id,
                novoStatus: resultado.nfse.status,
                eventoId: resultado.evento?.event_id, 
                method: 'atualizarStatusNfse',
                service: 'NFSeController'
            });

            return successResponse(res, 200, resultado);
        } catch (error) {
            logger.error('Erro ao atualizar status da NFSe', {
                error: error.message,
                id: req.params.id,
                stack: error.stack,
                method: 'atualizarStatusNfse',
                service: 'NFSeController'
            });
            return errorResponse(res, 400, 'Erro ao atualizar status da NFSe', error);
        }
    }

    /**
     * Processar e obter PDF de uma NFSe
     * @param {Object} req Objeto de requisição do Express
     * @param {Object} res Objeto de resposta do Express
     * @returns {Promise<void>}
     */
    async processarPdf(req, res) {
        try {
            const { id } = req.params;

            logger.info('Processando PDF da NFSe', { 
                nfseId: id
            });

            // Chama o serviço para processar o PDF
            const resultado = await this.nfseService.processarPdfNfse(id);

            // Retorna resposta de sucesso
            return successResponse(res, 200, resultado, 'PDF processado com sucesso');
        } catch (error) {
            // Log e tratamento de erro
            logger.error('Erro no processamento de PDF da NFSe', { 
                error: error.message,
                stack: error.stack
            });

            // Retorna resposta de erro
            return errorResponse(
                res, 
                error.status || 500, 
                'Falha no processamento do PDF da NFSe', 
                error
            );
        }
    }
}

module.exports = NfseController;
