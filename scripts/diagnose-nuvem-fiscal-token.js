const temporaryTokenService = require('../src/modules/tokens/services/temporary-token.service');

async function diagnosticarTokenNuvemFiscal() {
  try {
    console.log('Iniciando diagnóstico...');

    // Buscar credenciais
    console.log('Buscando credenciais da Nuvem Fiscal...');
    const credenciais = await temporaryTokenService.obterCredenciais('Nuvem Fiscal');
    console.log('Credenciais encontradas:', JSON.stringify(credenciais, null, 2));

    // Tentar obter token
    console.log('Obtendo token da Nuvem Fiscal...');
    const token = await temporaryTokenService.obterToken('Nuvem Fiscal');
    console.log('Token obtido:', token);

  } catch (error) {
    console.error('Erro no diagnóstico:', error);
  }
}

diagnosticarTokenNuvemFiscal();
