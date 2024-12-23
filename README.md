# Finance API

## Descrição do Projeto
Uma API RESTful para gerenciamento financeiro, desenvolvida com Node.js e PostgreSQL.

## Pré-requisitos
- Node.js (v14 ou superior)
- PostgreSQL
- npm ou yarn

## Instalação

1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/finance-api.git
cd finance-api
```

2. Instale as dependências
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente
Copie o `.env.example` para `.env` e preencha com suas configurações:

```env
# Banco de Dados
SYSTEM_DATABASE_URL=postgresql://usuario:senha@host:5432/AgileDB?ssl=false
DEV_DATABASE_URL=postgresql://usuario:senha@host:5432/dev_history?ssl=false

# Outras configurações
PORT=3000
JWT_SECRET=seu_jwt_secret
```

4. Inicialize o banco de dados
```bash
npm run db:migrate
# ou
yarn db:migrate
```

## Executando a Aplicação
```bash
npm start
# ou
yarn start
```

## Estrutura do Projeto

### Diretórios Principais
- `src/config/`: Configurações da aplicação
- `src/controllers/`: Controladores das rotas
- `src/db/`: Conexão e consultas ao banco de dados
- `src/routes/`: Definição das rotas da API
- `src/middlewares/`: Middlewares de autenticação e validação
- `src/workers/`: Processos assíncronos

### Arquitetura do Banco de Dados

O projeto utiliza uma configuração centralizada para conexões com banco de dados, localizada em `src/config/database.js`. Esta abordagem garante consistência e facilita a manutenção.

#### Características principais:

1. **Conexão Centralizada**
   - Todas as conexões são gerenciadas através do módulo `database.js`
   - Configurações padronizadas de pool de conexões
   - Tratamento uniforme de erros e logging

2. **Pool de Conexões**
   ```javascript
   {
     connectionTimeoutMillis: 5000,
     idleTimeoutMillis: 30000,
     max: 10
   }
   ```

3. **Uso nos Repositórios**
   ```javascript
   const { systemDatabase } = require('../config/database');
   
   // Exemplo de uso
   const result = await systemDatabase.query('SELECT * FROM tabela');
   ```

4. **Bancos de Dados**
   - `AgileDB`: Banco principal do sistema
   - `dev_history`: Banco de desenvolvimento/histórico

5. **Estrutura de Tabelas**

   a. **Persons**
   - Armazena informações básicas de pessoas físicas e jurídicas
   - Suporte a paginação global (page, limit)
   - Campos principais: person_id, full_name, person_type, etc.

   b. **Person Documents**
   - Documentos associados a pessoas (CPF, CNPJ, RG, etc.)
   - Utiliza ENUM para tipos de documentos (document_type_enum)
   - Índice único para person_id + document_type + document_value
   - Campos principais:
     ```sql
     person_document_id: SERIAL PRIMARY KEY
     person_id: INTEGER (FK -> persons)
     document_type: document_type_enum ('CPF', 'CNPJ', 'RG', 'CNH', 'OUTROS')
     document_value: VARCHAR(50)
     ```

   c. **Person Contacts**
   - Associação entre pessoas e contatos
   - Campos principais:
     ```sql
     person_contact_id: SERIAL PRIMARY KEY
     person_id: INTEGER (FK -> persons)
     contact_id: INTEGER (FK -> contacts)
     is_main: BOOLEAN
     active: BOOLEAN
     description: TEXT
     created_at: TIMESTAMP
     updated_at: TIMESTAMP
     ```

6. **Versionamento do Banco**
   - Controle via tabela `migrations`
   - Versão atual: 1.0.0.5
   - Scripts de migração em `src/migrations/system/`

## Estrutura de Rotas

### Princípios de Roteamento

- **Centralização**: Todas as rotas são definidas em `src/routes/index.js`
- **Modularidade**: Rotas específicas são importadas e agrupadas no roteador principal
- **Separação de Responsabilidades**: `app.js` foca em configuração do servidor, não em definição de rotas

### Boas Práticas

- Cada módulo de rotas (`personRoutes.js`, `personCnpjRoutes.js`) define suas próprias rotas
- O arquivo `routes/index.js` consolida todas as rotas da aplicação
- Evitar definição de rotas diretamente no `app.js`

### Exemplo de Roteamento

```javascript
// routes/index.js
router.use('/persons', personRoutes);
router.use('/persons/cnpjs', personCnpjRoutes);
```

### Benefícios

- Código mais organizado e legível
- Facilita manutenção e extensão de rotas
- Melhora a separação de responsabilidades

## Desenvolvimento

Para guias detalhados sobre desenvolvimento, incluindo como criar novos módulos e seguir os padrões do projeto, consulte nosso [Guia de Desenvolvimento](docs/DEVELOPMENT_GUIDE.md).

## Funcionalidades

- Gerenciamento de pessoas
- Consulta de CEP via ViaCEP
  - Rota: `GET /addresses/cep/:cep`
  - Retorna informações detalhadas de endereço
  - Validação de formato de CEP
  - Tratamento de erros e logs

### Rotas Disponíveis

#### Endereços
- `GET /addresses/cep/:cep` - Consulta detalhes de endereço por CEP
  - Exemplo: `GET /addresses/cep/01310930`
  - Retorna: logradouro, complemento, bairro, cidade, estado, código postal e código IBGE

#### Pessoas
- `GET /persons/cnpj/:cnpj` - Consulta detalhes de empresa por CNPJ
  - Exemplo: `GET /persons/cnpj/00.000.000/0001-00`
  - Retorna: razão social, nome fantasia, endereço, telefone, email e situação cadastral

## Endpoints

### Consulta de CEP
- **GET** `/addresses/cep/:cep`
  - Consulta endereço através do CEP utilizando a API ViaCEP
  - Parâmetros:
    - `cep`: CEP no formato 12345-678 ou 12345678
  - Retorno:
    ```json
    {
      "data": {
        "street": "Nome da Rua",
        "complement": "Complemento",
        "neighborhood": "Bairro",
        "city": "Cidade",
        "state": "UF",
        "postal_code": "12345678",
        "ibge": "1234567"
      }
    }
    ```

## Autenticação

### Requisitos de Token
- Todas as rotas sensíveis requerem autenticação via token JWT
- Token deve ser enviado no cabeçalho `Authorization` com o prefixo `Bearer`

### Rotas Protegidas
- `/persons/*`
- `/person-contacts/*`
- `/person-documents/*`
- `/licenses/*`
- `/roadmap/*`

### Exemplo de Requisição Autenticada
```bash
curl -H "Authorization: Bearer SEU_TOKEN_JWT" http://localhost:3000/persons
```

### Obtendo Token
1. Faça login em `/users/login`
2. Receba o token JWT na resposta
3. Use o token em requisições subsequentes

## Login
Para autenticar, envie uma requisição POST para `/users/login` com as credenciais:

```json
{
    "username": "seu_usuario",
    "password": "sua_senha"
}
```

A resposta incluirá um token JWT:

```json
{
    "status": "success",
    "token": "seu_token_jwt"
}
```

### Rotas Protegidas
Para acessar rotas protegidas, inclua o token no cabeçalho de autorização:

```
Authorization: Bearer seu_token_jwt
```

### Exemplo de Rota Protegida
- `GET /users/profile`: Retorna informações do perfil do usuário autenticado

## Recuperação de Senha

O sistema possui um mecanismo completo e seguro de recuperação de senha:

### Endpoints

- `POST /forgot-password`: Solicita recuperação de senha
  ```json
  {
    "email": "usuario@exemplo.com"
  }
  ```

- `POST /reset-password`: Redefine a senha usando token
  ```json
  {
    "token": "token-recebido-por-email",
    "newPassword": "Nova@Senha123"
  }
  ```

- `POST /change-password`: Altera senha (requer autenticação)
  ```json
  {
    "currentPassword": "Senha@Atual123",
    "newPassword": "Nova@Senha123"
  }
  ```

- `GET /password-status`: Verifica status da senha (requer autenticação)

### Política de Senhas

- Mínimo 8 caracteres
- Deve conter:
  - Letra maiúscula
  - Letra minúscula
  - Número
  - Caractere especial
- Não pode reutilizar últimas 5 senhas
- Expira após período configurável

### Configuração

Adicione as seguintes variáveis ao `.env`:

```env
# Email
SMTP_HOST=seu_host_smtp
SMTP_PORT=587
SMTP_USER=seu_usuario_smtp
SMTP_PASS=sua_senha_smtp
SMTP_FROM=seu_email_remetente
BASE_URL=http://localhost:3000

# Senha
SALT_ROUNDS=10
PASSWORD_RESET_EXPIRATION=90
```

### Segurança

- Rate limiting: 3 tentativas por hora por IP
- Tokens seguros e com expiração de 1 hora
- Não revela existência de emails
- Auditoria de todas as operações
- Transações atômicas para consistência

## Endpoints de Licenças

### Regras de Negócio
- Apenas uma licença ativa pode existir por pessoa
- Uma nova licença só pode ser criada se não houver licença ativa para a pessoa

### Rotas de Licenças

#### Criar Licença
- **Método**: POST
- **Endpoint**: `/licenses/`
- **Corpo da Requisição**:
```json
{
  "person_id": 1,
  "license_name": "Nome da Licença",
  "start_date": "2024-12-14",
  "status": "Ativa",
  "timezone": "America/Sao_Paulo",
  "active": true,
  "end_date": null (opcional)
}
```
- **Validações**:
  - `person_id` é obrigatório
  - `license_name` é obrigatório
  - `start_date` é obrigatório
  - `status` deve ser um dos valores: 'Ativa', 'Inativa', 'Suspensa', 'Cancelada'
  - Não permite múltiplas licenças ativas para a mesma pessoa

#### Listar Licenças
- **Método**: GET
- **Endpoint**: `/licenses/`
- **Parâmetros de Query**:
  - `page`: Número da página (padrão: 1)
  - `limit`: Quantidade de registros por página (padrão: 10)
  - `filters`: Filtros adicionais (opcional)

#### Buscar Licença por ID
- **Método**: GET
- **Endpoint**: `/licenses/:id`

#### Atualizar Licença
- **Método**: PUT
- **Endpoint**: `/licenses/:id`
- **Corpo da Requisição**: Mesmo formato da criação
- **Validações**: Mesmas da criação

#### Deletar Licença
- **Método**: DELETE
- **Endpoint**: `/licenses/:id`
- **Comportamento**: Marca a licença como inativa

### Códigos de Erro Comuns
- `400 Bad Request`: Dados inválidos ou violação de regra de negócio
- `404 Not Found`: Licença não encontrada
- `500 Internal Server Error`: Erro no servidor

### Exemplo de Fluxo
1. Verificar se pessoa tem licença ativa
2. Se não tiver, criar nova licença
3. Ao criar nova licença, a licença anterior é automaticamente marcada como inativa

## Endpoints de Associação Pessoa-Licença

#### Criar Associação Pessoa-Licença
- **Método:** `POST /person-licenses`
- **Autenticação:** Necessária
- **Corpo da Requisição:**
  ```json
  {
    "person_id": 1,
    "license_id": 2
  }
  ```
- **Respostas:**
  - `201`: Associação criada com sucesso
  - `400`: Dados inválidos ou associação já existente
  - `404`: Pessoa ou licença não encontrada

#### Listar Licenças de uma Pessoa
- **Método:** `GET /person-licenses/person/:personId`
- **Autenticação:** Necessária
- **Parâmetros de Consulta:** `page`, `limit`
- **Respostas:**
  - `200`: Lista de licenças
  - `400`: ID de pessoa inválido

#### Listar Pessoas de uma Licença
- **Método:** `GET /person-licenses/license/:licenseId`
- **Autenticação:** Necessária
- **Parâmetros de Consulta:** `page`, `limit`
- **Respostas:**
  - `200`: Lista de pessoas
  - `400`: ID de licença inválido

#### Remover Associação Pessoa-Licença
- **Método:** `DELETE /person-licenses/:personId/:licenseId`
- **Autenticação:** Necessária
- **Respostas:**
  - `204`: Associação removida com sucesso
  - `400`: IDs inválidos
  - `404`: Associação não encontrada

## Recursos

### Items
O recurso de Items permite o gerenciamento completo de itens no sistema.

#### Principais Funcionalidades
- Criação de novos items
- Listagem com filtros avançados
- Atualização de informações
- Exclusão de items

#### Endpoints Disponíveis
- `GET /items`: Listar items
- `GET /items/:id`: Detalhes de um item
- `POST /items`: Criar novo item
- `PUT /items/:id`: Atualizar item
- `DELETE /items/:id`: Excluir item

#### Exemplos de Uso
```javascript
// Criar um novo item
const newItem = await itemsClient.createItem({
    name: 'Notebook Gamer',
    category: 'Eletrônicos',
    price: 5999.99,
    stock_quantity: 10
});

// Listar items com filtros
const items = await itemsClient.listItems({
    category: 'Eletrônicos',
    min_price: 1000,
    max_price: 6000
});
```

#### Documentação Detalhada
Consulte [ITEMS_RESOURCE.md](docs/ITEMS_RESOURCE.md) para informações completas.

## Tipos de Movimentação

A API oferece endpoints completos para gerenciamento de tipos de movimentação financeira:

- `GET /movement-types`: Listar tipos de movimentação
- `GET /movement-types/:id`: Obter tipo de movimentação específico
- `POST /movement-types`: Criar novo tipo de movimentação
- `PUT /movement-types/:id`: Atualizar tipo de movimentação
- `DELETE /movement-types/:id`: Excluir tipo de movimentação

#### Categorias Suportadas
- RECEITA: Rendimentos financeiros
- DESPESA: Gastos e custos
- INVESTIMENTO: Aplicações financeiras

## Status de Movimentação

A API oferece endpoints completos para gerenciamento de status de movimentação financeira:

- `GET /movement-status`: Listar status de movimentação
- `GET /movement-status/:id`: Obter status de movimentação específico
- `POST /movement-status`: Criar novo status de movimentação
- `PUT /movement-status/:id`: Atualizar status de movimentação
- `DELETE /movement-status/:id`: Excluir status de movimentação

#### Características
- Suporta descrição opcional
- Permite definir ordem de exibição (display_order)
- Filtragem por nome do status

## Movimentações
- **GET** `/movements`
  - Lista movimentações com filtros avançados
  - Parâmetros de query:
    - `person_id`: ID da pessoa
    - `movement_type_id`: ID do tipo de movimentação
    - `movement_status_id`: ID do status de movimentação
    - `license_id`: ID da licença
    - `start_date`: Data de início (formato ISO)
    - `end_date`: Data de fim (formato ISO)
    - `min_amount`: Valor mínimo
    - `max_amount`: Valor máximo
    - `is_template`: Filtro de template (true/false)
    - `page`: Número da página (padrão: 1)
    - `limit`: Quantidade de itens por página (padrão: 10)

- **GET** `/movements/:id`
  - Busca uma movimentação específica por ID

- **POST** `/movements`
  - Cria uma nova movimentação
  - **Corpo da Requisição:**
    ```json
    {
      "movement_date": "2024-01-15",
      "person_id": 1,
      "total_amount": 500.00,
      "license_id": 2,
      "discount": 50.00,
      "addition": 0.00,
      "total_items": 2,
      "description": "Compra de equipamentos",
      "movement_type_id": 3,
      "movement_status_id": 1,
      "is_template": false
    }
    ```

- **PUT** `/movements/:id`
  - Atualiza uma movimentação existente
  - Corpo da requisição igual ao POST, mas com campos opcionais

- **DELETE** `/movements/:id`
  - Exclui uma movimentação específica por ID

## Validação de Requisições

A API utiliza middleware de validação baseado em Joi para garantir a integridade dos dados recebidos. Cada rota possui schemas específicos para validação de parâmetros, body e query.

## Testes
```bash
npm test
# ou
yarn test
```

## Tecnologias Utilizadas
- Node.js
- Express
- PostgreSQL
- JWT para autenticação
- RabbitMQ para mensageria

## Contribuição
Por favor, leia [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes sobre nosso código de conduta e o processo de submissão de pull requests.

## Licença
Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE.md](LICENSE.md) para detalhes.
