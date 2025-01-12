const nuvemFiscalTokenService = require('../src/modules/nfse/services/nuvem-fiscal-token.service');
const { logger } = require('../src/middlewares/logger');

async function testNuvemFiscalToken() {
  try {
    // Obter credenciais
    const credenciais = await nuvemFiscalTokenService.obterCredenciais();
    console.log('Credenciais obtidas:', {
      clientId: credenciais.client_id ? 'PRESENTE' : 'AUSENTE',
      ambiente: credenciais.environment
    });

    // Obter token
    const token = await nuvemFiscalTokenService.obterToken();
    console.log('Token obtido:', token ? 'SUCESSO' : 'FALHA');

    // Tentar obter token novamente para verificar cache
    const tokenCache = await nuvemFiscalTokenService.obterToken();
    console.log('Token em cache:', tokenCache ? 'SUCESSO' : 'FALHA');

  } catch (error) {
    console.error('Erro no teste:', error);
    logger.error('Erro no teste de token Nuvem Fiscal', {
      error: error.message,
      stack: error.stack
    });
  }
}

testNuvemFiscalToken();
