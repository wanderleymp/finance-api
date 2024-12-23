# Padrão de Implementação de Testes CRUD

## Estratégias Gerais de Teste

### 1. Estrutura de Diretórios
```
src/
  modules/
    module-name/
      __tests__/
        module.unit.test.js     # Testes unitários
        module.service.test.js  # Testes de serviço
        module.integration.test.js # Testes de integração
```

### 2. Pool de Banco de Dados para Testes
- Usar o mock pool configurado em `src/config/test-database.js`
- Nunca conectar diretamente ao banco de dados em testes unitários
- Usar queries parametrizadas para prevenir SQL injection

```javascript
// Exemplo de uso do pool mockado
const { mockPool, clearPoolMocks } = require('../../../config/test-database');

jest.mock('../../../config/database', () => ({
    systemDatabase: mockPool
}));

beforeEach(() => {
    clearPoolMocks();
});
```

### 3. Mocking
- Sempre use mocks para dependências externas
- Utilize `jest.fn()` para criar funções mock
- Use `jest.mock()` para substituir módulos inteiros
- Mock do Redis para testes de cache/tokens
- Mock do logger para evitar logs em testes

### 4. DTOs nos Testes
- Usar DTOs para validar entrada e saída de dados
- Testar conversões de DTO
- Verificar remoção de campos sensíveis

### 5. Estrutura de Testes
```javascript
describe('ModuleName', () => {
    let service;
    let repository;

    beforeEach(() => {
        // Setup
    });

    describe('método', () => {
        it('deve fazer algo específico', async () => {
            // Arrange
            const mockData = {};
            mockPool.query
                .mockResolvedValueOnce({ rows: [] })  // Primeira query
                .mockResolvedValueOnce({ rows: [] }); // Segunda query

            // Act
            const result = await service.method(mockData);

            // Assert
            expect(result).toBeDefined();
            expect(mockPool.query).toHaveBeenCalledTimes(2);
        });
    });
});
```

### 6. Padrões de Query
```javascript
// No Repository
const query = {
    text: 'SELECT * FROM table WHERE id = $1',
    values: [id]
};
const { rows } = await this.db.query(query);

// No Teste
mockPool.query
    .mockResolvedValueOnce({ rows: [{ id: 1 }] });
```

### 7. Boas Práticas
- Sempre limpe os mocks entre testes (clearPoolMocks)
- Use dados realistas nos mocks
- Teste casos de erro
- Verifique número de chamadas às queries
- Teste validações de entrada
- Teste transformações de dados
- Mantenha testes independentes
- Use nomes descritivos para os testes

### 8. Testes de Integração
- Usar supertest para testes de API
- Configurar banco de teste separado
- Limpar dados entre testes
- Testar fluxos completos

### 9. Cobertura de Testes
- Manter cobertura mínima de 80%
- Testar todos os caminhos possíveis
- Incluir casos de erro
- Testar validações
- Testar transformações

### 10. Segurança
- Testar validações de entrada
- Verificar sanitização de dados
- Testar autenticação/autorização
- Verificar proteção contra SQL injection
- Testar rate limiting

## Exemplos

### Teste de Serviço com Pool Mock
```javascript
const UserService = require('../user.service');
const { mockPool, clearPoolMocks } = require('../../../config/test-database');

jest.mock('../../../config/database', () => ({
    systemDatabase: mockPool
}));

describe('UserService', () => {
    beforeEach(() => {
        clearPoolMocks();
    });

    it('should create user', async () => {
        mockPool.query
            .mockResolvedValueOnce({ rows: [{ id: 1 }] })      // INSERT
            .mockResolvedValueOnce({ rows: [{ id: 1, ... }] }); // SELECT

        const result = await service.create(mockData);
        expect(mockPool.query).toHaveBeenCalledTimes(2);
    });
});
```

### Teste de Repository com Queries Parametrizadas
```javascript
class UserRepository {
    async findById(id) {
        const query = {
            text: 'SELECT * FROM users WHERE id = $1',
            values: [id]
        };
        const { rows } = await this.db.query(query);
        return rows[0];
    }
}
```

## Roadmap de Testes

### Fase 1: Configuração
- [x] Configurar Jest
- [x] Configurar pool de teste
- [x] Criar helpers de teste
- [x] Definir padrões de mock

### Fase 2: Testes Unitários
- [ ] Implementar testes de DTOs
- [ ] Implementar testes de serviços
- [ ] Implementar testes de repositórios
- [ ] Implementar testes de validadores

### Fase 3: Testes de Integração
- [ ] Configurar ambiente de teste
- [ ] Implementar testes de API
- [ ] Implementar testes de fluxos completos
- [ ] Implementar testes de autenticação

### Fase 4: Testes de Performance
- [ ] Configurar testes de carga
- [ ] Implementar benchmarks
- [ ] Testar limites do sistema
- [ ] Otimizar baseado nos resultados

### Fase 5: Testes de Segurança
- [ ] Implementar testes de penetração
- [ ] Verificar vulnerabilidades comuns
- [ ] Testar proteções de dados
- [ ] Validar conformidade com padrões

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
