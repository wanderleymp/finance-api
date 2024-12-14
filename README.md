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
