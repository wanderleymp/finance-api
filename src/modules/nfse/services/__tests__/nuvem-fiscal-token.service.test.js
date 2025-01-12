const nuvemFiscalTokenService = require('../nuvem-fiscal-token.service');
const axios = require('axios');

// Mock manual de banco de dados
jest.mock('../../../../database', () => ({
  query: jest.fn()
}));

// Mock do axios
jest.mock('axios');

describe('NuvemFiscalTokenService', () => {
  const mockCredenciais = {
    client_id: 'test_client_id',
    client_secret: 'test_client_secret',
    environment: 'HOMOLOGACAO'
  };

  beforeEach(() => {
    // Obtém o mock do banco de dados
    const database = require('../../../../database');

    // Limpa o cache antes de cada teste
    nuvemFiscalTokenService.limparTokenCache();
    
    // Mock da consulta ao banco de dados
    database.query.mockResolvedValue({
      rows: [mockCredenciais]
    });

    // Limpa mocks do axios
    jest.clearAllMocks();
  });

  it('deve obter credenciais do banco de dados', async () => {
    const database = require('../../../../database');
    const credenciais = await nuvemFiscalTokenService.obterCredenciais();

    expect(credenciais).toEqual(mockCredenciais);
    expect(database.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT')
    );
    expect(database.query).toHaveBeenCalledWith(
      expect.stringContaining('client_id')
    );
    expect(database.query).toHaveBeenCalledWith(
      expect.stringContaining('Nuvem Fiscal')
    );
  });

  it('deve obter um novo token quando não há token em cache', async () => {
    // Mock da resposta do axios
    axios.post.mockResolvedValue({
      data: {
        access_token: 'mock_access_token',
        expires_in: 3600 // 1 hora
      }
    });

    const token = await nuvemFiscalTokenService.obterToken();

    expect(token).toBe('mock_access_token');
    expect(axios.post).toHaveBeenCalledWith(
      'https://auth.nuvemfiscal.com.br/oauth/token',
      {
        grant_type: 'client_credentials',
        client_id: mockCredenciais.client_id,
        client_secret: mockCredenciais.client_secret
      },
      expect.any(Object)
    );
  });

  it('deve reutilizar o token em cache se ainda for válido', async () => {
    // Mock da resposta do axios
    axios.post.mockResolvedValue({
      data: {
        access_token: 'mock_access_token',
        expires_in: 3600 // 1 hora
      }
    });

    // Obtém o primeiro token
    const primeiroToken = await nuvemFiscalTokenService.obterToken();

    // Limpa o mock para verificar se não faz nova chamada
    jest.clearAllMocks();

    // Obtém o segundo token
    const segundoToken = await nuvemFiscalTokenService.obterToken();

    // Verifica que o token é o mesmo e não houve nova chamada
    expect(segundoToken).toBe(primeiroToken);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('deve lançar erro se não encontrar credenciais', async () => {
    const database = require('../../../../database');

    // Mock de banco de dados sem resultados
    database.query.mockResolvedValue({ rows: [] });

    await expect(nuvemFiscalTokenService.obterCredenciais()).rejects.toThrow(
      'Credenciais da Nuvem Fiscal não encontradas'
    );
  });

  it('deve lançar erro se credenciais estiverem incompletas', async () => {
    const database = require('../../../../database');

    // Mock de credenciais incompletas
    database.query.mockResolvedValue({
      rows: [{ client_id: 'test_client_id' }]
    });

    await expect(nuvemFiscalTokenService.obterToken()).rejects.toThrow(
      'Credenciais da Nuvem Fiscal incompletas'
    );
  });
});
