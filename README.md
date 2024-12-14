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
