const temporaryTokenService = require('../src/modules/tokens/services/temporary-token.service');
const temporaryTokenRepository = require('../src/modules/tokens/repositories/temporary-token.repository');

async function diagnosticarTokenNuvemFiscal() {
  try {
    console.log('Iniciando diagnóstico...');

    // Buscar credenciais
    console.log('Buscando credenciais da Nuvem Fiscal...');
    const credenciais = await temporaryTokenService.obterCredenciais('Nuvem Fiscal');
    console.log('Credenciais encontradas:', JSON.stringify(credenciais, null, 2));

    // Remover tokens existentes para forçar geração de novo token
    console.log('Removendo tokens existentes...');
    await temporaryTokenRepository.removeExpiredTokens();

    // Tentar obter token
    console.log('Obtendo token da Nuvem Fiscal...');
    const token = await temporaryTokenService.obterToken('Nuvem Fiscal');
    console.log('Token obtido:', token);

    // Verificar tokens salvos
    console.log('Verificando tokens salvos...');
    const savedTokens = await temporaryTokenRepository.findValidTokenByCredentialId(credenciais.credential_id);
    console.log('Tokens salvos:', JSON.stringify(savedTokens, null, 2));

  } catch (error) {
    console.error('Erro no diagnóstico:', error);
  }
}

diagnosticarTokenNuvemFiscal();
