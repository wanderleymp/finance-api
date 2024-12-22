# Padrão de Implementação de Testes CRUD

## Estratégias Gerais de Teste

### 1. Mocking
- Sempre use mocks para dependências externas
- Utilize `jest.fn()` para criar funções mock
- Use `jest.mock()` para substituir módulos inteiros

### 2. Estrutura de Testes
```javascript
const ModuleService = require('../module.service');
const { ValidationError } = require('../../utils/errors');

// Mocks de Dependências
const mockRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
};

const mockCacheService = {
    generateKey: jest.fn(),
    getOrSet: jest.fn(),
    delete: jest.fn()
};

jest.mock('../module.repository', () => {
    return jest.fn().mockImplementation(() => mockRepository);
});

jest.mock('../../services/cache.service', () => {
    return jest.fn().mockImplementation(() => mockCacheService);
});

describe('ModuleService', () => {
    let moduleService;

    beforeEach(() => {
        jest.clearAllMocks();
        moduleService = new ModuleService();
    });

    // Testes de Criação
    describe('create', () => {
        const mockData = { /* dados de exemplo */ };

        it('deve criar com sucesso', async () => {
            const mockCreatedItem = { id: 1, ...mockData };
            mockRepository.create.mockResolvedValue(mockCreatedItem);

            const result = await moduleService.create(mockData);

            expect(result).toEqual(mockCreatedItem);
            expect(mockRepository.create).toHaveBeenCalledWith(mockData);
        });

        it('deve lançar erro de validação', async () => {
            const invalidData = { /* dados inválidos */ };

            await expect(
                moduleService.create(invalidData)
            ).rejects.toThrow(ValidationError);
        });
    });

    // Testes de Busca
    describe('findById', () => {
        it('deve encontrar item por ID', async () => {
            const mockItem = { id: 1, /* outros campos */ };
            
            mockCacheService.generateKey.mockReturnValue('module:detail:1');
            mockCacheService.getOrSet.mockImplementation((key, fn) => fn());
            mockRepository.findById.mockResolvedValue(mockItem);

            const result = await moduleService.findById(1);

            expect(result).toEqual(mockItem);
            expect(mockRepository.findById).toHaveBeenCalledWith(1);
        });

        it('deve lançar erro quando não encontrado', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(
                moduleService.findById(999)
            ).rejects.toThrow(ValidationError);
        });
    });

    // Testes de Atualização
    describe('update', () => {
        it('deve atualizar com sucesso', async () => {
            const updateData = { /* campos para atualizar */ };
            const mockUpdatedItem = { id: 1, ...updateData };

            mockRepository.update.mockResolvedValue(mockUpdatedItem);

            const result = await moduleService.update(1, updateData);

            expect(result).toEqual(mockUpdatedItem);
            expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
        });

        it('deve lançar erro de validação', async () => {
            const invalidUpdateData = { /* dados inválidos */ };

            await expect(
                moduleService.update(1, invalidUpdateData)
            ).rejects.toThrow(ValidationError);
        });
    });

    // Testes de Deleção
    describe('delete', () => {
        it('deve deletar com sucesso', async () => {
            const mockDeletedItem = { id: 1 };
            mockRepository.delete.mockResolvedValue(mockDeletedItem);

            const result = await moduleService.delete(1);

            expect(result).toEqual(mockDeletedItem);
            expect(mockRepository.delete).toHaveBeenCalledWith(1);
        });

        it('deve lançar erro ao deletar item não encontrado', async () => {
            mockRepository.delete.mockResolvedValue(null);

            await expect(
                moduleService.delete(999)
            ).rejects.toThrow(ValidationError);
        });
    });
});
```

## Princípios Importantes
1. **Isolamento**: Cada teste deve ser independente
2. **Cobertura**: Teste casos de sucesso e erro
3. **Mocking**: Simule dependências externas
4. **Validação**: Verifique comportamentos esperados
5. **Erros**: Teste cenários de erro e validação

## Boas Práticas
- Use `jest.clearAllMocks()` no `beforeEach()`
- Crie mocks realistas
- Teste todos os métodos CRUD
- Verifique tratamento de erros
- Valide chamadas de métodos e retornos

## Considerações de Cache
- Teste geração de chaves de cache
- Verifique comportamento do `getOrSet`
- Valide invalidação de cache

## Tratamento de Erros
- Use `ValidationError` para erros de negócio
- Teste lançamento de exceções
- Verifique mensagens de erro
