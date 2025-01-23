const axios = require('axios');
const { logger } = require('../../middlewares/logger');
const NfseRepository = require('./nfse.repository');
const CreateNfseDto = require('./dto/create-nfse.dto');
const UpdateNfseDto = require('./dto/update-nfse.dto');
const { NotFoundError, ValidationError } = require('../../utils/errors');
const { formatCNPJ, formatCPF } = require('../../utils/formatters');
const temporaryTokenService = require('../tokens/services/temporary-token.service');
const nuvemFiscalTokenService = require('./services/nuvem-fiscal-token.service');
const nuvemFiscalService = require('./services/nuvem-fiscal.service')(nuvemFiscalTokenService);
const invoiceRepository = require('../invoices/invoice.repository');
const invoiceEventRepository = require('../invoices/invoice-event.repository');

class NfseService {
    constructor() {
        this.nfseRepository = new NfseRepository();
        this.invoiceRepository = new invoiceRepository(); // Criar instância do repositório de invoice
        this.invoiceEventRepository = invoiceEventRepository;
        this.ambiente = process.env.NFSE_AMBIENTE || 'homologacao';
        this.nuvemFiscalUrl = 'https://api.nuvemfiscal.com.br/nfse/dps';
    }

    async emitirNfse(detailedMovement, ambiente = 'homologacao') {
        try {
            logger.info('Dados recebidos para emissão de NFSe', { 
                movementId: detailedMovement.movement.movement_id,
                licenseData: detailedMovement.license,
                personData: detailedMovement.person,
                itemsData: detailedMovement.items
            });

            // Preparar dados para o payload
            const payloadData = {
                movimento: {
                    id: detailedMovement.movement.movement_id,
                    data: new Date().toISOString(),
                    referencia: detailedMovement.movement.movement_id.toString()
                },
                prestador: {
                    cnpj: detailedMovement.license.person.documents[0].document_value.replace(/\D/g, ''),
                    nome: detailedMovement.license.person.full_name
                },
                tomador_documento: detailedMovement.person.documents[0].document_value.replace(/\D/g, ''),
                tomador_razao_social: detailedMovement.person.full_name,
                servico: [{
                    cnae: detailedMovement.items[0].cnae,
                    codTributacaoNacional: detailedMovement.items[0].lc116_code,
                    codTributacaoMunicipal: detailedMovement.items[0].ctribmun
                }],
                itemsData: detailedMovement.items,
                personData: detailedMovement.person,
                valores: {
                    servico: detailedMovement.items.reduce((total, item) => total + parseFloat(item.total_price || 0), 0),
                    aliquota: 0 // TODO: Adicionar lógica para calcular alíquota
                }
            };

            // Log do payload montado
            logger.info('Payload montado para emissão de NFSe', { 
                movementId: detailedMovement.movement.movement_id,
                referencia: payloadData.movimento.referencia,
                prestadorCnpj: payloadData.prestador.cnpj,
                valorServico: payloadData.valores.servico
            });

            // Validar dados
            this.validarDadosNfse(payloadData);

            // Construir payload para Nuvem Fiscal
            const nfsePayload = this.construirPayloadNfse(payloadData);

            // Log do payload construído para Nuvem Fiscal
            logger.info('Payload construído para Nuvem Fiscal', { 
                movementId: detailedMovement.movement.movement_id,
                nfsePayload 
            });

            // Emitir NFSe na Nuvem Fiscal
            const nfseResponse = await this.emitirNfseNuvemFiscal(nfsePayload, detailedMovement.license);

            // Log da resposta da Nuvem Fiscal
            logger.info('Resposta da Nuvem Fiscal para emissão de NFSe', { 
                movementId: detailedMovement.movement.movement_id,
                nfseId: nfseResponse.id,
                status: nfseResponse.status
            });

            // Criar NFSe no banco de dados
            const nfseCriada = await this.criarNfse(nfseResponse);

            // Log da criação da NFSe
            logger.info('NFSe criada no banco de dados', {
                movementId: detailedMovement.movement.movement_id,
                nfseId: nfseCriada.data.nfse_id,
                integrationNfseId: nfseCriada.data.integration_nfse_id
            });

            return {
                success: true,
                message: 'NFSe emitida e salva com sucesso',
                payload: nfsePayload,
                nfseResponse,
                nfseCriada
            };
        } catch (error) {
            logger.error('Erro ao emitir e salvar NFSe', { 
                movementId: detailedMovement.movement.movement_id,
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    validarDadosNfse(data) {
        logger.info('Validando dados para NFSe', {
            prestador: data.prestador,
            tomador: data.tomador,
            servico: data.servico,
            valores: data.valores
        });

        // Validações mínimas
        if (!data.prestador.cnpj) {
            logger.error('Validação de NFSE falhou - CNPJ do prestador é obrigatório', {
                prestador: data.prestador
            });
            throw new Error('CNPJ do prestador é obrigatório');
        }
        
        if (!data.servico.length) {
            logger.error('Validação de NFSE falhou - Serviço é obrigatório', {
                servico: data.servico
            });
            throw new Error('Serviço é obrigatório');
        }
    }

    construirPayloadNfse(data) {
        logger.info('Construindo payload para NFSe', { 
            cnae: data.servico[0].cnae,
            descricao: data.itemsData[0].name,
            movimento: data.movimento
        });

        // Verificações de segurança para evitar erros de undefined
        if (!data.personData || !data.personData.addresses || data.personData.addresses.length === 0) {
            logger.error('Dados de endereço do tomador incompletos', { personData: data.personData });
            throw new Error('Dados de endereço do tomador incompletos');
        }

        const primeiroEndereco = data.personData.addresses[0];

        return {
            provedor: "padrao",
            ambiente: "producao",
            referencia: data.movimento.referencia,
            infDPS: {
                tpAmb: 1,
                dhEmi: data.movimento.data,
                dCompet: data.movimento.data.split('T')[0],
                prest: {
                    CNPJ: data.prestador.cnpj
                },
                toma: {
                    CPF: data.tomador_documento,
                    xNome: data.tomador_razao_social,
                    end: {
                        endNac: {
                            cMun: primeiroEndereco.ibge || null,
                            CEP: primeiroEndereco.postal_code || null
                        },
                        xLgr: primeiroEndereco.street || null,
                        nro: primeiroEndereco.number || null,
                        xBairro: primeiroEndereco.neighborhood || null
                    },
                    fone: null,
                    email: ""
                },
                serv: {
                    xDescServ: data.itemsData[0].name,
                    CNAE: data.servico[0].cnae,
                    cTribNac: data.servico[0].codTributacaoNacional,
                    cTribMun: data.servico[0].codTributacaoMunicipal
                },
                valores: {
                    vServPrest: {
                        vServ: data.valores.servico
                    },
                    trib: {
                        tribMun: {
                            tribISSQN: 1,
                            pAliq: 2
                        }
                    }
                }
            }
        };
    }

    async emitirNfseNuvemFiscal(dadosNFSe, licenseData) {
        let payload, transaction; // Declarar payload e transação
        try {
            // Obter o primeiro endereço da licença para o código IBGE
            const enderecoLicenca = licenseData.person.addresses[0];

            // Buscar primeiro email em contatos
            const primeiroEmail = licenseData.person.contacts.find(
                contact => contact.contact_type === 'email'
            )?.contact_value || null;

            payload = {
                provedor: "padrao",
                ambiente: "producao",
                referencia: dadosNFSe.referencia,
                infDPS: {
                    tpAmb: 1,
                    dhEmi: dadosNFSe.infDPS.dhEmi,
                    dCompet: dadosNFSe.infDPS.dCompet,
                    prest: { 
                        CNPJ: dadosNFSe.infDPS.prest.CNPJ
                    },
                    toma: {
                        [dadosNFSe.infDPS.toma.CPF ? 'CPF' : 'CNPJ']: dadosNFSe.infDPS.toma.CPF || dadosNFSe.infDPS.toma.CNPJ,
                        xNome: dadosNFSe.infDPS.toma.xNome,
                        end: {
                            endNac: {
                                cMun: String(dadosNFSe.infDPS.toma.end.endNac.cMun), // Converter para string
                                CEP: dadosNFSe.infDPS.toma.end.endNac.CEP
                            },
                            xLgr: dadosNFSe.infDPS.toma.end.xLgr,
                            nro: dadosNFSe.infDPS.toma.end.nro,
                            xBairro: dadosNFSe.infDPS.toma.end.xBairro
                        },
                        fone: dadosNFSe.infDPS.toma.fone,
                        email: primeiroEmail
                    },
                    serv: {
                        cServ: {
                            cTribNac: dadosNFSe.infDPS.serv.cTribNac,
                            cTribMun: dadosNFSe.infDPS.serv.cTribMun,
                            CNAE: dadosNFSe.infDPS.serv.CNAE,
                            xDescServ: dadosNFSe.infDPS.serv.xDescServ
                        }
                    },
                    valores: {
                        vServPrest: {
                            vServ: dadosNFSe.infDPS.valores.vServPrest.vServ
                        },
                        trib: {
                            tribMun: {
                                tribISSQN: 1,
                                cLocIncid: String(enderecoLicenca.ibge), // Converter para string
                                pAliq: dadosNFSe.infDPS.valores.trib.tribMun.pAliq
                            }
                        }
                    }
                }
            };

            const response = await nuvemFiscalService.emitirNfse(payload, "PRODUCAO");

            // Iniciar transação
            transaction = await this.nfseRepository.transaction(async (client) => {
                // 1. Criar Invoice
                const invoice = await this.invoiceRepository.create({
                    reference_id: dadosNFSe.referencia,
                    type: 'NFSE',
                    status: response.status,
                    environment: response.ambiente,
                    movement_id: parseInt(dadosNFSe.referencia),
                    total_amount: dadosNFSe.infDPS.valores.vServPrest.vServ,
                });

                // 2. Criar NFSe
                const nfse = await this.nfseRepository.create({
                    invoice_id: invoice.invoice_id,
                    integration_nfse_id: response.id,
                    service_value: dadosNFSe.infDPS.valores.vServPrest.vServ,
                    iss_value: dadosNFSe.infDPS.valores.vServPrest.vServ * (dadosNFSe.infDPS.valores.trib.tribMun.pAliq / 100),
                    aliquota_service: dadosNFSe.infDPS.valores.trib.tribMun.pAliq
                });

                // 3. Criar Invoice Event
                const invoiceEvent = await this.invoiceEventRepository.create({
                    invoice_id: invoice.invoice_id,
                    event_type: 'NFSE_CREATED',
                    event_date: new Date(response.created_at),
                    event_data: JSON.stringify(response),
                    status: response.status,
                    message: response.mensagens.length > 0 ? response.mensagens[0] : 'NFSe criada com sucesso'
                });

                return { invoice, nfse, invoiceEvent };
            });

            logger.info('NFSe emitida com sucesso', { 
                movementId: dadosNFSe.referencia,
                invoiceId: transaction.invoice.invoice_id,
                nfseId: transaction.nfse.nfse_id,
                integrationId: response.id,
                status: response.status
            });

            // Log detalhado dos dados inseridos
            logger.info('Dados inseridos no banco de dados', {
                invoice: {
                    id: transaction.invoice.invoice_id,
                    referenceId: transaction.invoice.reference_id,
                    status: transaction.invoice.status
                },
                nfse: {
                    id: transaction.nfse.nfse_id,
                    invoiceId: transaction.nfse.invoice_id,
                    integrationNfseId: transaction.nfse.integration_nfse_id
                },
                invoiceEvent: {
                    id: transaction.invoiceEvent.event_id,
                    invoiceId: transaction.invoiceEvent.invoice_id,
                    eventType: transaction.invoiceEvent.event_type
                }
            });

            return transaction;
        } catch (error) {
            logger.error('Erro ao emitir NFSe na Nuvem Fiscal', { 
                errorMessage: error.message,
                errorResponse: error.response?.data,
                errorStack: error.stack,
                payload: payload ? {
                    prestador: payload.prest,
                    ambiente: payload.ambiente,
                    referencia: payload.referencia
                } : null
            });
            throw error;
        }
    }

    async emitirNfseProvedorPadrao(payload) {
        try {
            logger.info('Payload para Nuvem Fiscal', { 
                payloadOriginal: JSON.stringify(payload, null, 2) 
            });

            // Estrutura corrigida para o payload da Nuvem Fiscal
            const payloadNuvemFiscal = {
                ambiente: 'producao',
                infDPS: {
                    dhEmi: payload.movimento.data,
                    dCompet: payload.movimento.data.split('T')[0],
                    tpAmb: 1, // Produção
                    prest: { 
                        CNPJ: payload.prestador.cnpj
                    },
                    toma: {
                        xNome: payload.tomador.nome,
                        CPF: payload.tomador.documento.tipo === 1 ? payload.tomador.documento.numero : null,
                        CNPJ: payload.tomador.documento.tipo === 2 ? payload.tomador.documento.numero : null,
                        end: {
                            endNac: {
                                xLgr: '',
                                nro: '',
                                xBairro: '',
                                cMun: '',
                                CEP: ''
                            }
                        },
                        email: '',
                        fone: null
                    },
                    serv: {
                        xDescServ: payload.servico[0].descricao
                    },
                    valores: {
                        vServPrest: { 
                            vServ: payload.valores.servico
                        },
                        trib: {
                            tribMun: {
                                pAliq: payload.valores.aliquota * 100,
                                tribISSQN: 1
                            }
                        }
                    }
                },
                provedor: 'padrao',
                referencia: payload.movimento.referencia
            };

            logger.info('Payload Nuvem Fiscal Processado', { 
                payloadFinal: JSON.stringify(payloadNuvemFiscal, null, 2) 
            });

            const response = await axios.post(
                `${process.env.NUVEM_FISCAL_URL || 'https://api.nuvemfiscal.com.br/nfse'}/dps`, 
                payloadNuvemFiscal, 
                { 
                    headers: {
                        'Authorization': `Bearer ${this.configService.get('NUVEM_FISCAL_TOKEN')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response;
        } catch (error) {
            logger.error('Erro ao emitir NFS-e via Nuvem Fiscal', { 
                error: error.message, 
                errorStack: error.stack,
                payload 
            });
            throw new Error(`Falha na emissão de NFS-e: ${error.message}`);
        }
    }

    /**
     * Cria uma nova NFSE
     * @param {Object} data - Dados da NFSE
     * @returns {Promise<Object>} NFSE criada
     */
    async create(data) {
        try {
            const createNfseDto = new CreateNfseDto(data);

            const nfse = await NfseRepository.create(createNfseDto);
            logger.info('NFSE criada com sucesso', { nfseId: nfse.nfse_id });
            return nfse;
        } catch (error) {
            logger.error('Erro ao criar NFSE', { error, data });
            throw error;
        }
    }

    /**
     * Atualiza uma NFSE
     * @param {number} id - ID da NFSE
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object>} NFSE atualizada
     */
    async update(id, data) {
        try {
            const existingNfse = await NfseRepository.findById(id);
            if (!existingNfse) {
                throw new NotFoundError('NFSE não encontrada');
            }

            const updateData = { ...existingNfse, ...data };
            const updateNfseDto = new UpdateNfseDto(updateData);

            const nfse = await NfseRepository.update(id, updateNfseDto);
            logger.info('NFSE atualizada com sucesso', { nfseId: id });
            return nfse;
        } catch (error) {
            logger.error('Erro ao atualizar NFSE', { error, id, data });
            throw error;
        }
    }

    async findById(id) {
        try {
            logger.info('Buscando NFSe no banco de dados', {
                id,
                method: 'findById',
                service: 'NfseService'
            });

            const nfse = await this.nfseRepository.findById(Number(id));
            
            if (!nfse) {
                logger.warn('NFSe não encontrada no banco de dados', {
                    id,
                    method: 'findById',
                    service: 'NfseService'
                });
                return null;
            }

            logger.info('NFSe encontrada com sucesso', {
                id,
                method: 'findById',
                service: 'NfseService'
            });

            return nfse;
        } catch (error) {
            logger.error('Erro ao buscar NFSe no banco de dados', {
                id,
                error: error.message,
                method: 'findById',
                service: 'NfseService'
            });
            throw new Error('Erro ao buscar NFSe no banco de dados');
        }
    }

    /**
     * Busca NFSes por ID de invoice
     * @param {number} invoiceId - ID da invoice
     * @returns {Promise<Array>} Lista de NFSes
     */
    async findByInvoiceId(invoiceId) {
        try {
            if (!invoiceId) {
                throw new ValidationError('ID da invoice é obrigatório');
            }
            return await NfseRepository.findByInvoiceId(invoiceId);
        } catch (error) {
            logger.error('Erro ao buscar NFSes por invoice ID', { error, invoiceId });
            throw error;
        }
    }

    /**
     * Busca NFSes por ID de integração
     * @param {string} integrationNfseId - ID de integração da NFSE
     * @returns {Promise<Array>} Lista de NFSes
     */
    async findByIntegrationId(integrationNfseId) {
        try {
            if (!integrationNfseId) {
                throw new ValidationError('ID de integração é obrigatório');
            }
            return await NfseRepository.findByIntegrationId(integrationNfseId);
        } catch (error) {
            logger.error('Erro ao buscar NFSes por ID de integração', { error, integrationNfseId });
            throw error;
        }
    }

    /**
     * Lista NFSes com paginação e filtros
     * @param {Object} options - Opções de listagem
     * @param {number} options.page - Número da página
     * @param {number} options.limit - Limite de itens por página
     * @param {Object} options.filters - Filtros de busca
     * @returns {Promise<{items: Array, meta: Object, links: Object}>} Resultado da busca
     */
    async list({ page = 1, limit = 10, ...filters } = {}) {
        try {
            const result = await NfseRepository.findAll(page, limit, filters);
            return result;
        } catch (error) {
            logger.error('Erro ao listar NFSes', { error, page, limit, filters });
            throw error;
        }
    }

    /**
     * Remove uma NFSE
     * @param {number} id - ID da NFSE
     * @returns {Promise<boolean>} Sucesso da remoção
     */
    async delete(id) {
        try {
            const existingNfse = await NfseRepository.findById(id);
            if (!existingNfse) {
                throw new NotFoundError('NFSE não encontrada');
            }

            await NfseRepository.delete(id);
            logger.info('NFSE removida com sucesso', { nfseId: id });
            return true;
        } catch (error) {
            logger.error('Erro ao remover NFSE', { error, id });
            throw error;
        }
    }

    /**
     * Consulta NFSes na Nuvem Fiscal
     * @param {string} cnpjEmitente - CNPJ do emitente
     * @param {Object} [filtros={}] - Filtros opcionais para a busca
     * @returns {Promise<Object>} Resultado da busca de NFSe
     */
    async consultarNfseNuvemFiscal(cnpjEmitente, filtros = {}) {
        try {
            // Configurações padrão de filtro
            const params = {
                cpf_cnpj: cnpjEmitente,
                ambiente: filtros.ambiente || this.ambiente,
                ...filtros
            };

            // Remove undefined values
            Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            // Configurar cabeçalhos para a requisição
            const headers = {
                'Authorization': `Bearer ${this.configService.get('NUVEM_FISCAL_TOKEN')}`,
                'Content-Type': 'application/json'
            };

            // Faz a requisição para a API da Nuvem Fiscal
            const response = await axios.get(
                `${this.configService.get('NUVEM_FISCAL_URL')}/nfse`, 
                { 
                    headers,
                    params 
                }
            );

            // Mapeia a resposta para o formato esperado
            return {
                total: response.data.data.length || 0,
                items: response.data.data || [],
                pages: 1
            };
        } catch (error) {
            logger.error('Erro ao consultar NFSe na Nuvem Fiscal', {
                errorMessage: error.message,
                errorResponse: error.response?.data,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async testarEmissaoNfse(movementId) {
        try {
            // Buscar movimento detalhado
            const movementService = require('../movements/movement.service');
            const detailedMovement = await new movementService().findById(movementId);

            // Usar o retorno de exemplo da Nuvem Fiscal
            const mockNuvemFiscalResponse = {
                id: "nfs_3a1781ff32ed49c594a91147c5d05eb3",
                created_at: "2025-01-15T15:54:04.397Z",
                status: "processando",
                ambiente: "producao",
                referencia: String(movementId),
                DPS: {},
                mensagens: []
            };

            // Preparar payload para emissão de NFSe
            const nfsePayload = {
                referencia: String(movementId),
                infDPS: {
                    dhEmi: new Date().toISOString(),
                    dCompet: new Date().toISOString().split('T')[0],
                    prest: { 
                        CNPJ: detailedMovement.license.person.documents[0].document_value.replace(/\D/g, '') 
                    },
                    toma: {
                        CPF: detailedMovement.person.documents[0].document_value.replace(/\D/g, ''),
                        xNome: detailedMovement.person.full_name,
                    },
                    valores: {
                        vServPrest: { 
                            vServ: detailedMovement.items.reduce((total, item) => total + parseFloat(item.total_price || 0), 0)
                        },
                        trib: {
                            tribMun: {
                                pAliq: 2 // Alíquota padrão para teste
                            }
                        }
                    }
                }
            };

            // Iniciar transação
            const transaction = await this.nfseRepository.transaction(async (client) => {
                // 1. Criar Invoice
                const invoice = await this.invoiceRepository.create({
                    reference_id: mockNuvemFiscalResponse.referencia,
                    type: 'NFSE',
                    status: mockNuvemFiscalResponse.status,
                    environment: mockNuvemFiscalResponse.ambiente,
                    movement_id: movementId,
                    total_amount: nfsePayload.infDPS.valores.vServPrest.vServ,
                });

                // 2. Criar NFSe
                const nfse = await this.nfseRepository.create({
                    invoice_id: invoice.invoice_id,
                    integration_nfse_id: mockNuvemFiscalResponse.id,
                    service_value: nfsePayload.infDPS.valores.vServPrest.vServ,
                    iss_value: nfsePayload.infDPS.valores.vServPrest.vServ * (nfsePayload.infDPS.valores.trib.tribMun.pAliq / 100),
                    aliquota_service: nfsePayload.infDPS.valores.trib.tribMun.pAliq
                });

                // 3. Criar Invoice Event
                const invoiceEvent = await this.invoiceEventRepository.create({
                    invoice_id: invoice.invoice_id,
                    event_type: 'NFSE_CREATED',
                    event_date: new Date(mockNuvemFiscalResponse.created_at),
                    event_data: JSON.stringify(mockNuvemFiscalResponse),
                    status: mockNuvemFiscalResponse.status,
                    message: mockNuvemFiscalResponse.mensagens.length > 0 
                        ? mockNuvemFiscalResponse.mensagens[0] 
                        : 'NFSe criada com sucesso'
                });

                return { invoice, nfse, invoiceEvent };
            });

            // Log detalhado dos dados inseridos
            logger.info('Dados inseridos no banco de dados', {
                invoice: {
                    id: transaction.invoice.invoice_id,
                    referenceId: transaction.invoice.reference_id,
                    status: transaction.invoice.status
                },
                nfse: {
                    id: transaction.nfse.nfse_id,
                    invoiceId: transaction.nfse.invoice_id,
                    integrationNfseId: transaction.nfse.integration_nfse_id
                },
                invoiceEvent: {
                    id: transaction.invoiceEvent.event_id,
                    invoiceId: transaction.invoiceEvent.invoice_id,
                    eventType: transaction.invoiceEvent.event_type
                },
                originalResponse: transaction.mockNuvemFiscalResponse
            });

            return transaction;
        } catch (error) {
            logger.error('Erro no teste de emissão de NFSe', { 
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async criarNfseComRetorno(nuvemFiscalResponse) {
        try {
            // Buscar movimento pelo número de referência
            const movementService = require('../movements/movement.service');
            const movementId = parseInt(nuvemFiscalResponse.referencia);
            const detailedMovement = await new movementService().findById(movementId);

            // Iniciar transação
            const transaction = await this.nfseRepository.transaction(async (client) => {
                // 1. Criar Invoice
                const invoice = await this.invoiceRepository.create({
                    reference_id: nuvemFiscalResponse.referencia,
                    type: 'NFSE',
                    status: nuvemFiscalResponse.status,
                    environment: nuvemFiscalResponse.ambiente,
                    movement_id: movementId,
                    total_amount: detailedMovement.items.reduce((total, item) => total + parseFloat(item.total_price || 0), 0),
                });

                // 2. Criar NFSe
                const nfse = await this.nfseRepository.create({
                    invoice_id: invoice.invoice_id,
                    integration_nfse_id: nuvemFiscalResponse.id,
                    service_value: detailedMovement.items.reduce((total, item) => total + parseFloat(item.total_price || 0), 0),
                    iss_value: 0, // TODO: Calcular ISS
                    aliquota_service: 2 // TODO: Definir alíquota correta
                });

                // 3. Criar Invoice Event
                const invoiceEvent = await this.invoiceEventRepository.create({
                    invoice_id: invoice.invoice_id,
                    event_type: 'NFSE_CREATED',
                    event_date: new Date(nuvemFiscalResponse.created_at),
                    event_data: JSON.stringify(nuvemFiscalResponse),
                    status: nuvemFiscalResponse.status,
                    message: nuvemFiscalResponse.mensagens.length > 0 
                        ? nuvemFiscalResponse.mensagens[0] 
                        : 'NFSe criada com sucesso'
                });

                return { invoice, nfse, invoiceEvent };
            });

            // Log detalhado dos dados inseridos
            logger.info('Dados de NFSe inseridos no banco', {
                invoice: {
                    id: transaction.invoice.invoice_id,
                    referenceId: transaction.invoice.reference_id,
                    status: transaction.invoice.status
                },
                nfse: {
                    id: transaction.nfse.nfse_id,
                    invoiceId: transaction.nfse.invoice_id,
                    integrationNfseId: transaction.nfse.integration_nfse_id
                },
                invoiceEvent: {
                    id: transaction.invoiceEvent.event_id,
                    invoiceId: transaction.invoiceEvent.invoice_id,
                    eventType: transaction.invoiceEvent.event_type
                }
            });

            return transaction;
        } catch (error) {
            logger.error('Erro ao criar NFSe com retorno da Nuvem Fiscal', { 
                errorMessage: error.message,
                errorStack: error.stack,
                nuvemFiscalResponse
            });
            throw error;
        }
    }

    async criarNfse(nuvemFiscalResponse) {
        try {
            logger.info('Dados recebidos para salvar NFSe', { 
                nuvemFiscalResponse,
                referencia: nuvemFiscalResponse.referencia
            });

            // Criar invoice diretamente
            const invoice = await this.invoiceRepository.create({
                reference_id: nuvemFiscalResponse.referencia,
                type: 'NFSe',
                status: nuvemFiscalResponse.status,
                environment: nuvemFiscalResponse.ambiente || 'producao',
                total_amount: nuvemFiscalResponse.valores?.servico || 0,
                movement_id: nuvemFiscalResponse.referencia, // Assumindo que referencia é o movement_id
                integration_id: 10, // Valor padrão
            });

            logger.info('Nova invoice criada para NFSe', {
                invoiceId: invoice.invoice_id,
                referenceId: invoice.reference_id
            });

            // Calcular valores de serviço, ISS e alíquota
            const serviceValue = nuvemFiscalResponse.valores?.servico || 0;
            const issValue = nuvemFiscalResponse.valores?.iss || 0;
            const aliquotaService = nuvemFiscalResponse.valores?.aliquota || 0;

            // Criar NFSe com os campos existentes
            const nfseData = {
                invoice_id: invoice.invoice_id,
                integration_nfse_id: nuvemFiscalResponse.id,
                service_value: serviceValue,
                iss_value: issValue,
                aliquota_service: aliquotaService
            };

            // Remover campos undefined ou null
            Object.keys(nfseData).forEach(key => {
                if (nfseData[key] === undefined || nfseData[key] === null) {
                    delete nfseData[key];
                }
            });

            const nfse = await this.nfseRepository.create(nfseData);

            // Log detalhado da NFSe criada
            logger.info('NFSe criada com sucesso', {
                nfseId: nfse.nfse_id,
                invoiceId: nfse.invoice_id,
                integrationNfseId: nfse.integration_nfse_id
            });

            return nfse;
        } catch (error) {
            logger.error('Erro ao criar NFSe', { 
                error: error.message, 
                stack: error.stack,
                nuvemFiscalResponse 
            });
            throw error;
        }
    }

    /**
     * Consulta status atual de uma NFSe
     * @param {number} nfseId - ID da NFSe
     * @returns {Promise<Object>} Status local e remoto da NFSe
     */
    async consultarStatusNfse(nfseId) {
        try {
            // Busca NFSe no banco
            const nfseLocal = await this.nfseRepository.findById(nfseId);
            if (!nfseLocal) {
                throw new Error('NFSe não encontrada');
            }

            // Consulta status na Nuvem Fiscal
            const nfseRemota = await this.nuvemFiscalService.consultarStatusNfse(nfseLocal.integration_nfse_id);

            return {
                local: {
                    status: nfseLocal.status,
                    updated_at: nfseLocal.updated_at
                },
                remoto: {
                    status: nfseRemota.status,
                    mensagens: nfseRemota.mensagens,
                    updated_at: nfseRemota.updated_at
                }
            };
        } catch (error) {
            logger.error('Erro ao consultar status da NFSe', { error, nfseId });
            throw error;
        }
    }

    /**
     * Lista todas as NFSes com status "processando"
     * @returns {Promise<Array>} Lista de NFSes pendentes com status local e remoto
     */
    async listarNfsesProcessando() {
        try {
            // Busca todas NFSes com status processando
            const nfsesPendentes = await this.nfseRepository.findByStatus('processando');
            
            // Para cada NFSe, consulta status na Nuvem Fiscal
            const statusCompleto = await Promise.all(nfsesPendentes.map(async (nfse) => {
                const statusRemoto = await this.nuvemFiscalService.consultarStatusNfse(nfse.integration_nfse_id);
                return {
                    nfse_id: nfse.nfse_id,
                    integration_nfse_id: nfse.integration_nfse_id,
                    local: {
                        status: nfse.status,
                        updated_at: nfse.updated_at
                    },
                    remoto: {
                        status: statusRemoto.status,
                        mensagens: statusRemoto.mensagens,
                        updated_at: statusRemoto.updated_at
                    }
                };
            }));

            return statusCompleto;
        } catch (error) {
            logger.error('Erro ao listar NFSes processando', { error });
            throw error;
        }
    }

    /**
     * Atualiza o status de uma NFSe consultando a Nuvem Fiscal
     * @param {number} nfseId - ID da NFSe
     * @returns {Promise<Object>} NFSe atualizada com novo status e evento
     */
    async atualizarStatusNfse(nfseId) {
        try {
            // Busca NFSe no banco
            const nfseLocal = await this.nfseRepository.findById(nfseId);
            if (!nfseLocal) {
                throw new Error('NFSe não encontrada');
            }

            // Consulta status na Nuvem Fiscal
            const nfseRemota = await this.nuvemFiscalService.consultarStatusNfse(nfseLocal.integration_nfse_id);

            // Atualiza status no banco
            const nfseAtualizada = await this.nfseRepository.updateStatus(nfseId, nfseRemota.status);

            // Cria evento de atualização
            const evento = await this.invoiceEventRepository.create({
                invoice_id: nfseAtualizada.invoice_id,
                event_type: 'NFSE_STATUS_UPDATED',
                event_date: new Date(),
                event_data: JSON.stringify(nfseRemota),
                status: nfseRemota.status,
                message: nfseRemota.mensagens.length > 0 ? nfseRemota.mensagens[0] : 'Status da NFSe atualizado'
            });

            return {
                nfse: nfseAtualizada,
                evento: evento
            };
        } catch (error) {
            logger.error('Erro ao atualizar status da NFSe', { error, nfseId });
            throw error;
        }
    }
}

module.exports = NfseService;
