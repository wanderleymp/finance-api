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
