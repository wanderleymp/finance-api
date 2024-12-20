# Guia de Implementação de CRUDs

Este documento define os padrões e regras para implementação de CRUDs na aplicação Finance API.

## 1. Estrutura de Diretórios

```
/src
  /modules
    /{recurso}
      /dto
        create.dto.js    # DTO para criação
        update.dto.js    # DTO para atualização
        response.dto.js  # DTO para respostas
      /interfaces
        I{Recurso}Service.js
        I{Recurso}Repository.js
      /schemas
        create.schema.js   # Schema de validação para criação
        update.schema.js   # Schema de validação para atualização
      {recurso}.routes.js
      {recurso}.controller.js
      {recurso}.service.js
      {recurso}.repository.js
      {recurso}.processor.js  # Se necessário processamento assíncrono
```

## 2. Interfaces

### 2.1 Interface do Serviço
```javascript
interface I{Recurso}Service {
    create(data: CreateDTO): Promise<ResponseDTO>;
    findById(id: number): Promise<ResponseDTO>;
    findAll(filters: FilterDTO): Promise<PaginatedResponse<ResponseDTO>>;
    update(id: number, data: UpdateDTO): Promise<ResponseDTO>;
    delete(id: number): Promise<void>;
}
```

### 2.2 Interface do Repositório
```javascript
interface I{Recurso}Repository {
    create(data: CreateDTO): Promise<Entity>;
    findById(id: number): Promise<Entity | null>;
    findAll(filters: FilterDTO): Promise<PaginatedResult<Entity>>;
    update(id: number, data: Partial<Entity>): Promise<Entity>;
    delete(id: number): Promise<void>;
}
```

## 3. Implementação das Camadas

### 3.1 Rotas
```javascript
const router = express.Router();
const controller = new {Recurso}Controller(container.get('{Recurso}Service'));

router.post('/',
    validateSchema(schemas.create),
    authMiddleware,
    controller.create
);

router.get('/',
    validateSchema(schemas.list, 'query'),
    authMiddleware,
    controller.findAll
);

router.get('/:id',
    validateSchema(schemas.getById, 'params'),
    authMiddleware,
    controller.findById
);

router.put('/:id',
    validateSchema(schemas.update),
    authMiddleware,
    controller.update
);

router.delete('/:id',
    validateSchema(schemas.delete, 'params'),
    authMiddleware,
    controller.delete
);
```

### 3.2 Controller
```javascript
class {Recurso}Controller {
    constructor(private service: I{Recurso}Service) {}

    async create(req: Request, res: Response) {
        try {
            const result = await this.service.create(req.body);
            handleResponse(res, 201, result);
        } catch (error) {
            handleError(res, error);
        }
    }

    async findAll(req: Request, res: Response) {
        try {
            const result = await this.service.findAll(req.query);
            handleResponse(res, 200, result);
        } catch (error) {
            handleError(res, error);
        }
    }

    // ... outros métodos CRUD
}
```

### 3.3 Service
```javascript
class {Recurso}Service implements I{Recurso}Service {
    constructor(
        private repository: I{Recurso}Repository,
        private taskService?: ITaskService
    ) {}

    async create(data: CreateDTO): Promise<ResponseDTO> {
        // 1. Validações de negócio
        await this.validateBusinessRules(data);

        // 2. Persistência
        const entity = await this.repository.create(data);

        // 3. Processamento assíncrono (se necessário)
        if (this.taskService) {
            await this.taskService.enqueue('{RECURSO}_PROCESS', {
                entityId: entity.id
            });
        }

        // 4. Retorno
        return this.toDTO(entity);
    }

    // ... outros métodos CRUD
}
```

### 3.4 Repository
```javascript
class {Recurso}Repository implements I{Recurso}Repository {
    constructor(private db: Database) {}

    async create(data: CreateDTO): Promise<Entity> {
        const result = await this.db.query(
            'INSERT INTO {recursos} (...) VALUES (...) RETURNING *',
            [data.field1, data.field2]
        );
        return result.rows[0];
    }

    // ... outros métodos CRUD
}
```

## 3. Padrão de Rotas

### 3.1 Base URL
Todas as rotas da API devem seguir o padrão:
```
/{recurso}
```
Exemplo: `/boletos`, `/usuarios`, `/pagamentos`

NÃO utilizar prefixos como `/api` ou `/api/v1/`

### 3.2 Endpoints Padrão
- GET    /{recurso}          - Lista recursos com paginação e filtros
- GET    /{recurso}/:id      - Busca recurso por ID
- POST   /{recurso}          - Cria novo recurso
- PUT    /{recurso}/:id      - Atualiza recurso
- DELETE /{recurso}/:id      - Remove recurso

## 4. Validações

### 4.1 Schema de Validação
```javascript
const createSchema = Joi.object({
    field1: Joi.string().required(),
    field2: Joi.number().min(0).required(),
    // ...
});

const updateSchema = createSchema.fork(['field1', 'field2'], (schema) => schema.optional());
```

### 4.2 DTOs
```javascript
class CreateDTO {
    field1: string;
    field2: number;
}

class UpdateDTO extends Partial<CreateDTO> {}

class ResponseDTO {
    id: number;
    field1: string;
    field2: number;
    createdAt: Date;
    updatedAt: Date;
}
```

## 5. Processamento Assíncrono

Se o recurso necessitar de processamento assíncrono:

### 5.1 Processor
```javascript
class {Recurso}Processor {
    constructor(
        private service: I{Recurso}Service,
        private integration?: IIntegrationService
    ) {}

    async process(data: ProcessDTO): Promise<void> {
        try {
            // 1. Processamento
            const result = await this.integration.process(data);

            // 2. Atualização do status
            await this.service.updateStatus(data.id, result.status);
        } catch (error) {
            // 3. Tratamento de erro
            await this.service.handleProcessingError(data.id, error);
            throw error;
        }
    }
}
```

## 6. Boas Práticas

1. **Injeção de Dependências**
   - Sempre usar construtor injection
   - Configurar no container de DI
   - Usar interfaces para acoplamento fraco

2. **Tratamento de Erros**
   - Usar classes de erro específicas
   - Centralizar tratamento no controller
   - Logar erros com contexto

3. **Logging**
   - Usar logger estruturado
   - Incluir IDs de correlação
   - Logar início e fim de operações importantes

4. **Transações**
   - Usar middleware de transação quando necessário
   - Garantir atomicidade em operações complexas
   - Implementar compensação em falhas

5. **Segurança**
   - Validar inputs em todas as rotas
   - Implementar controle de acesso
   - Sanitizar dados sensíveis nos logs

## 7. Checklist de Implementação

- [ ] Criar estrutura de diretórios
- [ ] Definir interfaces
- [ ] Implementar DTOs e schemas
- [ ] Criar rotas com validações
- [ ] Implementar controller com tratamento de erros
- [ ] Implementar service com regras de negócio
- [ ] Implementar repository com queries otimizadas
- [ ] Adicionar logs estruturados
- [ ] Configurar injeção de dependências
- [ ] Implementar testes unitários
- [ ] Documentar endpoints (Swagger)
