const axios = require('axios');
const temporaryTokenService = require('../../tokens/services/temporary-token.service');
const { logger } = require('/root/finance-api/src/middlewares/logger');
const database = require('/root/finance-api/src/config/database');

class EmissaoNfseService {
  async emitirNfseParaMovimento(movementId) {
    try {
      // Obtém token válido
      const token = await temporaryTokenService.obterToken('Nuvem Fiscal');

      // Busca dados do movimento
      const movimento = await this._buscarDadosMovimento(movementId);

      // Prepara payload para a API
      const payload = await this._prepararPayload(movimento);

      // Faz a requisição para emissão de NFSe
      const response = await axios.post('https://api.nuvemfiscal.com.br/nfse', payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Log de sucesso
      logger.info('NFSe emitida para movimento', {
        movementId,
        nfseId: response.data.id,
        numero: response.data.numero,
        codigoVerificacao: response.data.codigo_verificacao
      });

      return {
        id: response.data.id,
        numero: response.data.numero,
        codigoVerificacao: response.data.codigo_verificacao,
        status: response.data.status,
        dataEmissao: response.data.data_emissao
      };
    } catch (error) {
      // Tratamento de erro detalhado
      logger.error('Erro ao emitir NFSe para movimento', {
        movementId,
        error: error.message,
        detalhes: error.response?.data
      });

      throw error;
    }
  }

  async _buscarDadosMovimento(movementId) {
    const client = await database.connect();
    try {
      // Busca dados do movimento, incluindo licença e pessoa
      const movimentoQuery = `
        SELECT 
          m.id as movement_id, 
          l.cnpj as prestador_cnpj, 
          l.inscricao_municipal as prestador_inscricao_municipal,
          p.cnpj as tomador_cnpj, 
          p.razao_social as tomador_razao_social,
          p.endereco as tomador_endereco
        FROM movements m
        JOIN licenses l ON m.license_id = l.id
        JOIN persons p ON m.person_id = p.id
        WHERE m.id = $1
      `;

      // Busca itens do movimento com detalhes de serviço
      const servicosQuery = `
        SELECT 
          vw.codigo_servico,
          vw.descricao_servico,
          mi.valor as valor_servico
        FROM movement_items mi
        JOIN vw_services_details vw ON vw.item_id = mi.item_id
        WHERE mi.movement_id = $1
      `;

      const [movimento, servicos] = await Promise.all([
        client.query(movimentoQuery, [movementId]),
        client.query(servicosQuery, [movementId])
      ]);

      if (movimento.rows.length === 0) {
        throw new Error(`Movimento ${movementId} não encontrado`);
      }

      return {
        ...movimento.rows[0],
        servicos: servicos.rows
      };
    } finally {
      client.release();
    }
  }

  _prepararPayload(dadosMovimento) {
    return {
      ambiente: 'producao', // ou 'homologacao' conforme necessário
      prestador: {
        cnpj: dadosMovimento.prestador_cnpj,
        inscricaoMunicipal: dadosMovimento.prestador_inscricao_municipal
      },
      tomador: {
        cnpj: dadosMovimento.tomador_cnpj,
        razaoSocial: dadosMovimento.tomador_razao_social,
        endereco: dadosMovimento.tomador_endereco ? JSON.parse(dadosMovimento.tomador_endereco) : {}
      },
      servicos: dadosMovimento.servicos.map(servico => ({
        codigo: servico.codigo_servico,
        descricao: servico.descricao_servico,
        valorServicos: servico.valor_servico,
        valorDeducoes: 0, // Pode ser ajustado conforme necessidade
        valorIss: servico.valor_servico * 0.05 // Exemplo de cálculo de ISS, ajustar conforme legislação
      })),
      valorTotal: dadosMovimento.servicos.reduce((total, servico) => total + servico.valor_servico, 0)
    };
  }
}

module.exports = EmissaoNfseService;
