const nuvemFiscalTokenService = require('../src/modules/nfse/services/nuvem-fiscal-token.service');
const { logger } = require('../src/middlewares/logger');

async function gerarToken() {
  try {
    console.log('Iniciando geração de token...');
    
    // Ativar logs detalhados
    process.env.LOG_LEVEL = 'debug';

    // Obter credenciais
    const credenciais = await nuvemFiscalTokenService.obterCredenciais();
    console.log('Credenciais obtidas:', JSON.stringify(credenciais, null, 2));

    // Obter token
    const token = await nuvemFiscalTokenService.obterToken();
    console.log('Token gerado:', token);

    // Verificar validade do token
    const segundoToken = await nuvemFiscalTokenService.obterToken();
    console.log('Comparação de tokens:', {
      primeiroToken: token,
      segundoToken: segundoToken,
      saoIguais: token === segundoToken
    });

  } catch (error) {
    console.error('ERRO COMPLETO:', error);
    console.error('Mensagem de erro:', error.message);
    console.error('Stack trace:', error.stack);
    
    logger.error('Erro na geração de token Nuvem Fiscal', {
      error: error.message,
      stack: error.stack
    });
  }
}

gerarToken();
