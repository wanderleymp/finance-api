const NFSeService = require('../nfse.service');
const nuvemFiscalTokenService = require('../nuvem-fiscal-token.service');
const database = require('../../../../database');
const { logger } = require('../../../../middlewares/logger');

describe('NFSeService - Integração com Nuvem Fiscal', () => {
  let nfseService;
  let credenciais;

  beforeAll(async () => {
    // Configurar serviço
    nfseService = new NFSeService();

    // Obter credenciais de teste
    const query = `
      SELECT 
        ic.client_id, 
        ic.client_secret, 
        ic.environment
      FROM public.integration_credentials ic
      JOIN public.integrations i ON i.integration_id = ic.integration_id
      WHERE i.system_name = 'Nuvem Fiscal'
    `;
    const result = await database.query(query);
    credenciais = result.rows[0];

    // Configurar log para testes
    logger.info('Credenciais de teste obtidas', {
      ambiente: credenciais.environment
    });
  });

  it('deve obter token da Nuvem Fiscal', async () => {
    const token = await nuvemFiscalTokenService.obterToken();
    
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });

  it('deve mapear payload de NFSe corretamente', () => {
    const dadosNFSe = {
      reference_id: 'REF_TESTE_001',
      prestador_cnpj: '12345678000190',
      prestador_razao_social: 'Empresa Teste LTDA',
      tomador_cnpj: '98765432000110',
      tomador_razao_social: 'Cliente Teste',
      ambiente: 'HOMOLOGACAO',
      valor_total: 1000.00,
      valor_servicos: 1000.00,
      itens: [
        {
          descricao: 'Serviço de Teste',
          quantidade: 1,
          valor_unitario: 1000.00,
          valor_total: 1000.00
        }
      ]
    };

    const payloadMapeado = nfseService.mapearPayloadNFSe(dadosNFSe);

    expect(payloadMapeado).toEqual({
      prestador: {
        cnpj: '12345678000190',
        razaoSocial: 'Empresa Teste LTDA'
      },
      tomador: {
        cnpj: '98765432000110',
        cpf: undefined,
        razaoSocial: 'Cliente Teste'
      },
      servicos: [
        {
          descricao: 'Serviço de Teste',
          quantidade: 1,
          valorUnitario: 1000.00,
          valorTotal: 1000.00
        }
      ],
      valorTotal: 1000.00
    });
  });

  it('deve emitir NFSe em ambiente de homologação', async () => {
    const dadosNFSe = {
      reference_id: 'REF_TESTE_001',
      prestador_cnpj: '12345678000190',
      prestador_razao_social: 'Empresa Teste LTDA',
      tomador_cnpj: '98765432000110',
      tomador_razao_social: 'Cliente Teste',
      ambiente: 'HOMOLOGACAO',
      valor_total: 1000.00,
      valor_servicos: 1000.00,
      itens: [
        {
          descricao: 'Serviço de Teste',
          quantidade: 1,
          valor_unitario: 1000.00,
          valor_total: 1000.00
        }
      ]
    };

    try {
      const nfseEmitida = await nfseService.emitirNFSeNuvemFiscal(dadosNFSe);

      expect(nfseEmitida).toEqual(
        expect.objectContaining({
          numero_nfse: expect.any(String),
          codigo_verificacao: expect.any(String),
          link_nfse: expect.any(String),
          status: 'EMITIDA'
        })
      );
    } catch (error) {
      // Se der erro, vamos logar para debug
      logger.error('Erro ao emitir NFSe', {
        error: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      throw error;
    }
  });
});
