# Guia de Implementação de Módulos

Este documento define as regras e padrões para implementação de módulos no Finance API.

## Estrutura de Módulos

Cada funcionalidade deve ser um módulo independente seguindo esta estrutura:

```
/modules/[nome-do-modulo]/
  ├── interfaces/           # Contratos e tipos
  │   ├── IService.js      # Interface do serviço
  │   └── IRepository.js   # Interface do repositório
  ├── dto/                 # Objetos de transferência de dados
  │   └── module.dto.js    # DTOs para request/response
  ├── schemas/             # Schemas de validação
  │   └── module.schema.js # Validações usando Joi
  ├── __tests__/          # Testes unitários e de integração
  ├── module.routes.js     # Definição de rotas
  ├── module.controller.js # Controlador
  ├── module.service.js    # Serviço com lógica de negócio
  └── module.repository.js # Acesso a dados (Repository Pattern)
```

## Padrões de Implementação

### 1. Repository Pattern
- Responsável pelo acesso ao banco de dados
- Herda da interface IRepository
- Usa transações quando necessário
- Exemplo:
```javascript
class UserRepository extends IUserRepository {
    constructor() {
        super();
        this.pool = systemDatabase.pool;
    }

    async create(data) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(
                'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
                [data.name, data.email]
            );
            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
```

### 2. Service Layer
- Implementa a lógica de negócio
- Usa o repository para acesso a dados
- Não conhece detalhes do HTTP
```javascript
class UserService extends IUserService {
    constructor(repository) {
        super();
        this.repository = repository;
    }

    async createUser(data) {
        // Validações e regras de negócio
        return this.repository.create(data);
    }
}
```

### 3. Controller
- Lida com requisições HTTP
- Usa DTOs para validação
- Chama o service apropriado
```javascript
class UserController {
    constructor(service) {
        this.service = service;
    }

    async create(req, res) {
        try {
            const dto = new UserDTO(req.body);
            const user = await this.service.createUser(dto);
            res.status(201).json(user);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
```

### 4. Rotas
```javascript
const router = express.Router();
const controller = new UserController(service);

router.post('/', 
    validateRequest(schema.create),
    controller.create.bind(controller)
);
```

### 5. DTOs
```javascript
class UserDTO {
    constructor(data) {
        this.name = data.name;
        this.email = data.email?.toLowerCase();
    }

    validate() {
        if (!this.name) throw new Error('Nome é obrigatório');
        if (!this.email) throw new Error('Email é obrigatório');
    }
}
```

### 6. Schemas (Joi)
```javascript
const schema = {
    create: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
    })
};
```

## Tratamento de Erros

- Usar classes de erro específicas
- Logar erros com contexto
```javascript
try {
    await operation();
} catch (error) {
    logger.error('Operação falhou', { error });
    throw new AppError('Mensagem amigável', 400);
}
```

## Logging

- Usar em operações importantes
- Incluir contexto relevante
```javascript
logger.info('Usuário criado', { 
    userId: user.id,
    action: 'create'
});
```

## Testes

### 1. Testes Unitários
```javascript
describe('UserService', () => {
    it('should create user', async () => {
        const repository = new UserRepository();
        const service = new UserService(repository);
        const user = await service.createUser(userData);
        expect(user).toBeDefined();
    });
});
```

### 2. Testes de Integração
```javascript
describe('UserController', () => {
    it('should create user via API', async () => {
        const response = await request(app)
            .post('/users')
            .send(userData);
        expect(response.status).toBe(201);
    });
});
