const AddressService = require('../address.service');
const AddressRepository = require('../address.repository');
const CacheService = require('../../../services/cacheService');

// Mocks
jest.mock('../address.repository');
jest.mock('../../../services/cacheService');

describe('AddressService', () => {
    let addressService;
    let mockAddressRepository;
    let mockCacheService;

    beforeEach(() => {
        mockAddressRepository = new AddressRepository();
        mockCacheService = {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn()
        };

        addressService = new AddressService({
            addressRepository: mockAddressRepository,
            cacheService: mockCacheService
        });
    });

    describe('findAll', () => {
        it('deve buscar endereços do cache se disponível', async () => {
            const mockCachedResult = { data: [], total: 0 };
            mockCacheService.get.mockResolvedValue(mockCachedResult);

            const result = await addressService.findAll({ person_id: 1 });

            expect(mockCacheService.get).toHaveBeenCalled();
            expect(result).toEqual(mockCachedResult);
        });

        it('deve buscar endereços do repositório se cache vazio', async () => {
            const mockResult = { data: [], total: 0 };
            mockCacheService.get.mockResolvedValue(null);
            mockAddressRepository.findAll.mockResolvedValue(mockResult);

            const result = await addressService.findAll({ person_id: 1 });

            expect(mockAddressRepository.findAll).toHaveBeenCalled();
            expect(mockCacheService.set).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('deve retornar endereço do cache', async () => {
            const mockAddress = { id: 1, street: 'Rua Teste' };
            mockCacheService.get.mockResolvedValue(mockAddress);

            const result = await addressService.findById(1);

            expect(result).toEqual(mockAddress);
        });

        it('deve buscar endereço do repositório se cache vazio', async () => {
            const mockAddress = { id: 1, street: 'Rua Teste' };
            mockCacheService.get.mockResolvedValue(null);
            mockAddressRepository.findById.mockResolvedValue(mockAddress);

            const result = await addressService.findById(1);

            expect(result).toEqual(mockAddress);
            expect(mockCacheService.set).toHaveBeenCalled();
        });
    });

    describe('create', () => {
        it('deve criar endereço com validações', async () => {
            const mockAddressData = {
                person_id: 1,
                street: 'Rua Teste',
                number: '100',
                neighborhood: 'Centro',
                city: 'São Paulo',
                state: 'SP',
                postal_code: '01000-000'
            };

            const mockCreatedAddress = { 
                id: 1, 
                ...mockAddressData,
                is_main: true
            };

            mockAddressRepository.findMainAddressByPersonId.mockResolvedValue(null);
            mockAddressRepository.create.mockResolvedValue(mockCreatedAddress);

            const result = await addressService.create(mockAddressData);

            expect(result).toEqual(mockCreatedAddress);
            expect(mockCacheService.delete).toHaveBeenCalled();
        });

        it('deve lançar erro para dados inválidos', async () => {
            const invalidAddressData = {
                person_id: 1,
                street: '' // Campo obrigatório vazio
            };

            await expect(addressService.create(invalidAddressData)).rejects.toThrow();
        });
    });

    describe('update', () => {
        it('deve atualizar endereço existente', async () => {
            const existingAddress = { 
                id: 1, 
                person_id: 1, 
                street: 'Rua Antiga' 
            };

            const updateData = {
                street: 'Rua Nova',
                number: '200'
            };

            const updatedAddress = { 
                id: 1, 
                ...existingAddress, 
                ...updateData 
            };

            mockAddressRepository.findById.mockResolvedValue(existingAddress);
            mockAddressRepository.update.mockResolvedValue(updatedAddress);

            const result = await addressService.update(1, updateData);

            expect(result).toEqual(updatedAddress);
            expect(mockCacheService.delete).toHaveBeenCalledTimes(3);
        });

        it('deve lançar erro para endereço não encontrado', async () => {
            mockAddressRepository.findById.mockResolvedValue(null);

            await expect(addressService.update(999, {})).rejects.toThrow('Endereço não encontrado');
        });
    });

    describe('delete', () => {
        it('deve deletar endereço que não é principal', async () => {
            const existingAddress = { 
                id: 1, 
                person_id: 1, 
                street: 'Rua Teste',
                is_main: false 
            };

            const deletedAddress = { ...existingAddress };

            mockAddressRepository.findById.mockResolvedValue(existingAddress);
            mockAddressRepository.delete.mockResolvedValue(deletedAddress);

            const result = await addressService.delete(1);

            expect(result).toEqual(deletedAddress);
            expect(mockCacheService.delete).toHaveBeenCalledTimes(3);
        });

        it('deve lançar erro ao tentar deletar endereço principal', async () => {
            const mainAddress = { 
                id: 1, 
                person_id: 1, 
                street: 'Rua Principal',
                is_main: true 
            };

            mockAddressRepository.findById.mockResolvedValue(mainAddress);

            await expect(addressService.delete(1)).rejects.toThrow('Não é possível deletar o endereço principal');
        });
    });
});
