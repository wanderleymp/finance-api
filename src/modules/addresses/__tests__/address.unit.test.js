const AddressRepository = require('../address.repository');
const AddressService = require('../address.service');
const AddressValidator = require('../validators/address.validator');

describe('Address Unit Tests', () => {
    let mockPool;
    let addressRepository;
    let addressService;

    beforeEach(() => {
        mockPool = {
            query: jest.fn()
        };

        addressRepository = new AddressRepository();
        addressRepository.pool = mockPool;

        addressService = new AddressService({
            addressRepository,
            cacheService: {
                get: jest.fn(),
                set: jest.fn(),
                delete: jest.fn()
            }
        });
    });

    describe('AddressRepository', () => {
        it('deve criar um endereço', async () => {
            const mockAddress = { 
                id: 1, 
                street: 'Rua Teste', 
                number: '123',
                person_id: 1 
            };

            mockPool.query.mockResolvedValue({ rows: [mockAddress] });

            const result = await addressRepository.create(mockAddress);
            
            expect(result).toEqual(mockAddress);
            expect(mockPool.query).toHaveBeenCalled();
        });

        it('deve atualizar um endereço', async () => {
            const mockAddress = { 
                id: 1, 
                street: 'Rua Atualizada' 
            };

            mockPool.query.mockResolvedValue({ rows: [mockAddress] });

            const result = await addressRepository.update(1, mockAddress);
            
            expect(result).toEqual(mockAddress);
            expect(mockPool.query).toHaveBeenCalled();
        });

        it('deve buscar endereços por pessoa', async () => {
            const mockAddresses = [
                { id: 1, street: 'Rua 1', person_id: 1 },
                { id: 2, street: 'Rua 2', person_id: 1 }
            ];

            mockPool.query.mockResolvedValue({ rows: mockAddresses });

            const result = await addressRepository.findByPersonId(1);
            
            expect(result).toEqual(mockAddresses);
            expect(mockPool.query).toHaveBeenCalled();
        });
    });

    describe('AddressService', () => {
        it('deve criar um endereço', async () => {
            const mockAddress = { 
                street: 'Rua Teste', 
                number: '123',
                person_id: 1,
                city: 'Cidade Teste',
                state: 'SP',
                zip_code: '12345-678'
            };

            const mockCreatedAddress = { 
                ...mockAddress, 
                id: 1 
            };

            addressRepository.create = jest.fn().mockResolvedValue(mockCreatedAddress);

            const result = await addressService.create(mockAddress);
            
            expect(result).toEqual(mockCreatedAddress);
            expect(addressRepository.create).toHaveBeenCalledWith(mockAddress);
        });

        it('deve atualizar um endereço', async () => {
            const mockAddress = { 
                street: 'Rua Atualizada' 
            };

            const mockUpdatedAddress = { 
                id: 1, 
                ...mockAddress 
            };

            addressRepository.update = jest.fn().mockResolvedValue(mockUpdatedAddress);

            const result = await addressService.update(1, mockAddress);
            
            expect(result).toEqual(mockUpdatedAddress);
            expect(addressRepository.update).toHaveBeenCalledWith(1, mockAddress);
        });
    });

    describe('AddressValidator', () => {
        it('deve validar CEP corretamente', () => {
            expect(AddressValidator.validatePostalCode('12345-678')).toBe(true);
            expect(AddressValidator.validatePostalCode('12345678')).toBe(false);
            expect(AddressValidator.validatePostalCode('1234-567')).toBe(false);
        });

        it('deve validar estado corretamente', () => {
            expect(AddressValidator.validateState('SP')).toBe(true);
            expect(AddressValidator.validateState('XX')).toBe(false);
            expect(AddressValidator.validateState('sp')).toBe(false);
        });
    });
});
