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

class NfseService {
    constructor(
        nfseRepository, 
        configService
    ) {
        this.nfseRepository = nfseRepository;
        this.configService = configService;
        this.ambiente = process.env.NFSE_AMBIENTE || 'homologacao';
        this.nuvemFiscalUrl = 'https://api.nuvemfiscal.com.br/nfse/dps';

        // Garantir que os repositórios estejam corretamente injetados
        if (!this.nfseRepository) {
            throw new Error('NfseRepository não foi injetado corretamente');
        }
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

            // Validar dados
            this.validarDadosNfse(payloadData);

            // Construir payload para Nuvem Fiscal
            const nfsePayload = this.construirPayloadNfse(payloadData);

            logger.info('Payload montado para emissão de NFSe', { 
                movementId: detailedMovement.movement.movement_id,
                nfsePayload 
            });

            // Aqui você adicionaria a chamada para o serviço de emissão de NFSe
            const nfseResponse = await this.emitirNfseNuvemFiscal(nfsePayload, detailedMovement.license);

            return {
                success: true,
                message: 'Payload de NFSe montado com sucesso',
                payload: nfsePayload,
                nfseResponse
            };
        } catch (error) {
            logger.error('Erro ao montar payload de NFSe', { 
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
        let payload; // Declarar payload antes para evitar erro de referência
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

            // Implementar método de salvar no repositório
            const novoNfse = await this.nfseRepository.create({
                movement_id: dadosNFSe.referencia,
                ambiente: response.ambiente,
                payload: JSON.stringify(payload),
                response_payload: JSON.stringify(response),
                status: response.status,
                integration_nfse_id: response.id,
                numero_nfse: null, // Ainda não disponível neste retorno
                codigo_verificacao: null, // Ainda não disponível neste retorno
                created_at: response.created_at,
                mensagens: JSON.stringify(response.mensagens)
            });

            logger.info('NFSe emitida com sucesso', { 
                movementId: dadosNFSe.referencia,
                nfseId: novoNfse.nfse_id,
                integrationId: response.id,
                status: response.status
            });

            return novoNfse;
        } catch (error) {
            logger.error('Erro ao emitir NFSe na Nuvem Fiscal', { 
                errorMessage: error.message,
                errorStack: error.stack,
                payload: payload ? JSON.stringify(payload) : 'Payload não definido'
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

    /**
     * Busca uma NFSE por ID
     * @param {number} id - ID da NFSE
     * @returns {Promise<Object>} NFSE encontrada
     */
    async findById(id) {
        try {
            const nfse = await NfseRepository.findById(id);
            if (!nfse) {
                throw new NotFoundError('NFSE não encontrada');
            }
            return nfse;
        } catch (error) {
            logger.error('Erro ao buscar NFSE por ID', { error, id });
            throw error;
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
                cnpjEmitente,
                errorResponse: error.response?.data,
                errorStack: error.stack
            });
            throw error;
        }
    }
}

module.exports = NfseService;
