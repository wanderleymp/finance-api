const axios = require('axios');
const { logger } = require('../../middlewares/logger');
const NfseRepository = require('./nfse.repository');
const CreateNfseDto = require('./dto/create-nfse.dto');
const UpdateNfseDto = require('./dto/update-nfse.dto');
const { NotFoundError, ValidationError } = require('../../utils/errors');
const { formatCNPJ, formatCPF } = require('../../utils/formatters');
const temporaryTokenService = require('../tokens/services/temporary-token.service');

class NfseService {
    constructor(repository) {
        this.repository = repository;
        this.nuvemFiscalUrl = 'https://api.nuvemfiscal.com.br/nfse/dps';
    }

    /**
     * Valida e prepara os dados para emissão de NFS-e
     * @param {Object} data - Dados para emissão da NFS-e
     * @returns {Object} Payload validado e preparado
     */
    _prepararPayloadNfse(data) {
        logger.info('Dados recebidos para preparação do payload', {
            dadosRecebidos: JSON.stringify(data, null, 2)
        });

        console.log('Dados completos para NFSe:', JSON.stringify(data, null, 2));
        console.log('Dados do tomador:', JSON.stringify(data.toma, null, 2));
        console.log('Endereço do tomador:', JSON.stringify(data.toma?.endereco, null, 2));

        // Validações de campos obrigatórios (mantidas)
        const camposObrigatorios = [
            { campo: 'cpfCnpj', mensagem: 'CNPJ do prestador é obrigatório' },
            { campo: 'razaoSocial', mensagem: 'Razão Social do prestador é obrigatória' },
            { campo: 'inscricaoMunicipal', mensagem: 'Inscrição Municipal do prestador é obrigatória' }
        ];

        const camposEndereco = [
            { campo: 'logradouro', mensagem: 'Logradouro do prestador é obrigatório' },
            { campo: 'numero', mensagem: 'Número do endereço do prestador é obrigatório' },
            { campo: 'bairro', mensagem: 'Bairro do prestador é obrigatório' },
            { campo: 'cep', mensagem: 'CEP do prestador é obrigatório' }
        ];

        const prestadorDataValidado = data.prest || {};

        logger.info('Dados do Prestador Recebidos', {
            prestadorData: JSON.stringify(prestadorDataValidado, null, 2),
            enderecoData: JSON.stringify(prestadorDataValidado.endereco, null, 2)
        });

        // Validar campos obrigatórios do prestador
        for (const { campo, mensagem } of camposObrigatorios) {
            if (!prestadorDataValidado[campo]) {
                logger.error(`Validação de Prestador Falhou - ${mensagem}`, {
                    campo,
                    valorAtual: prestadorDataValidado[campo],
                    dadosCompletos: JSON.stringify(prestadorDataValidado, null, 2)
                });
                throw new ValidationError(mensagem);
            }
        }

        // Validar campos do endereço
        const enderecoData = prestadorDataValidado.endereco || {};
        for (const { campo, mensagem } of camposEndereco) {
            if (!enderecoData[campo]) {
                logger.error(`Validação de Endereço do Prestador Falhou - ${mensagem}`, {
                    campo,
                    valorAtual: enderecoData[campo],
                    dadosEndereco: JSON.stringify(enderecoData, null, 2)
                });
                throw new ValidationError(mensagem);
            }
        }

        if (!data.serv || !data.serv.valorServico) {
            throw new ValidationError('Valor do serviço é obrigatório');
        }

        // Calcular tributos municipais com base na alíquota do serviço
        const valorServico = data.serv.valorServico;
        const aliquotaMunicipal = data.serv.aliquota || 2; // Valor padrão de 2%
        const valorTributoMunicipal = Number((valorServico * (aliquotaMunicipal / 100)).toFixed(2));

        const tributos = data.serv.tributos || {
            vTribFed: 0,
            vTribEst: 0,
            vTribMun: 0,
            pTribFed: 0,
            pTribEst: 0,
            pTribMun: 0
        };

        const payload = {
            provedor: data.provedor || 'padrao',
            ambiente: data.ambiente || 'producao', // Mudança para produção por padrão
            referencia: data.referencia || null,
            infDPS: {
                tpAmb: data.ambiente === 'homologacao' ? 2 : 1,
                dhEmi: new Date().toISOString(),
                verAplic: 'finance-api',
                dCompet: data.dCompet || new Date().toISOString().split('T')[0],
                prest: {
                    CNPJ: data.prest.cpfCnpj.replace(/\D/g, '')
                },
                toma: data.toma ? {
                    [data.toma.documentType === 'CNPJ' ? 'CNPJ' : 'CPF']: data.toma.cpfCnpj.replace(/\D/g, ''),
                    xNome: data.toma.razaoSocial
                } : null,
                serv: {
                    cServ: {
                        cTribNac: data.serv.codServico || '0000',
                        cTribMun: String(data.serv.codMunicipio || '0000'), 
                        xDescServ: data.serv.descricao || 'Serviço não especificado'
                    }
                },
                valores: {
                    vServPrest: {
                        vServ: valorServico
                    },
                    trib: {
                        tribMun: {
                            cLocIncid: 1100205,
                            pAliq: aliquotaMunicipal,
                            tribISSQN: 1
                        },
                        vTribFed: tributos.vTribFed || 0,
                        vTribEst: tributos.vTribEst || 0,
                        vTribMun: valorTributoMunicipal,
                        pTribFed: tributos.pTribFed || 0,
                        pTribEst: tributos.pTribEst || 0,
                        pTribMun: aliquotaMunicipal,
                        vTrib: valorTributoMunicipal
                    }
                }
            }
        };

        logger.info('Dados de Tributos', {
            valorServico,
            aliquotaMunicipal,
            valorTributoMunicipal,
            tributos
        });

        logger.info('Payload antes da verificação de trib', {
            payloadParcial: JSON.stringify(payload, null, 2)
        });

        // Adicionar cálculo de tributos de forma mais detalhada
        const valorServicoCompleto = payload.infDPS.valores.vServPrest.vServ;
        const aliquotaMunicipalCompleta = 0.02; // 2% de alíquota municipal padrão
        const valorTributoMunicipalCompleto = valorServicoCompleto * aliquotaMunicipalCompleta;

        // Adicionar o objeto trib com todos os campos necessários
        payload.infDPS.valores.trib = {
            tribMun: {
                cLocIncid: 1100205,
                pAliq: aliquotaMunicipalCompleta * 100, // Percentual de alíquota
                tribISSQN: 1, // Indica que é tributo de ISSQN
                vTrib: valorTributoMunicipalCompleto
            },
            vTribFed: 0, // Valor de tributo federal (pode ser ajustado conforme necessário)
            vTribEst: 0, // Valor de tributo estadual (pode ser ajustado conforme necessário)
            vTribMun: valorTributoMunicipalCompleto,
            pTribFed: 0, // Percentual de tributo federal 
            pTribEst: 0, // Percentual de tributo estadual
            pTribMun: aliquotaMunicipalCompleta * 100, // Percentual de tributo municipal
            vTrib: valorTributoMunicipalCompleto
        };

        logger.info('Detalhes de Tributos Adicionados', {
            valorServicoCompleto,
            aliquotaMunicipalCompleta,
            valorTributoMunicipalCompleto,
            trib: payload.infDPS.valores.trib
        });

        logger.info('Payload NFSe Final', {
            payloadGerado: JSON.stringify(payload, null, 2)
        });

        logger.info('Payload NFSe Final com trib', {
            payloadGerado: JSON.stringify(payload, null, 2)
        });

        return payload;
    }

