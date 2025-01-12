const temporaryTokenService = require('../src/modules/tokens/services/temporary-token.service');
const nuvemFiscalTokenRepository = require('../src/modules/nfse/repositories/nuvem-fiscal-token.repository');
const { systemDatabase } = require('../src/config/database');

async function diagnosticarTokenNuvemFiscal() {
  try {
    console.log('Iniciando diagnóstico...');

    // Verificar conexão com banco de dados
    console.log('Testando conexão com banco de dados...');
    const result = await systemDatabase.pool.query('SELECT NOW()');
    console.log('Hora atual do banco:', result.rows[0].now);

    // Buscar credenciais
    console.log('Buscando credenciais da Nuvem Fiscal...');
    const credenciais = await temporaryTokenService.obterCredenciais('Nuvem Fiscal');
    console.log('Credenciais encontradas:', JSON.stringify(credenciais, null, 2));

    // Tentar obter token
    console.log('Obtendo token da Nuvem Fiscal...');
    const token = await temporaryTokenService.obterToken('Nuvem Fiscal');
    console.log('Token obtido:', token);

    // Verificar token no repositório
    console.log('Verificando token no repositório...');
    const tokenSalvo = await nuvemFiscalTokenRepository.obterTokenValido();
    console.log('Token salvo:', JSON.stringify(tokenSalvo, null, 2));

  } catch (error) {
    console.error('Erro no diagnóstico:', error);
  } finally {
    await systemDatabase.pool.end();
  }
}

diagnosticarTokenNuvemFiscal();
