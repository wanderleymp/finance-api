# Guia de Implementação de Módulos

Este documento define as regras e padrões para implementação de módulos no Finance API.

## Estrutura de Módulos

Cada funcionalidade deve ser um módulo independente seguindo esta estrutura:

```
/modules/[nome-do-modulo]/
  ├── interfaces/           # Contratos e tipos
  │   ├── IService.js      # Interface do serviço
  │   └── IRepository.js   # Interface do repositório (se aplicável)
  ├── dto/                 # Objetos de transferência de dados
  │   ├── request.dto.js   # DTOs para requisições
  │   └── response.dto.js  # DTOs para respostas
  ├── models/              # Modelos de dados
  │   └── model.js        # Definição do modelo
  ├── schemas/            # Schemas de validação
  │   └── schema.js      # Validações usando Joi
  ├── routes.js          # Definição de rotas
  ├── controller.js      # Controlador
  ├── service.js         # Serviço com lógica de negócio
  └── repository.js      # Acesso a dados (se aplicável)
```

## Regras de Implementação

### 1. Rotas (routes.js)
- Não usar prefixo `/api`
- Usar express.Router()
- Incluir validação de requisição
- Exemplo:
```javascript
const express = require('express');
const controller = require('./controller');
const { validateRequest } = require('../../middlewares/requestValidator');
const schema = require('./schemas/schema');

const router = express.Router();

router.get('/', validateRequest(schema.list), controller.list);
router.post('/', validateRequest(schema.create), controller.create);

module.exports = router;
```

### 2. Controller
- Responsável apenas por:
  - Receber requisições
  - Validar dados
  - Chamar serviços
  - Formatar respostas
- Usar try/catch para tratamento de erros
- Exemplo:
```javascript
class Controller {
    async create(req, res) {
        try {
            const result = await service.create(req.body);
            res.status(201).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            logger.error('Error in create', { error });
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }
}
```

### 3. Service
- Implementar interface definida em IService
- Conter toda lógica de negócio
- Não acessar req/res
- Usar injeção de dependências
- Exemplo:
```javascript
class Service extends IService {
    constructor(repository) {
        super();
        this.repository = repository;
    }

    async create(data) {
        // Validações e regras de negócio
        return this.repository.create(data);
    }
}
```

### 4. Interface
- Definir contrato do serviço
- Documentar métodos com JSDoc
- Exemplo:
```javascript
class IService {
    /**
     * Create new resource
     * @param {Object} data - Resource data
     * @returns {Promise<Object>} Created resource
     */
    async create(data) {}
}
```

### 5. DTOs
- Separar DTOs de request e response
- Usar para validação e transformação
- Exemplo:
```javascript
class RequestDTO {
    constructor(data) {
        this.name = data.name;
        this.email = data.email.toLowerCase();
    }
}
```

### 6. Schemas
- Usar Joi para validação
- Definir mensagens de erro
- Exemplo:
```javascript
const schema = {
    create: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email()
    })
};
```

## Dependências e Imports

### 1. Caminhos de Importação
- Usar caminhos relativos ao módulo
- Para arquivos do módulo: `./arquivo`
- Para arquivos externos: `../../config/arquivo`

### 2. Dependências Comuns
```javascript
// Bibliotecas
const express = require('express');
const Joi = require('joi');

// Middlewares
const logger = require('../../middlewares/logger');
const { validateRequest } = require('../../middlewares/requestValidator');

// Configurações
const { systemDatabase } = require('../../config/database');
```

## Segurança

### 1. Autenticação
- Usar middleware de autenticação quando necessário
- Validar tokens JWT
- Implementar rate limiting

### 2. Validação
- Validar todas as entradas usando Joi
- Sanitizar dados sensíveis
- Usar DTOs para transformação

## Logging

- Usar o logger em todas as operações importantes
- Incluir contexto nos logs
- Exemplo:
```javascript
logger.info('Operação iniciada', { 
    module: 'users',
    action: 'create',
    data: { id, name }
});
```

## Tratamento de Erros

- Usar try/catch em todas as operações assíncronas
- Logar erros com contexto
- Retornar respostas de erro padronizadas
- Exemplo:
```javascript
try {
    // operação
} catch (error) {
    logger.error('Erro na operação', { error });
    throw new AppError('Mensagem amigável', 400);
}
```

## Testes

- Criar testes unitários para services
- Criar testes de integração para controllers
- Usar mocks para dependências externas
- Exemplo:
```javascript
describe('UserService', () => {
    it('should create user', async () => {
        const result = await service.create(mockData);
        expect(result).toHaveProperty('id');
    });
});
```

## Boas Práticas

1. **Separação de Responsabilidades**
   - Controller: Requisições e respostas
   - Service: Lógica de negócio
   - Repository: Acesso a dados

2. **Nomenclatura**
   - Usar nomes descritivos
   - Seguir padrão camelCase
   - Prefixar interfaces com I

3. **Documentação**
   - Documentar interfaces com JSDoc
   - Manter README atualizado
   - Documentar APIs com Swagger

4. **Performance**
   - Usar paginação em listagens
   - Implementar cache quando necessário
   - Otimizar consultas ao banco

5. **Manutenibilidade**
   - Manter módulos pequenos e focados
   - Evitar duplicação de código
   - Seguir princípios SOLID
