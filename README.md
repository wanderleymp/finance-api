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
Copie o `.env.example` para `.env` e preencha com suas configurações

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
- `src/config/`: Configurações da aplicação
- `src/controllers/`: Controladores das rotas
- `src/db/`: Conexão e consultas ao banco de dados
- `src/routes/`: Definição das rotas da API
- `src/middlewares/`: Middlewares de autenticação e validação
- `src/workers/`: Processos assíncronos

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

## Contribuição
Por favor, leia [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes sobre nosso código de conduta e o processo de submissão de pull requests.

## Licença
Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE.md](LICENSE.md) para detalhes.
