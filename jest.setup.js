// Mock do logger para não poluir os testes
jest.mock('./src/middlewares/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }
}));

// Configuração global do Jest
jest.setTimeout(10000); // 10 segundos

// Limpar todos os mocks após cada teste
afterEach(() => {
    jest.clearAllMocks();
});