    /**
     * Formata documento (CNPJ/CPF)
     * @param {string} documento - Documento a ser formatado
     * @returns {string} Documento formatado
     */
    _formatarDocumento(documento) {
        if (!documento) return null;
        
        // Remove caracteres não numéricos
        const docNumerico = documento.replace(/\D/g, '');
        
        // Verifica se é CNPJ ou CPF
        return docNumerico.length === 14 
            ? formatCNPJ(docNumerico) 
            : formatCPF(docNumerico);
    }

    /**
     * Emite uma NFS-e via Nuvem Fiscal
     * @param {Object} data - Dados para emissão da NFS-e
     * @returns {Promise<Object>} Resposta da emissão da NFS-e
     */
    async emitirNfseNuvemFiscal(data) {
        try {
            // Preparar payload
            const payload = this._prepararPayloadNfse(data);

            logger.info('Payload Completo para Nuvem Fiscal', {
                payloadCompleto: JSON.stringify(payload, null, 2)
            });

            logger.info('Payload Nuvem Fiscal', {
                payload,
                ambiente: payload.ambiente
            });

            // Obter token para o ambiente correto
            const ambiente = payload.ambiente || 'homologacao';
            const token = await temporaryTokenService.obterToken(ambiente === 'producao' ? 'PRODUCAO' : 'Nuvem Fiscal');

            // Log detalhado do curl
            const curlCommand = `curl -X POST ${this.nuvemFiscalUrl} \
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${token}" \
-H "Accept: application/json" \
-d '${JSON.stringify(payload)}'`;

            logger.info('Curl Detalhado para Nuvem Fiscal', {
                url: this.nuvemFiscalUrl,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                payload: JSON.stringify(payload, null, 2),
                curlCommand: curlCommand
            });

            // Configurar headers de autenticação
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            };

            // Fazer requisição para a API da Nuvem Fiscal
            const response = await axios.post(
                this.nuvemFiscalUrl, 
                payload, 
                { headers }
            );

            // Registrar log da emissão
            logger.info('NFS-e emitida com sucesso via Nuvem Fiscal', { 
                nfseId: response.data.id,
                ambiente: payload.ambiente 
            });

            // Salvar dados da NFS-e no repositório
            const nfseData = {
                integration_id: response.data.id,
                invoice_id: data.invoiceId, // Opcional, passar ID da invoice relacionada
                status: 'emitida',
                raw_data: JSON.stringify(response.data),
                prestador_cnpj: payload.infDPS.prest.CNPJ,
                valor_servico: payload.infDPS.valores.vServPrest.vServ,
                data_emissao: payload.infDPS.dhEmi
            };

            const createdNfse = await this.repository.create(nfseData);

            return {
                nuvemFiscalResponse: response.data,
                localNfse: createdNfse
            };
        } catch (error) {
            // Tratamento detalhado de erros
            const errorDetails = error.response?.data || error.message;
            logger.error('Erro ao emitir NFS-e via Nuvem Fiscal', { 
                error: errorDetails, 
                data 
            });

            throw new Error(`Falha na emissão de NFS-e: ${errorDetails?.message || errorDetails}`);
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

            const nfse = await this.repository.create(createNfseDto);
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
            const existingNfse = await this.repository.findById(id);
            if (!existingNfse) {
                throw new NotFoundError('NFSE não encontrada');
            }

            const updateData = { ...existingNfse, ...data };
            const updateNfseDto = new UpdateNfseDto(updateData);

            const nfse = await this.repository.update(id, updateNfseDto);
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
            const nfse = await this.repository.findById(id);
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
            return await this.repository.findByInvoiceId(invoiceId);
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
            return await this.repository.findByIntegrationId(integrationNfseId);
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
            const result = await this.repository.findAll(page, limit, filters);
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
            const existingNfse = await this.repository.findById(id);
            if (!existingNfse) {
                throw new NotFoundError('NFSE não encontrada');
            }

            await this.repository.delete(id);
            logger.info('NFSE removida com sucesso', { nfseId: id });
            return true;
        } catch (error) {
            logger.error('Erro ao remover NFSE', { error, id });
            throw error;
        }
    }

    /**
     * Mapeia os dados para o payload da NFSE
     * @param {Object} dadosNFSe - Dados da NFSE
     * @returns {Object} Payload da NFSE
     */
    mapearPayloadNFSe(dadosNFSe) {
        const serviceDetails = dadosNFSe.serviceDetailsQuery || {};
        
        return {
            provedor: 'padrao',
            ambiente: dadosNFSe.ambiente === 'producao' ? 2 : 2, // Homologação
            referencia: dadosNFSe.invoiceId.toString(),
            infDPS: {
                tpAmb: 2, // Ambiente de homologação
                dhEmi: new Date().toISOString(),
                verAplic: 'finance-api',
                dCompet: dadosNFSe.movementData.movement_date.split('T')[0],
                prest: {
                    CNPJ: dadosNFSe.prest.cpfCnpj
                },
                toma: {
                    CPF: dadosNFSe.toma.cpfCnpj,
                    xNome: dadosNFSe.toma.razaoSocial
                },
                serv: {
                    cServ: {
                        cTribNac: dadosNFSe.serv.codServico || '0000',
                        cTribMun: 1100205, // Porto Velho
                        xDescServ: dadosNFSe.serv.descricao || 'Serviço não especificado'
                    }
                },
                valores: {
                    vServPrest: {
                        vServ: parseFloat(dadosNFSe.serv.valorServico || dadosNFSe.movementData.total_amount)
                    },
                    trib: {
                        tribMun: {
                            tribISSQN: 1, // Fixo para ISS
                            cLocIncid: 1100205, // Porto Velho
                            pAliq: parseFloat(dadosNFSe.serv.aliquota || 2),
                            vTrib: parseFloat(((dadosNFSe.serv.valorServico || dadosNFSe.movementData.total_amount) * (dadosNFSe.serv.aliquota || 0.02)).toFixed(2))
                        },
                        vTribFed: 0,
                        vTribEst: 0,
                        vTribMun: parseFloat(((dadosNFSe.serv.valorServico || dadosNFSe.movementData.total_amount) * (dadosNFSe.serv.aliquota || 0.02)).toFixed(2)),
                        pTribFed: 0,
                        pTribEst: 0,
                        pTribMun: parseFloat(dadosNFSe.serv.aliquota || 2),
                        vTrib: parseFloat(((dadosNFSe.serv.valorServico || dadosNFSe.movementData.total_amount) * (dadosNFSe.serv.aliquota || 0.02)).toFixed(2))
                    }
                }
            }
        };
    }
}

module.exports = NfseService;
