const ItemService = require('../item.service');
const ItemRepository = require('../item.repository');
const CreateItemDTO = require('../dto/create-item.dto');
const UpdateItemDTO = require('../dto/update-item.dto');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

// Mock do Redis
jest.mock('../../../config/redis', () => ({
    redisClient: {
        get: jest.fn(),
        setex: jest.fn(),
        del: jest.fn(),
        keys: jest.fn()
    }
}));

describe('ItemService', () => {
    let service;
    let mockRepository;

    beforeEach(() => {
        mockRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        };
        service = new ItemService(mockRepository);
    });

    describe('findAll', () => {
        it('deve retornar lista de items paginada', async () => {
            const mockItems = {
                data: [
                    { id: 1, name: 'Item 1', price: 100 },
                    { id: 2, name: 'Item 2', price: 200 }
                ],
                total: 2,
                page: 1,
                totalPages: 1
            };

            mockRepository.findAll.mockResolvedValue(mockItems);

            const result = await service.findAll({}, 1, 10);

            expect(result.data).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(mockRepository.findAll).toHaveBeenCalledWith({}, 1, 10);
        });
    });

    describe('findById', () => {
        it('deve retornar item quando encontrado', async () => {
            const mockItem = { id: 1, name: 'Item 1', price: 100 };
            mockRepository.findById.mockResolvedValue(mockItem);

            const result = await service.findById(1);

            expect(result).toBeDefined();
            expect(result.id).toBe(1);
            expect(mockRepository.findById).toHaveBeenCalledWith(1);
        });

        it('deve lançar NotFoundError quando item não encontrado', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.findById(1)).rejects.toThrow(NotFoundError);
        });
    });

    describe('create', () => {
        it('deve criar item com dados válidos', async () => {
            const itemData = { name: 'Novo Item', price: 100 };
            const mockCreatedItem = { id: 1, ...itemData };
            mockRepository.create.mockResolvedValue(mockCreatedItem);

            const result = await service.create(itemData);

            expect(result).toBeDefined();
            expect(result.name).toBe(itemData.name);
            expect(mockRepository.create).toHaveBeenCalled();
        });

        it('deve lançar ValidationError com dados inválidos', async () => {
            const invalidData = { name: 'a', price: -1 };

            await expect(service.create(invalidData)).rejects.toThrow(ValidationError);
        });
    });

    describe('update', () => {
        it('deve atualizar item existente', async () => {
            const itemData = { name: 'Item Atualizado' };
            const mockItem = { id: 1, name: 'Item Original', price: 100 };
            const mockUpdatedItem = { ...mockItem, ...itemData };

            mockRepository.findById.mockResolvedValue(mockItem);
            mockRepository.update.mockResolvedValue(mockUpdatedItem);

            const result = await service.update(1, itemData);

            expect(result).toBeDefined();
            expect(result.name).toBe(itemData.name);
            expect(mockRepository.update).toHaveBeenCalled();
        });

        it('deve lançar NotFoundError ao atualizar item inexistente', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.update(1, { name: 'Test' })).rejects.toThrow(NotFoundError);
        });
    });

    describe('delete', () => {
        it('deve deletar item existente', async () => {
            const mockItem = { id: 1, name: 'Item', price: 100 };
            mockRepository.findById.mockResolvedValue(mockItem);
            mockRepository.delete.mockResolvedValue(mockItem);

            const result = await service.delete(1);

            expect(result).toBe(true);
            expect(mockRepository.delete).toHaveBeenCalledWith(1);
        });

        it('deve lançar NotFoundError ao deletar item inexistente', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.delete(1)).rejects.toThrow(NotFoundError);
        });
    });
});
