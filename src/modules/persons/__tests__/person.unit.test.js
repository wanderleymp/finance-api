const PersonRepository = require('../person.repository');
const PersonService = require('../person.service');
const PersonValidator = require('../validators/person.validator');

describe('Person Unit Tests', () => {
    let mockPool;
    let personRepository;
    let personService;

    beforeEach(() => {
        mockPool = {
            query: jest.fn()
        };

        personRepository = new PersonRepository();
        personRepository.pool = mockPool;

        personService = new PersonService({
            personRepository,
                get: jest.fn(),
                set: jest.fn(),
                delete: jest.fn()
            }
        });
    });

    describe('PersonRepository', () => {
        it('deve criar uma pessoa', async () => {
            const mockPerson = { 
                id: 1, 
                name: 'Pessoa Teste', 
                document: '12345678901' 
            };

            mockPool.query.mockResolvedValue({ rows: [mockPerson] });

            const result = await personRepository.create(mockPerson);
            
            expect(result).toEqual(mockPerson);
            expect(mockPool.query).toHaveBeenCalled();
        });

        it('deve atualizar uma pessoa', async () => {
            const mockPerson = { 
                id: 1, 
                name: 'Pessoa Atualizada' 
            };

            mockPool.query.mockResolvedValue({ rows: [mockPerson] });

            const result = await personRepository.update(1, mockPerson);
            
            expect(result).toEqual(mockPerson);
            expect(mockPool.query).toHaveBeenCalled();
        });

        it('deve buscar pessoa por documento', async () => {
            const mockPerson = { 
                id: 1, 
                name: 'Pessoa Teste', 
                document: '12345678901' 
            };

            mockPool.query.mockResolvedValue({ rows: [mockPerson] });

            const result = await personRepository.findByDocument('12345678901');
            
            expect(result).toEqual(mockPerson);
            expect(mockPool.query).toHaveBeenCalled();
        });
    });

    describe('PersonService', () => {
        it('deve criar uma pessoa', async () => {
            const mockPerson = { 
                name: 'Pessoa Teste', 
                document: '12345678901',
                birth_date: '1990-01-01'
            };

            const mockCreatedPerson = { 
                ...mockPerson, 
                id: 1 
            };

            personRepository.create = jest.fn().mockResolvedValue(mockCreatedPerson);

            const result = await personService.create(mockPerson);
            
            expect(result).toEqual(mockCreatedPerson);
            expect(personRepository.create).toHaveBeenCalledWith(mockPerson);
        });

        it('deve atualizar uma pessoa', async () => {
            const mockPerson = { 
                name: 'Pessoa Atualizada' 
            };

            const mockUpdatedPerson = { 
                id: 1, 
                ...mockPerson 
            };

            personRepository.update = jest.fn().mockResolvedValue(mockUpdatedPerson);

            const result = await personService.update(1, mockPerson);
            
            expect(result).toEqual(mockUpdatedPerson);
            expect(personRepository.update).toHaveBeenCalledWith(1, mockPerson);
        });
    });

    describe('PersonValidator', () => {
        it('deve validar documento (CPF) corretamente', () => {
            // CPF válidos
            expect(PersonValidator.validateDocument('12345678901')).toBe(true);
            expect(PersonValidator.validateDocument('111.444.777-35')).toBe(true);

            // CPF inválidos
            expect(PersonValidator.validateDocument('00000000000')).toBe(false);
            expect(PersonValidator.validateDocument('12345678900')).toBe(false);
        });

        it('deve validar data de nascimento corretamente', () => {
            // Datas válidas
            expect(PersonValidator.validateBirthDate('1990-01-01')).toBe(true);
            expect(PersonValidator.validateBirthDate('2000-12-31')).toBe(true);

            // Datas inválidas
            expect(PersonValidator.validateBirthDate('2025-01-01')).toBe(false);
            expect(PersonValidator.validateBirthDate('1800-01-01')).toBe(false);
            expect(PersonValidator.validateBirthDate('invalid-date')).toBe(false);
        });
    });
});
