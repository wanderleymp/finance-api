const axios = require('axios');
const { logger } = require('../../middlewares/logger');
const NfseRepository = require('./nfse.repository');
const CreateNfseDto = require('./dto/create-nfse.dto');
const UpdateNfseDto = require('./dto/update-nfse.dto');
const { NotFoundError, ValidationError } = require('../../utils/errors');
const { formatCNPJ, formatCPF } = require('../../utils/formatters');
const temporaryTokenService = require('../tokens/services/temporary-token.service');

class NfseService {
    constructor() {
        this.ambiente = process.env.NFSE_AMBIENTE || 'homologacao';
        this.nuvemFiscalUrl = 'https://api.nuvemfiscal.com.br/nfse/dps';
    }

    async emitirNfse(nfseData) {
        try {
            logger.info('Dados recebidos para emissão de NFSe', {
                dadosRecebidos: JSON.stringify(nfseData, null, 2)
            });

            this.validarDadosNfse(nfseData);
            const payload = this.construirPayloadNfse(nfseData);
            return await this.emitirNfseProvedorPadrao(payload);
        } catch (error) {
            throw new Error(`Falha na emissão de NFS-e: ${error.message}`);
        }
    }

    validarDadosNfse(data) {
        logger.info('Validando dados para NFSe', {
            prestador: data.prestador,
            tomador: data.tomador,
            servico: data.servico,
            valores: data.valores
        });

        if (!data.prestador.cnpj) {
            logger.error('Validação de NFSE falhou - CNPJ do prestador é obrigatório', {
                prestador: data.prestador
            });
            throw new Error('CNPJ do prestador é obrigatório');
        }
        
        // Modificado para aceitar os novos campos
        const tomadorDocumento = data.tomador_documento || 
            (data.tomador?.documento?.numero ? data.tomador.documento.numero : null);
        
        // Remover prefixo 'CPF: ' se existir
        const documentoLimpo = tomadorDocumento ? 
            tomadorDocumento.replace(/^(CPF:\s*)?/, '').replace(/\D/g, '') : 
            null;
        
        if (!documentoLimpo) {
            logger.error('Validação de NFSE falhou - Documento do tomador é obrigatório', {
                tomador: data.tomador,
                tomadorDocumento
            });
            throw new Error('Documento do tomador é obrigatório');
        }
        
        if (!data.servico.length) {
            logger.error('Validação de NFSE falhou - Serviço é obrigatório', {
                servico: data.servico
            });
            throw new Error('Serviço é obrigatório');
        }
        // Adicione outras validações necessárias
    }

    construirPayloadNfse(data) {
    logger.info('Dados completos recebidos para construção de NFSe', { 
      movimento: {
        id: data.movimento.id,
        data: data.movimento.data,
        referencia: data.movimento.referencia
      },
      prestador: {
        cnpj: data.prestador.cnpj,
        nome: data.prestador.nome,
        endereco: data.prestador.endereco
      },
      tomador: data.tomador || {
        documento: {
          tipo: data.tomador_documento_type === 'CNPJ' ? 2 : 1,
          numero: data.tomador_documento
        },
        nome: data.tomador_razao_social,
        endereco: null
      },
      servico: data.servico.map(s => ({
        cnae: s.cnae,
        codTributacaoNacional: s.codTributacaoNacional,
        codTributacaoMunicipal: s.codTributacaoMunicipal,
        descricao: s.descricao,
        valor: s.valor
      })),
      valores: data.valores
    });

    logger.info('Construindo payload para NFSe', { 
      data,
      servico: data.servico[0],
      codTributacaoNacional: data.servico[0].codTributacaoNacional,
      codTributacaoMunicipal: data.servico[0].codTributacaoMunicipal,
      cnae: data.servico[0].cnae,
      descricao: data.servico[0].descricao
    });

    // Formatar data para o padrão YYYY-MM-DD
    const dataFormatada = new Date(data.movimento.data).toISOString().split('T')[0];

    // Determinar o tipo de documento (CPF ou CNPJ)
    const tipoDocumento = data.tomador_documento_type === 'CNPJ' ? 'CNPJ' : 'CPF';
    const documentoTomador = data.tomador_documento;

    return {
      provedor: "padrao",
      ambiente: "producao",
      referencia: data.movimento.referencia,
      infDPS: {
        tpAmb: 1, // Produção
        dhEmi: data.movimento.data,
        dCompet: dataFormatada,
        prest: {
          CNPJ: data.prestador.cnpj
        },
        toma: {
          [tipoDocumento]: documentoTomador,
          xNome: data.tomador_razao_social,
          end: {
            endNac: {
              cMun: '',
              CEP: ''
            },
            xLgr: '',
            nro: '',
            xBairro: ''
          },
          fone: null,
          email: ''
        },
        serv: {
          xDescServ: data.servico[0].descricao,
          CNAE: data.servico[0].cnae,
          cTribNac: data.servico[0].codTributacaoNacional,
          cTribMun: data.servico[0].codTributacaoMunicipal
        },
        valores: { 
          vServPrest: {
            vServ: parseFloat(data.valores.servico)
          },
          trib: {
            tribMun: {
              tribISSQN: 1,
              cLocIncid: data.prestador.endereco?.ibge,
              pAliq: data.valores.aliquota * 100
            }
          }
        }
      }
    };
  }

    async emitirNFSeNuvemFiscal(dadosNFSe) {
        try {
            // Obtém token válido usando o serviço de token temporário
            const token = await temporaryTokenService.obterToken('Nuvem Fiscal');

            logger.info('Token obtido para emissão de NFSe', {
                tokenValido: !!token
            });

            // Construir payload para NFSe
            const payload = this.construirPayloadNfse(dadosNFSe);

            logger.info('Payload para emissão de NFSe', { payload });

            // Enviar requisição para emissão de NFSe
            const response = await axios.post(
                'https://api.nuvemfiscal.com.br/nfse/emissao', 
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            logger.info('Resposta da Nuvem Fiscal', { 
                data: response.data 
            });

            return {
                numero_nfse: response.data.numero,
                codigo_verificacao: response.data.codigoVerificacao,
                link_nfse: response.data.linkNFSe,
                status: 'EMITIDA'
            };
        } catch (error) {
            logger.error('Erro ao emitir NFSe na Nuvem Fiscal', { 
                error: error.message,
                response: error.response?.data,
                stack: error.stack
            });
            throw error;
        }
    }

    async emitirNfseProvedorPadrao(payload) {
        try {
            // Obter token para o ambiente correto
            const ambiente = payload.ambiente || 'homologacao';
            const token = await temporaryTokenService.obterToken(ambiente === 'producao' ? 'Nuvem Fiscal' : 'Nuvem Fiscal');

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
                invoice_id: payload.referencia, // Opcional, passar ID da invoice relacionada
                status: 'emitida',
                raw_data: JSON.stringify(response.data),
                prestador_cnpj: payload.infDPS.prest.CNPJ,
                valor_servico: payload.infDPS.valores.vServPrest.vServ,
                data_emissao: payload.infDPS.dhEmi
            };

            const createdNfse = await NfseRepository.create(nfseData);

            return {
                nuvemFiscalResponse: response.data,
                localNfse: createdNfse
            };
        } catch (error) {
            // Tratamento detalhado de erros
            const errorDetails = error.response?.data || error.message;
            logger.error('Erro ao emitir NFS-e via Nuvem Fiscal', { 
                error: errorDetails, 
                data: payload
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
}

module.exports = NfseService;
