const { Pool } = require('pg');
const { logger } = require('../middlewares/logger');

// Mock do pool para testes
const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
    on: jest.fn(),
    end: jest.fn()
};

// Factory para criar pool de teste
const createTestPool = () => {
    if (process.env.NODE_ENV === 'test') {
        return mockPool;
    }

    // Se não estiver em teste, usar pool real
    const pool = new Pool({
        connectionString: process.env.TEST_DATABASE_URL,
        ssl: false,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        max: 2 // Menor número de conexões para testes
    });

    pool.on('error', (err) => {
        logger.error('Erro no pool de teste:', err);
    });

    return pool;
};

// Limpar todos os mocks entre testes
const clearPoolMocks = () => {
    mockPool.query.mockClear();
    mockPool.connect.mockClear();
    mockPool.on.mockClear();
    mockPool.end.mockClear();
};

module.exports = {
    createTestPool,
    mockPool,
    clearPoolMocks
};
