const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ValidationError } = require('../../../utils/errors');
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

// Importar depois dos mocks para garantir que eles estejam prontos
const UserService = require('../user.service');
const UserRepository = require('../user.repository');
const CreateUserDto = require('../dto/create-user.dto');
const UpdateUserDto = require('../dto/update-user.dto');

describe('UserService', () => {
    let service;
    let repository;

    const mockUserData = {
        username: 'testuser',
        password: 'Test@123',
        person_id: 1,
        profile_id: 1
    };

    const mockCreatedUser = {
        id: 1,
        ...mockUserData,
        password: 'hashedpassword',
        enable_2fa: false,
        active: true,
        refresh_token: 'validrefreshtoken',
        created_at: new Date(),
        updated_at: new Date()
    };

    beforeEach(() => {
        clearPoolMocks();
        repository = new UserRepository();
        service = UserService;
        service.repository = repository;
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a user successfully', async () => {
            // Arrange
            const createDto = new CreateUserDto(mockUserData);
            
            mockPool.query
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT
                .mockResolvedValueOnce({ rows: [mockCreatedUser] }); // SELECT

            jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword');

            // Act
            const result = await service.create(createDto);

            // Assert
            expect(result).toBeDefined();
            expect(result.id).toBe(1);
            expect(result.username).toBe(mockUserData.username);
            expect(result.password).toBeUndefined();
            expect(mockPool.query).toHaveBeenCalledTimes(2);
            
            // Verify query parameters
            const insertQuery = mockPool.query.mock.calls[0][0];
            expect(insertQuery.text).toContain('INSERT INTO users');
            expect(insertQuery.values).toContain(mockUserData.username);
        });

        it('should throw error when username already exists', async () => {
            // Arrange
            const createDto = new CreateUserDto(mockUserData);
            
            mockPool.query
                .mockRejectedValueOnce(new Error('duplicate key value violates unique constraint'));

            // Act & Assert
            await expect(service.create(createDto))
                .rejects
                .toThrow(ValidationError);
        });

        it('should validate required fields', async () => {
            // Arrange
            const invalidData = { username: 'test' }; // Missing required fields
            
            // Act & Assert
            await expect(() => new CreateUserDto(invalidData))
                .toThrow(ValidationError);
        });
    });

    describe('update', () => {
        it('should update a user successfully', async () => {
            // Arrange
            const updateDto = new UpdateUserDto({
                username: 'newusername'
            });

            const mockUpdatedUser = {
                ...mockCreatedUser,
                username: 'newusername'
            };

            mockPool.query
                .mockResolvedValueOnce({ rows: [mockCreatedUser] }) // SELECT para verificar existência
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPDATE
                .mockResolvedValueOnce({ rows: [mockUpdatedUser] }); // SELECT após update

            // Act
            const result = await service.update(1, updateDto);

            // Assert
            expect(result).toBeDefined();
            expect(result.username).toBe(updateDto.username);
            expect(mockPool.query).toHaveBeenCalledTimes(3);
            
            // Verify query parameters
            const updateQuery = mockPool.query.mock.calls[1][0];
            expect(updateQuery.text).toContain('UPDATE users');
            expect(updateQuery.values).toContain(updateDto.username);
        });

        it('should throw error when user not found', async () => {
            // Arrange
            const updateDto = new UpdateUserDto({
                username: 'newusername'
            });

            mockPool.query
                .mockResolvedValueOnce({ rows: [] }); // No user found

            // Act & Assert
            await expect(service.update(999, updateDto))
                .rejects
                .toThrow(ValidationError);
        });
    });

    describe('refreshToken', () => {
        it('should refresh token successfully', async () => {
            // Arrange
            const mockRefreshToken = 'validrefreshtoken';
            const mockUserId = 1;
            const mockUserWithToken = {
                ...mockCreatedUser,
                refresh_token: mockRefreshToken
            };

            jest.spyOn(jwt, 'verify').mockReturnValue({ userId: mockUserId });
            jest.spyOn(jwt, 'sign')
                .mockReturnValueOnce('newaccesstoken')
                .mockReturnValueOnce('newrefreshtoken');

            mockPool.query
                .mockResolvedValueOnce({ rows: [mockUserWithToken] }) // SELECT para verificar existência
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // UPDATE refresh token
                .mockResolvedValueOnce({ rows: [mockCreatedUser] }); // SELECT após update

            // Act
            const result = await service.refreshToken(mockRefreshToken);

            // Assert
            expect(result).toEqual({
                accessToken: 'newaccesstoken',
                refreshToken: 'newrefreshtoken',
                expiresIn: process.env.JWT_EXPIRATION
            });
            expect(mockPool.query).toHaveBeenCalledTimes(3);
            
            // Verify token update in database
            const updateQuery = mockPool.query.mock.calls[1][0];
            expect(updateQuery.text).toContain('UPDATE users');
            expect(updateQuery.values).toContain('newrefreshtoken');
        });

        it('should fail with invalid refresh token', async () => {
            // Arrange
            const mockRefreshToken = 'invalidtoken';

            jest.spyOn(jwt, 'verify').mockImplementation(() => {
                throw new jwt.JsonWebTokenError('invalid token');
            });

            // Act & Assert
            await expect(service.refreshToken(mockRefreshToken))
                .rejects
                .toThrow('invalid token');
        });

        it('should fail when user not found', async () => {
            // Arrange
            const mockRefreshToken = 'validrefreshtoken';
            const mockUserId = 999;

            jest.spyOn(jwt, 'verify').mockReturnValue({ userId: mockUserId });
            mockPool.query
                .mockResolvedValueOnce({ rows: [] }); // No user found

            // Act & Assert
            await expect(service.refreshToken(mockRefreshToken))
                .rejects
                .toThrow(ValidationError);
        });
    });

    describe('findById', () => {
        it('should find user by id', async () => {
            // Arrange
            mockPool.query
                .mockResolvedValueOnce({ rows: [mockCreatedUser] });

            // Act
            const result = await service.findById(1);

            // Assert
            expect(result).toBeDefined();
            expect(result.id).toBe(1);
            expect(result.password).toBeUndefined();
            
            // Verify query
            const query = mockPool.query.mock.calls[0][0];
            expect(query.text).toContain('SELECT * FROM users WHERE id = $1');
            expect(query.values).toContain(1);
        });

        it('should return null when user not found', async () => {
            // Arrange
            mockPool.query
                .mockResolvedValueOnce({ rows: [] });

            // Act
            const result = await service.findById(999);

            // Assert
            expect(result).toBeNull();
        });
    });
});
