# Guia de Desenvolvimento - Finance API

## Índice
1. [Estrutura do Projeto](#estrutura-do-projeto)
2. [Criando Novos Módulos](#criando-novos-módulos)
3. [Padrões de Código](#padrões-de-código)
4. [Testes](#testes)
5. [Documentação](#documentação)
6. [Banco de Dados](#banco-de-dados)
7. [Segurança](#segurança)

## Estrutura do Projeto

```
finance-api/
├── src/
│   ├── modules/           # Módulos da aplicação
│   ├── config/           # Configurações
│   ├── middlewares/      # Middlewares Express
│   ├── utils/            # Utilitários
│   ├── app.js           # Configuração do Express
│   └── server.js        # Entrada da aplicação
├── scripts/             # Scripts de utilidade
└── docs/               # Documentação
    ├── DEVELOPMENT_GUIDE.md    # Este guia
    ├── crud-test-implementation.md  # Guia de implementação de testes
    └── api/            # Documentação da API
```

## Criando Novos Módulos

### Usando o Script de Geração

```bash
node scripts/create-module.js NomeDoModulo
```

Exemplo:
```bash
node scripts/create-module.js Product
```

### Estrutura Gerada
```
modules/product/
├── interfaces/
│   ├── IProductService.js
│   └── IProductRepository.js
├── dto/
│   ├── create-product.dto.js
│   ├── update-product.dto.js
│   └── product-response.dto.js
├── validators/
│   └── product.validator.js
├── schemas/
│   └── product.schema.js
├── __tests__/
│   ├── product.unit.test.js
│   ├── product.service.test.js
│   └── product.integration.test.js
├── product.controller.js
├── product.service.js
├── product.repository.js
└── product.routes.js
```

## Padrões de Código

### Nomenclatura
- **Arquivos**: kebab-case (ex: `create-user.dto.js`)
- **Classes**: PascalCase (ex: `UserService`)
- **Métodos/Funções**: camelCase (ex: `findById`)
- **Variáveis**: camelCase (ex: `userId`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `MAX_CONNECTIONS`)

### Estrutura de Classes
- Usar classes ES6
- Implementar interfaces quando aplicável
- Métodos públicos primeiro, privados depois
- Documentar métodos com JSDoc

## Testes

### Guia de Implementação
Consulte o guia completo em [crud-test-implementation.md](./crud-test-implementation.md)

### Estrutura de Testes
```
__tests__/
├── module.unit.test.js      # Testes unitários
├── module.service.test.js   # Testes de serviço
└── module.integration.test.js # Testes de integração
```

### Pool de Banco para Testes
- Usar mock pool de `src/config/test-database.js`
- Nunca conectar diretamente ao banco em testes
- Usar queries parametrizadas

### Padrões de Teste
```javascript
// Exemplo de teste com mock pool
const { mockPool, clearPoolMocks } = require('../../../config/test-database');

jest.mock('../../../config/database', () => ({
    systemDatabase: mockPool
}));

describe('ModuleTest', () => {
    beforeEach(() => {
        clearPoolMocks();
    });

    it('should do something', async () => {
        // Arrange
        mockPool.query.mockResolvedValueOnce({ rows: [] });

        // Act
        const result = await method();

        // Assert
        expect(mockPool.query).toHaveBeenCalledTimes(1);
    });
});
```

### Cobertura Mínima
- Unitários: 80%
- Integração: 60%
- Total: 75%

## Documentação

### Código
- Usar JSDoc para documentar classes e métodos
- Incluir exemplos de uso quando relevante
- Documentar todos os parâmetros e retornos

### API
- Usar Swagger/OpenAPI
- Documentar todos os endpoints
- Incluir exemplos de request/response
- Documentar códigos de erro

## Banco de Dados

### Queries
- Usar queries parametrizadas
- Evitar SQL injection
- Documentar queries complexas
- Usar transações quando necessário

### Pool de Conexões
- Configurar limites adequados
- Monitorar conexões ativas
- Fechar conexões corretamente

## Segurança

### Autenticação
- Usar JWT para tokens
- Implementar refresh tokens
- Validar todas as entradas
- Sanitizar dados sensíveis

### Proteção de Dados
- Nunca expor senhas ou tokens
- Usar HTTPS em produção
- Implementar rate limiting
- Validar permissões de acesso

## Contribuindo

### Antes de Começar
1. Leia este guia completamente
2. Verifique o [crud-test-implementation.md](./crud-test-implementation.md)
3. Siga os padrões estabelecidos
4. Escreva testes para novo código
5. Documente suas mudanças

### Pull Requests
1. Criar branch feature/fix
2. Seguir padrões de commit
3. Incluir testes
4. Atualizar documentação
5. Solicitar review
