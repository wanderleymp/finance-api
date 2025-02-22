const axios = require('axios');
const moment = require('moment-timezone');
const { logger } = require('../../middlewares/logger');
const NfseRepository = require('./nfse.repository');
const CreateNfseDto = require('./dto/create-nfse.dto');
const UpdateNfseDto = require('./dto/update-nfse.dto');
const { NotFoundError, ValidationError } = require('../../utils/errors');
const { formatCNPJ, formatCPF } = require('../../utils/formatters');
const temporaryTokenService = require('../tokens/services/temporary-token.service');
const nuvemFiscalTokenService = require('./services/nuvem-fiscal-token.service');
const nuvemFiscalService = require('./services/nuvem-fiscal.service')(nuvemFiscalTokenService);
const NuvemFiscalService = require('../nuvemFiscal/nuvemFiscal.service');
const invoiceRepository = require('../invoices/invoice.repository');
const invoiceEventRepository = require('../invoices/invoice-event.repository');
const n8nService = require('../../services/n8n.service');
const { FileStorageDomainService } = require('../../newArch/fileStorage/domain/services/file-storage.domain.service'); // Nova dependência

class NfseService {
    constructor() {
        this.nfseRepository = new NfseRepository();
        this.invoiceRepository = new invoiceRepository(); 
        this.invoiceEventRepository = new invoiceEventRepository();
        this.ambiente = process.env.NFSE_AMBIENTE || 'homologacao';
        this.nuvemFiscalUrl = 'https://api.nuvemfiscal.com.br/nfse';
        this.nuvemFiscalApiKey = process.env.NUVEM_FISCAL_API_KEY;
        this.n8nService = n8nService;

        // Novas dependências
        this.fileStorageService = new FileStorageDomainService();
    }

