# Histórico de Ações no Projeto

## Configuração ESLint e Prettier 

### Dependências Instaladas
- eslint
- @typescript-eslint/parser
- @typescript-eslint/eslint-plugin
- prettier
- eslint-config-prettier
- eslint-plugin-prettier

### Arquivos Configurados
- Criado `.eslintrc.json` com configurações para TypeScript
- Criado `.prettierrc` com regras de formatação de código
- Adicionados scripts de lint no `package.json`:
  - `lint`: Verificar código
  - `lint:fix`: Corrigir automaticamente problemas de lint

### Detalhes da Configuração
- Integração completa entre ESLint e Prettier
- Regras recomendadas para TypeScript
- Configurações para manter a consistência e qualidade do código

**Data:** 09/12/2024

## Configuração Jest 

### Dependências Instaladas
- jest
- ts-jest
- @types/jest

### Arquivos Configurados
- Criado `jest.config.js` com configurações para TypeScript
- Adicionados scripts de teste no `package.json`:
  - `test`: Executar testes
  - `test:watch`: Executar testes em modo de observação
  - `test:coverage`: Gerar relatório de cobertura de testes

### Detalhes da Configuração
- Preset configurado para ts-jest
- Ambiente de teste definido como Node.js
- Configurações de cobertura de código definidas
- Suporte para testes em TypeScript

**Data:** 09/12/2024

## Configuração Git e Branch 

### Ações Realizadas
- Inicialização do repositório Git
- Criação do branch de desenvolvimento 1.1.0
- Commit inicial do projeto

### Detalhes da Configuração
- Repositório Git configurado na raiz do projeto
- Branch atual: 1.1.0
- Preparação para desenvolvimento incremental

**Data:** 09/12/2024

## Definição da Arquitetura Inicial 

### Estrutura de Pastas
- Criadas pastas base do projeto:
  - `src/routes/`
  - `src/controllers/`
  - `src/services/`
  - `src/repositories/`
  - `src/config/`
  - `src/utils/`

### Configuração do Servidor
- Instalado Express e @types/express
- Criado `src/app.ts` com configurações básicas
  - Middleware para parsing de JSON
- Criado `src/server.ts` para inicialização do servidor
  - Definida porta 3000
  - Adicionado log de inicialização

### Ajustes no Projeto
- Adicionado script `dev` no `package.json`
- Atualizada versão para 1.1.0

**Data:** 09/12/2024

## Configuração de Variáveis de Ambiente 

### Dependências
- Instalado pacote `dotenv`

### Arquivos Criados
- `.env.example` com variáveis de configuração
- `src/config/env.ts` para gerenciamento de variáveis de ambiente
  - Função para obter variáveis com valor padrão
  - Exportação de variáveis principais

## Configuração do Banco de Dados com Prisma 

### Dependências
- Instalado Prisma e @prisma/client

### Configurações
- Configurado banco de dados PostgreSQL
- Atualizado `.env` com URL de conexão
- Criado modelo `User` no `schema.prisma`
  - Campos: id, user_name, password, createdAt, updatedAt
- Aplicada primeira migração
- Criado `src/config/prisma.ts` para exportar instância do PrismaClient

### Detalhes Técnicos
- Banco de dados: PostgreSQL
- Banco de desenvolvimento: finance_dev
- Configuração de conexão no endereço 10.1.0.2:5432

**Data:** 09/12/2024

## Primeira Rota de Exemplo 

### Rota de Health Check
- Criado `src/routes/healthRoutes.ts`
- Criado `src/controllers/healthController.ts`
  - Implementação do endpoint `/health`
  - Retorno de status e timestamp

### Ajustes no Servidor
- Atualizado `src/app.ts` para incluir rota de health check

**Data:** 09/12/2024

## Configuração de Autenticação e Segurança 

### Dependências
- Instalado Argon2 para hash de senhas
- Instalado jsonwebtoken para geração de tokens JWT

### Arquivos Criados
- `src/controllers/authController.ts`
  - Funções de registro e login
  - Validação de usuário
  - Geração de tokens JWT
- `src/routes/authRoutes.ts`
  - Rotas `/auth/register` e `/auth/login`
- `src/controllers/__tests__/authController.test.ts`
  - Testes unitários para funções de autenticação

### Funcionalidades Implementadas
- Hash de senhas com Argon2
- Registro de novos usuários
- Login com validação de credenciais
- Geração de tokens JWT
- Testes para cenários de registro e login

### Detalhes Técnicos
- Uso de Prisma para operações de banco de dados
- Tokens JWT com expiração de 1 hora
- Proteção contra usuários duplicados
- Tratamento de erros de autenticação

**Data:** 09/12/2024
