# CRUD Implementation Guidelines

## Ambiente e Configurações

### Dependências Principais
- Node.js 18+
- Express.js
- PostgreSQL
- Redis
- Joi (Validação)
- Winston (Logging)
- Jest (Testes)

### Padrões de Implementação

#### Estrutura de Módulos
```
src/modules/[module_name]/
├── dto/
│   ├── create-[module].dto.js
│   ├── update-[module].dto.js
│   └── [module]-response.dto.js
├── interfaces/
│   └── [module]-repository.interface.js
├── schemas/
│   └── [module].schema.js
├── validators/
│   └── [module].validator.js
├── [module].module.js
├── [module].repository.js
├── [module].service.js
├── [module].controller.js
└── [module].routes.js
```

#### Princípios
1. Separação de Responsabilidades
2. Injeção de Dependências
3. Tratamento Consistente de Erros
4. Logging Detalhado
5. Validação Rigorosa de Entrada
6. Suporte a Cache Distribuído

#### Configurações de Ambiente
- Variáveis de ambiente em `.env`
- Configurações de banco separadas
- Configurações de cache centralizadas

#### Tratamento de Erros
- Classe de erro personalizada
- Logs detalhados
- Respostas padronizadas

#### Validação
- Joi para validação de schemas
- Validadores específicos por módulo
- DTOs para transferência de dados

#### Testes
- Cobertura mínima de 80%
- Testes unitários e de integração
- Mock de dependências externas

#### Padrão de Rotas

### Estrutura de Rotas
```javascript
module.exports = (controller) => {
    const router = express.Router();

    // Middleware de autenticação
    router.use(authMiddleware);

    // Padrão de definição de rotas
    router.get('/', 
        (req, res) => controller.findAll(req, res)
    );

    // Outros métodos seguem o mesmo padrão
    router.get('/:id', 
        (req, res) => controller.findById(req, res)
    );

    return router;
};
```

### Características
- Rotas recebem o controller como parâmetro
- Cada rota usa arrow function para chamar método do controller
- Middleware de autenticação aplicado globalmente
- Métodos do controller recebem `req` e `res` diretamente

## Boas Práticas

1. Evite lógica de negócio no controller
2. Use serviços para regras de negócio
3. Repositórios apenas para acesso a dados
4. Cache para operações frequentes
5. Validação na entrada de dados
