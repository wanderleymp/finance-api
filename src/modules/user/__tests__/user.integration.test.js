const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { mockPool, clearPoolMocks } = require('../../../config/test-database');

// Mock do Redis
jest.mock('../../../config/redis', () => ({
    client: {
        get: jest.fn(),
        setex: jest.fn(),
        del: jest.fn()
    }
}));

// Mock do logger
jest.mock('../../../middlewares/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn()
    }
}));

// Mock do database para usar o pool de teste
jest.mock('../../../config/database', () => ({
    systemDatabase: mockPool
}));

// Mock das variáveis de ambiente
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_EXPIRATION = '1h';
process.env.JWT_REFRESH_EXPIRATION = '7d';

// Importar app depois dos mocks
const app = require('../../../app');

describe('Testes de Integração do Módulo de Usuário', () => {
    const mockUser = {
        username: 'testuser',
        password: 'Test@123',
        person_id: 1,
        profile_id: 1
    };

    const mockCreatedUser = {
        id: 1,
        ...mockUser,
        password: 'hashedpassword',
        enable_2fa: false,
        active: true,
        refresh_token: null,
        created_at: new Date(),
        updated_at: new Date()
    };

    beforeEach(() => {
        clearPoolMocks();
        jest.clearAllMocks();
    });

    describe('POST /api/users', () => {
        it('deve criar um novo usuário', async () => {
            // Arrange
            mockPool.query
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT
                .mockResolvedValueOnce({ rows: [mockCreatedUser] }); // SELECT

            jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword');

            // Act
            const response = await request(app)
                .post('/api/users')
                .send(mockUser)
                .expect('Content-Type', /json/)
                .expect(201);

            // Assert
            expect(response.body).toBeDefined();
            expect(response.body.id).toBe(1);
            expect(response.body.username).toBe(mockUser.username);
            expect(response.body.password).toBeUndefined();
            expect(mockPool.query).toHaveBeenCalledTimes(2);
        });

        it('deve retornar 400 quando o username já existe', async () => {
            // Arrange
            mockPool.query
                .mockRejectedValueOnce(new Error('duplicate key value violates unique constraint'));

            // Act
            const response = await request(app)
                .post('/api/users')
                .send(mockUser)
                .expect('Content-Type', /json/)
                .expect(400);

            // Assert
            expect(response.body.message).toBe('Username já existe');
        });

        it('deve retornar 400 quando campos obrigatórios estão faltando', async () => {
            // Arrange
            const invalidUser = {
                username: 'test'
            };

            // Act
            const response = await request(app)
                .post('/api/users')
                .send(invalidUser)
                .expect('Content-Type', /json/)
                .expect(400);

            // Assert
            expect(response.body.message).toBeDefined();
        });
    });

    describe('PUT /api/users/:id', () => {
        const mockToken = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);

        it('deve atualizar o usuário com sucesso', async () => {
            // Arrange
            const updateData = {
                username: 'newusername'
            };

            const mockUpdatedUser = {
                ...mockCreatedUser,
                username: 'newusername'
            };

            mockPool.query
                .mockResolvedValueOnce({ rows: [mockCreatedUser] }) // SELECT para verificar existência
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPDATE
                .mockResolvedValueOnce({ rows: [mockUpdatedUser] }); // SELECT após update

            // Act
            const response = await request(app)
                .put('/api/users/1')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(updateData)
                .expect('Content-Type', /json/)
                .expect(200);

            // Assert
            expect(response.body).toBeDefined();
            expect(response.body.username).toBe(updateData.username);
            expect(response.body.password).toBeUndefined();
            expect(mockPool.query).toHaveBeenCalledTimes(3);
        });

        it('deve retornar 404 quando usuário não encontrado', async () => {
            // Arrange
            const updateData = {
                username: 'newusername'
            };

            mockPool.query
                .mockResolvedValueOnce({ rows: [] }); // No user found

            // Act
            const response = await request(app)
                .put('/api/users/999')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(updateData)
                .expect('Content-Type', /json/)
                .expect(404);

            // Assert
            expect(response.body.message).toBe('Usuário não encontrado');
        });

        it('deve retornar 401 quando token não fornecido', async () => {
            // Act
            const response = await request(app)
                .put('/api/users/1')
                .send({ username: 'newusername' })
                .expect('Content-Type', /json/)
                .expect(401);

            // Assert
            expect(response.body.message).toBeDefined();
        });
    });

    describe('PUT /api/users/:id/password', () => {
        const mockToken = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);

        it('deve atualizar a senha com sucesso', async () => {
            // Arrange
            const passwordData = {
                oldPassword: 'Test@123',
                newPassword: 'NewTest@123'
            };

            mockPool.query
                .mockResolvedValueOnce({ rows: [mockCreatedUser] }) // SELECT para verificar existência
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPDATE
                .mockResolvedValueOnce({ rows: [mockCreatedUser] }); // SELECT após update

            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
            jest.spyOn(bcrypt, 'hash').mockResolvedValue('newhashpassword');

            // Act
            const response = await request(app)
                .put('/api/users/1/password')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(passwordData)
                .expect('Content-Type', /json/)
                .expect(200);

            // Assert
            expect(response.body).toBeDefined();
            expect(response.body.password).toBeUndefined();
            expect(mockPool.query).toHaveBeenCalledTimes(3);
        });

        it('deve retornar 400 quando senha atual incorreta', async () => {
            // Arrange
            const passwordData = {
                oldPassword: 'WrongPass@123',
                newPassword: 'NewTest@123'
            };

            mockPool.query
                .mockResolvedValueOnce({ rows: [mockCreatedUser] }); // SELECT para verificar existência

            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

            // Act
            const response = await request(app)
                .put('/api/users/1/password')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(passwordData)
                .expect('Content-Type', /json/)
                .expect(400);

            // Assert
            expect(response.body.message).toBe('Senha atual inválida');
        });
    });

    describe('GET /api/users/:id', () => {
        const mockToken = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);

        it('deve retornar usuário pelo id', async () => {
            // Arrange
            mockPool.query
                .mockResolvedValueOnce({ rows: [mockCreatedUser] });

            // Act
            const response = await request(app)
                .get('/api/users/1')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect('Content-Type', /json/)
                .expect(200);

            // Assert
            expect(response.body).toBeDefined();
            expect(response.body.id).toBe(1);
            expect(response.body.username).toBe(mockUser.username);
            expect(response.body.password).toBeUndefined();
            expect(mockPool.query).toHaveBeenCalledTimes(1);
        });

        it('deve retornar 404 quando usuário não encontrado', async () => {
            // Arrange
            mockPool.query
                .mockResolvedValueOnce({ rows: [] });

            // Act
            const response = await request(app)
                .get('/api/users/999')
                .set('Authorization', `Bearer ${mockToken}`)
                .expect('Content-Type', /json/)
                .expect(404);

            // Assert
            expect(response.body.message).toBe('Usuário não encontrado');
        });
    });
});