    async emitirNfse(detailedMovement, ambiente = 'homologacao') {
        try {
            // Adicionar ID da pessoa para contexto de erro
            this.personId = detailedMovement?.person?.person_id;

            // Log inicial com todos os dados recebidos
            logger.info('Dados recebidos para emissão de NFSe', { 
                movementId: detailedMovement?.movement?.movement_id,
                licenseData: detailedMovement?.license,
                personData: detailedMovement?.person,
                itemsData: detailedMovement?.items
            });

            // Verificações de nulidade e log de detalhes
            if (!detailedMovement) {
                logger.error('Objeto detailedMovement é nulo', { detailedMovement });
                throw new ValidationError('Dados do movimento não podem ser nulos');
            }

            if (!detailedMovement.movement) {
                logger.error('Objeto movement é nulo', { movement: detailedMovement.movement });
                throw new ValidationError('Dados do movimento não podem ser nulos');
            }

            if (!detailedMovement.license) {
                logger.error('Objeto license é nulo', { license: detailedMovement.license });
                throw new ValidationError('Dados da licença não podem ser nulos');
            }

            if (!detailedMovement.person) {
                logger.error('Objeto person é nulo', { person: detailedMovement.person });
                throw new ValidationError('Dados da pessoa não podem ser nulos');
            }

            if (!detailedMovement.items || detailedMovement.items.length === 0) {
                logger.error('Itens do movimento são nulos ou vazios', { items: detailedMovement.items });
                throw new ValidationError('Itens do movimento não podem ser nulos');
            }

            // Log de verificação de documentos
            logger.info('Verificação de documentos', {
                licenseDocuments: detailedMovement.license.person.documents,
                personDocuments: detailedMovement.person.documents
            });

            // Preparar dados para o payload com verificações adicionais
            const payloadData = {
                movimento: {
                    id: detailedMovement.movement.movement_id,
                    data: new Date().toISOString(),
                    referencia: detailedMovement.movement.movement_id.toString()
                },
                prestador: {
                    cnpj: this.extrairDocumento(detailedMovement.license.person.documents, 'CNPJ').documentValue,
                    nome: detailedMovement.license.person.full_name
                },
                tomador_documento: this.extrairDocumento(detailedMovement.person.documents).documentValue,
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

            // Log do payload montado com verificações
            logger.info('Payload montado para emissão de NFSe', { 
                movementId: payloadData.movimento.id,
                prestadorCnpj: payloadData.prestador.cnpj,
                tomadorDocumento: payloadData.tomador_documento,
                valorServico: payloadData.valores.servico
            });

            // Validar dados
            this.validarDadosNfse(payloadData);

            // Construir payload para Nuvem Fiscal
            const nfsePayload = this.construirPayloadNfse(payloadData);

            // Log do payload construído para Nuvem Fiscal
            logger.info('Payload construído para Nuvem Fiscal', { 
                movementId: payloadData.movimento.id,
                nfsePayload 
            });

            // Emitir NFSe na Nuvem Fiscal
            const nfseResponse = await this.emitirNfseNuvemFiscal(nfsePayload, detailedMovement.license);

            // Log da resposta da Nuvem Fiscal
            logger.info('Resposta da Nuvem Fiscal para emissão de NFSe', { 
                movementId: payloadData.movimento.id,
                nfseId: nfseResponse.id,
                status: nfseResponse.status
            });

            // Criar NFSe no banco de dados
            const nfseCriada = await this.criarNfse(nfseResponse);

            // Log da criação da NFSe
            logger.info('NFSe criada no banco de dados', {
                movementId: payloadData.movimento.id,
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
            // Tratamento de erro mais específico
            if (error instanceof ValidationError) {
                logger.error('Erro de validação na emissão de NFSe', {
                    errorMessage: error.message,
                    errorCode: error.code,
                    details: error.details
                });

                throw new ValidationError(error.message, {
                    code: error.code || 'NFSE_VALIDATION_ERROR',
                    details: {
                        ...error.details,
                        movementId: detailedMovement?.movement?.movement_id
                    }
                });
            }

            // Tratamento para outros tipos de erro
            logger.error('Erro inesperado na emissão de NFSe', {
                errorMessage: error.message,
                errorStack: error.stack,
                movementId: detailedMovement?.movement?.movement_id
            });

            throw new Error('Não foi possível emitir a NFSe. Erro interno do servidor.', {
                cause: error,
                details: {
                    movementId: detailedMovement?.movement?.movement_id
                }
            });
        }
    }

    extrairDocumento(documentos, tipoDocumento = null) {
        logger.info('Extraindo documento', { documentos, tipoDocumento });

        if (!documentos || documentos.length === 0) {
            logger.error('Nenhum documento encontrado', { documentos, tipoDocumento });
            throw new ValidationError('Documento do tomador não encontrado. Por favor, verifique o cadastro.', {
                code: 'MISSING_DOCUMENT',
                details: {
                    tipoDocumento,
                    personId: this.personId
                }
            });
        }

        const documento = tipoDocumento 
            ? documentos.find(doc => doc.document_type === tipoDocumento)
            : documentos[0];

        if (!documento || !documento.document_value) {
            logger.error('Documento inválido', { documento, tipoDocumento });
            throw new ValidationError('Documento do tomador inválido. É necessário cadastrar um documento válido.', {
                code: 'INVALID_DOCUMENT',
                details: {
                    tipoDocumento,
                    personId: this.personId
                }
            });
        }

        // Mantém o documento no formato original
        return {
            documentValue: documento.document_value.replace(/\D/g, ''),
            documentType: documento.document_type
        };
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

        // Formata data de emissão no fuso horário de Porto Velho
        const dataEmissao = moment().tz('America/Porto_Velho').format('YYYY-MM-DD[T]HH:mm:ss');
        
        // Usa a data do movimento como data de competência
        const dataCompetencia = moment(data.movimento.movement_date).format('YYYY-MM-DD');

        logger.info('Datas para NFSe', {
            dataEmissao,
            dataCompetencia,
            movementDate: data.movimento.movement_date
        });

        const primeiroEndereco = data.personData.addresses[0];
        const tomadorDocumento = this.extrairDocumento(data.personData.documents);
        
        const payload = {
            provedor: "padrao",
            ambiente: "producao",
            referencia: data.movimento.referencia,
            infDPS: {
                tpAmb: 1,
                dhEmi: dataEmissao,        // Data atual no fuso de Porto Velho
                dCompet: dataCompetencia,   // Data do movimento
                prest: {
                    CNPJ: data.prestador.cnpj
                },
                toma: {
                    [tomadorDocumento.documentType === 'CNPJ' ? 'CNPJ' : 'CPF']: tomadorDocumento.documentValue,
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

        return payload;
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
                errorStack: error.stack
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
            logger.info('Listando NFSes', { page, limit, filters });
            const result = await this.nfseRepository.findAll(page, limit, filters);
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
    async remove(id) {
        try {
            const existingNfse = await this.nfseRepository.findById(id);
            if (!existingNfse) {
                throw new NotFoundError('NFSE não encontrada');
            }

            await this.nfseRepository.remove(id);
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
                    iss_value: 0, // TODO: Calcular ISS
                    aliquota_service: 2 // TODO: Definir alíquota correta
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
                }
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

            // Log detalhado da NFSe criada
            logger.info('NFSe criada com sucesso', {
                nfseId: transaction.nfse.nfse_id,
                invoiceId: transaction.nfse.invoice_id,
                integrationNfseId: transaction.nfse.integration_nfse_id
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
                reference_id: nuvemFiscalResponse.invoice.reference_id,
                type: nuvemFiscalResponse.invoice.type,
                status: nuvemFiscalResponse.invoice.status,
                environment: nuvemFiscalResponse.invoice.environment,
                total_amount: parseFloat(nuvemFiscalResponse.invoice.total_amount),
                movement_id: nuvemFiscalResponse.invoice.movement_id,
                integration_id: nuvemFiscalResponse.invoice.integration_id
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
            const nfseLocal = await this.nfseRepository.findById(nfseId);
            if (!nfseLocal) {
                throw new Error('NFSe não encontrada');
            }

            const nfseRemota = await nuvemFiscalService.consultarNfse(nfseLocal.integration_nfse_id);

            return {
                local: {
                    status: nfseLocal.invoice.status,
                    nfse_id: nfseLocal.nfse_id,
                    invoice_id: nfseLocal.invoice_id,
                    integration_nfse_id: nfseLocal.integration_nfse_id,
                    service_value: nfseLocal.service_value,
                    iss_value: nfseLocal.iss_value,
                    aliquota_service: nfseLocal.aliquota_service
                },
                remoto: {
                    status: nfseRemota.status,
                    mensagens: nfseRemota.mensagens || [],
                    updated_at: nfseRemota.updated_at
                }
            };
        } catch (error) {
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
            // 1. Busca NFSe local
            const nfseLocal = await this.nfseRepository.findById(nfseId);
            if (!nfseLocal) {
                throw new Error('NFSe não encontrada');
            }

            logger.info('Iniciando atualização de status da NFSe', { 
                nfseId, 
                integrationNfseId: nfseLocal.integration_nfse_id,
                statusAtual: nfseLocal.invoice.status
            });

            // 2. Consulta status na Nuvem Fiscal usando o método que já funciona
            const nfseRemota = await nuvemFiscalService.consultarNfse(nfseLocal.integration_nfse_id);

            logger.info('Resposta da consulta da NFSe', {
                nfseId,
                statusLocal: nfseLocal.invoice.status,
                statusRemoto: nfseRemota.status,
                dadosRemoto: nfseRemota
            });

            // Busca último evento para comparar mensagens
            let ultimoEvento = null;
            try {
                ultimoEvento = await this.invoiceEventRepository.findLastEventByInvoiceAndType(
                    nfseLocal.invoice_id,
                    'ATUALIZACAO_STATUS_NFSE'
                );
            } catch (error) {
                logger.error('Erro ao buscar último evento', {
                    nfseId,
                    error: error.message,
                    stack: error.stack
                });
                // Se der erro ao buscar evento, assumimos que não existe
                ultimoEvento = null;
            }

            // Verifica se houve mudança no status ou nas mensagens
            const mensagensAtuais = JSON.stringify(nfseRemota.mensagens || []);
            const mensagensAnteriores = ultimoEvento ? ultimoEvento.event_data : '[]';
            const houveMudancaStatus = nfseLocal.invoice.status.toUpperCase() !== nfseRemota.status.toUpperCase();
            
            // Só considera mudança nas mensagens se o status também mudou
            // Ou se não existir evento anterior
            const houveMudancaMensagens = !ultimoEvento || (
                houveMudancaStatus && 
                mensagensAtuais !== mensagensAnteriores
            );

            logger.info('Comparação de status e mensagens', {
                nfseId,
                statusAtual: nfseLocal.invoice.status,
                statusNovo: nfseRemota.status,
                houveMudancaStatus,
                houveMudancaMensagens,
                temEventoAnterior: !!ultimoEvento,
                statusEventoAnterior: ultimoEvento?.status
            });

            // Só cria evento se:
            // 1. Não existe evento anterior, ou
            // 2. O status mudou
            if (!ultimoEvento || houveMudancaStatus) {
                // Se status mudou, atualiza na NFSe e Invoice
                if (houveMudancaStatus) {
                    logger.info('DEBUG: Iniciando atualização de status', {
                        nfseId,
                        statusAtual: nfseLocal.status,
                        statusNovo: nfseRemota.status,
                        dadosNfseRemota: JSON.stringify(nfseRemota)
                    });

                    const dadosAtualizacao = {
                        status: nfseRemota.status
                    };

                    // Adicionar mensagens de erro se existirem
                    if (nfseRemota.mensagens && nfseRemota.mensagens.length > 0) {
                        dadosAtualizacao.error_messages = nfseRemota.mensagens.map(msg => 
                            `${msg.codigo}: ${msg.descricao}`
                        );
                    }

                    // Tratamento para status 'erro'
                    if (nfseRemota.status.toUpperCase() === 'ERRO') {
                        logger.warn('DEBUG: NFSe com status de erro', {
                            nfseId,
                            mensagens: JSON.stringify(nfseRemota.mensagens)
                        });

                        await this.atualizarInvoiceNfse(nfseLocal.invoice_id, dadosAtualizacao);
                    }

                    // Tratamento para status 'autorizada' ou 'autorizado'
                    if (['AUTORIZADA', 'AUTORIZADO'].includes(nfseRemota.status.toUpperCase())) {
                        // Garantir campos corretos
                        dadosAtualizacao.number = String(nfseRemota.numero);
                        dadosAtualizacao.series = String(nfseRemota.DPS?.serie || '');

                        logger.info('DEBUG: Preparando atualização de invoice para status autorizada', {
                            invoiceId: nfseLocal.invoice_id,
                            dadosAtualizacao: JSON.stringify(dadosAtualizacao)
                        });

                        // Chamar método centralizado
                        const invoiceAtualizada = await this.atualizarInvoiceNfse(nfseLocal.invoice_id, dadosAtualizacao);

                        logger.info('DEBUG: Invoice atualizada após autorização', {
                            invoiceId: nfseLocal.invoice_id,
                            invoiceAtualizada: JSON.stringify(invoiceAtualizada)
                        });
                    }

                    // Log final antes da atualização no repositório
                    logger.info('DEBUG: Dados finais de atualização', {
                        nfseId,
                        dadosAtualizacao: JSON.stringify(dadosAtualizacao)
                    });

                    // Atualiza NFSe e Invoice em uma única chamada
                    await this.nfseRepository.updateStatus(nfseId, nfseRemota.status, dadosAtualizacao);
                }

                // Determina a mensagem do evento baseado no status e mensagens
                let mensagemEvento = '';
                if (nfseRemota.status.toUpperCase() === 'AUTORIZADO') {
                    mensagemEvento = 'Nota Fiscal autorizada com sucesso';
                } else if (nfseRemota.status.toUpperCase() === 'ERRO') {
                    // Se tem mensagens de erro, usa a primeira como mensagem principal
                    if (nfseRemota.mensagens && nfseRemota.mensagens.length > 0) {
                        mensagemEvento = `Erro na NFSe: ${nfseRemota.mensagens[0].descricao}`;
                    } else {
                        mensagemEvento = 'Erro ao processar NFSe';
                    }
                } else if (nfseRemota.status.toUpperCase() === 'PROCESSANDO') {
                    mensagemEvento = 'NFSe em processamento';
                } else if (nfseRemota.status.toUpperCase() === 'CANCELADO') {
                    mensagemEvento = 'NFSe cancelada';
                } else {
                    mensagemEvento = `Status da NFSe alterado para: ${nfseRemota.status}`;
                }

                // Cria evento com as novas informações
                const evento = await this.invoiceEventRepository.create({
                    invoice_id: nfseLocal.invoice_id,
                    event_type: 'ATUALIZACAO_STATUS_NFSE',
                    event_date: new Date(),
                    event_data: mensagensAtuais,
                    status: nfseRemota.status,
                    message: mensagemEvento
                });

                logger.info('Novo evento de NFSe criado', {
                    nfseId,
                    statusAnterior: nfseLocal.invoice.status,
                    novoStatus: nfseRemota.status,
                    houveMudancaStatus,
                    houveMudancaMensagens,
                    eventoId: evento.event_id,
                    mensagem: mensagemEvento
                });

                // Busca NFSe atualizada
                const nfseAtualizada = await this.nfseRepository.findById(nfseId);

                return {
                    success: true,
                    message: houveMudancaStatus ? 'Status da NFSe atualizado com sucesso' : 'Mensagens da NFSe atualizadas com sucesso',
                    nfse: nfseAtualizada,
                    evento
                };
            } else {
                logger.info('Nenhuma mudança detectada na NFSe', {
                    nfseId,
                    status: nfseRemota.status
                });

                return {
                    success: true,
                    message: 'NFSe já está atualizada',
                    nfse: nfseLocal,
                    evento: null
                };
            }
        } catch (error) {
            logger.error('Erro ao atualizar status da NFSe', {
                error: error.message,
                nfseId
            });
            throw error;
        }
    }

    // Método centralizado para atualizar invoice e registrar evento
    async atualizarInvoiceNfse(invoiceId, dadosAtualizacao) {
        logger.info('Tentativa de atualização de invoice', {
            invoiceId,
            dadosAtualizacao
        });

        try {
            // 1. Atualiza apenas o status na invoice
            const invoiceAtualizada = await this.invoiceRepository.update(
                invoiceId, 
                { status: dadosAtualizacao.status }
            );

            // 2. Se tem mensagens de erro, cria evento
            if (dadosAtualizacao.error_messages) {
                await this.invoiceEventRepository.create({
                    invoice_id: invoiceId,
                    event_type: 'ATUALIZACAO_STATUS_NFSE',
                    event_data: JSON.stringify(dadosAtualizacao.error_messages),
                    status: dadosAtualizacao.status
                });

                logger.info('Evento de erro registrado', {
                    invoiceId,
                    status: dadosAtualizacao.status,
                    mensagens: dadosAtualizacao.error_messages
                });
            }

            logger.info('Invoice atualizada com sucesso', {
                invoiceId,
                invoiceAtualizada
            });

            return invoiceAtualizada;
        } catch (error) {
            logger.error('Erro ao atualizar invoice', {
                invoiceId,
                dadosAtualizacao,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    // Baixar PDF do DANFSE
    async downloadNfsePdf(integrationNfseId, options = {}) {
        try {
            logger.info('Preparando download de PDF da NFSe', { 
                integrationNfseId,
                options 
            });

            const pdfBuffer = await nuvemFiscalService.downloadNfsePdf(integrationNfseId, options);

            // Lógica adicional, se necessário (salvar em disco, etc)
            logger.info('PDF da NFSe processado com sucesso', { 
                integrationNfseId,
                tamanhoArquivo: pdfBuffer.byteLength 
            });

            return pdfBuffer;
        } catch (error) {
            logger.error('Erro no processo de download de PDF da NFSe', { 
                integrationNfseId, 
                error: error.message 
            });
            throw error;
        }
    }

    // Baixar XML da NFSe
    async downloadNfseXml(integrationNfseId, options = {}) {
        try {
            logger.info('Preparando download de XML da NFSe', { 
                integrationNfseId,
                options 
            });

            const xmlContent = await nuvemFiscalService.downloadNfseXml(integrationNfseId, options);

            // Lógica adicional, se necessário (salvar em disco, etc)
            logger.info('XML da NFSe processado com sucesso', { 
                integrationNfseId,
                tamanhoArquivo: xmlContent.length 
            });

            return xmlContent;
        } catch (error) {
            logger.error('Erro no processo de download de XML da NFSe', { 
                integrationNfseId, 
                error: error.message 
            });
            throw error;
        }
    }

    // Método para processar PDF da NFSe
    async processarPdfNfse(nfseId) {
        try {
            // Log inicial
            logger.info('Iniciando processamento de PDF da NFSe', { 
                nfseId
            });

            // Buscar dados da NFSe
            const nfse = await this.nfseRepository.findById(nfseId);
            if (!nfse) {
                logger.error('NFSe não encontrada no repositório', { nfseId });
                const error = new NotFoundError('NFSe não encontrada');
                error.details = { nfseId };
                throw error;
            }

            // Verificar se existe integration_nfse_id
            if (!nfse.integration_nfse_id) {
                logger.error('NFSe não possui integration_nfse_id', { 
                    nfseId, 
                    nfse 
                });
                const error = new ValidationError('Integration NFSe ID não encontrado');
                error.details = { nfseId, nfse };
                throw error;
            }

            // Consultar status da NFSe na Nuvem Fiscal
            const statusNfse = await nuvemFiscalService.consultarStatusNfse(nfse.integration_nfse_id);
            
            // Verificar se a NFSe está autorizada
            if (!statusNfse || statusNfse.status.toUpperCase() !== 'AUTORIZADA') {
                // Preparar mensagem de erro detalhada
                const errorMessages = statusNfse?.mensagens?.map(msg => 
                    `Código ${msg.codigo}: ${msg.descricao}. ${msg.correcao || ''}`
                ).join('; ') || 'Status não autorizado';

                logger.error('NFSe não está autorizada', { 
                    nfseId, 
                    integrationNfseId: nfse.integration_nfse_id,
                    statusNfse,
                    errorMessages
                });

                // Lançar erro com mensagens detalhadas
                const error = new ValidationError(`Nota fiscal não autorizada`);
                error.details = {
                    nfseId,
                    integrationNfseId: nfse.integration_nfse_id,
                    statusNfse,
                    errorMessages
                };
                error.message = errorMessages;
                throw error;
            }

            // Buscar dados da invoice
            const invoice = await this.invoiceRepository.findById(nfse.invoice_id);
            if (!invoice) {
                const error = new NotFoundError('Invoice não encontrada');
                error.details = { nfseId, invoiceId: nfse.invoice_id };
                throw error;
            }

            // Passo 1: Baixar PDF da Nuvem Fiscal
            try {
                const pdfBuffer = await nuvemFiscalService.downloadNfsePdf(
                    nfse.integration_nfse_id
                );

                // Passo 2: Salvar no File Storage
                const metadata = {
                    contentType: 'application/pdf',
                    size: pdfBuffer.length,
                    originalName: `nfse/pdf/nfse_${nfse.integration_nfse_id}.pdf`,
                    bucketName: process.env.MINIO_BUCKET_NAME || 'finance',
                    tags: {
                        nfseId,
                        invoiceId: invoice.invoice_id,
                        source: 'nuvem-fiscal'
                    }
                };

                let fileId;
                try {
                    fileId = await this.fileStorageService.uploadFile(
                        pdfBuffer, 
                        metadata
                    );
                } catch (uploadError) {
                    logger.error('Erro ao fazer upload do arquivo', {
                        nfseId,
                        integrationNfseId: nfse.integration_nfse_id,
                        errorMessage: uploadError.message,
                        errorCode: uploadError.code,
                        errorDetails: uploadError
                    });

                    // Verificar se é um erro de bucket inexistente
                    if (uploadError.code === 'NoSuchBucket') {
                        const createBucketError = new ValidationError('Bucket de armazenamento não configurado');
                        createBucketError.details = {
                            nfseId,
                            integrationNfseId: nfse.integration_nfse_id,
                            bucketName: metadata.bucketName
                        };
                        throw createBucketError;
                    }

                    throw uploadError;
                }

                // Passo 3: Gerar URL pública
                let pdfUrl;
                try {
                    pdfUrl = await this.generatePublicUrl(fileId);
                } catch (urlError) {
                    logger.error('Erro ao gerar URL pública', {
                        nfseId,
                        fileId,
                        errorMessage: urlError.message,
                        errorCode: urlError.code,
                        errorDetails: urlError
                    });

                    // Se falhar na geração da URL, ainda pode ser útil ter o arquivo
                    pdfUrl = null;
                }

                // Passo 4: Atualizar Invoice
                await this.invoiceRepository.update(
                    invoice.invoice_id, 
                    { pdf_url: pdfUrl }
                );

                // Log de sucesso
                logger.info('Processamento de PDF da NFSe concluído', { 
                    nfseId,
                    pdfUrl,
                    integrationNfseId: nfse.integration_nfse_id
                });

                return {
                    pdfUrl,
                    invoice: { ...invoice, pdf_url: pdfUrl }
                };
            } catch (downloadError) {
                // Log detalhado de erro no download
                logger.error('Erro ao baixar PDF da NFSe', { 
                    nfseId,
                    integrationNfseId: nfse.integration_nfse_id,
                    errorMessage: downloadError.message,
                    errorResponse: downloadError.response?.data,
                    errorStatus: downloadError.response?.status,
                    stack: downloadError.stack
                });

                // Tratamento específico para diferentes tipos de erro
                const error = downloadError.response?.status === 404 
                    ? new NotFoundError('PDF da NFSe não encontrado na Nuvem Fiscal')
                    : downloadError;
                
                error.details = {
                    nfseId,
                    integrationNfseId: nfse.integration_nfse_id,
                    errorResponse: downloadError.response?.data
                };

                throw error;
            }
        } catch (error) {
            // Log de erro
            logger.error('Erro no processamento de PDF da NFSe', { 
                nfseId,
                error: error.message,
                details: error.details,
                stack: error.stack
            });
            throw error;
        }
    }

    // Método auxiliar para gerar URL pública
    async generatePublicUrl(fileId) {
        try {
            const bucketName = process.env.MINIO_BUCKET_NAME || 'finance';
            const domain = process.env.S3_PUBLIC_DOMAIN || 's3.agilefinance.com.br';
            
            // Gerar URL pública
            const publicUrl = `https://${domain}/${bucketName}/${fileId}`;

            return publicUrl;
        } catch (error) {
            logger.error('Erro ao gerar URL pública', {
                fileId,
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }
}

module.exports = NfseService;
