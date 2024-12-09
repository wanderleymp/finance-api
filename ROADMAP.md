# Roadmap do Projeto Finance API

## 📋 Visão Geral
Este documento descreve o plano de desenvolvimento para o projeto Finance API, um sistema de gerenciamento financeiro robusto e escalável.

## 🚀 Fases de Desenvolvimento

### Fase 1: Configuração do Ambiente
- [x] Instalar Node.js (versão LTS) e npm
- [x] Criar `package.json` com configurações iniciais
- [x] Configurar controle de versão com Git
    - [x] Inicializar repositório Git
    - [x] Criar branch de desenvolvimento 1.1.0
- [x] Configurar TypeScript
    - [x] Instalar dependências: `typescript`, `ts-node`, `@types/node`
    - [x] Criar `tsconfig.json` com configurações de compilação
- [x] Configurar ferramentas de qualidade de código
    - [x] Instalar e configurar ESLint
    - [x] Instalar e configurar Prettier
    - [x] Criar arquivos de configuração `.eslintrc` e `.prettierrc`
- [x] Configurar Jest para testes
    - [x] Instalar `jest`, `ts-jest`, `@types/jest`
    - [x] Criar `jest.config.js`

### Fase 2: Definição da Arquitetura e Pastas
- [ ] Criar estrutura de pastas do projeto
    - [ ] `src/routes/`: Definição de rotas
    - [ ] `src/controllers/`: Lógica de controle das requisições
    - [ ] `src/services/`: Regras de negócio
    - [ ] `src/repositories/`: Camada de acesso a dados
    - [ ] `src/config/`: Configurações do projeto
    - [ ] `src/utils/`: Utilitários e funções auxiliares
- [ ] Criar `app.ts` ou `main.ts` com configuração do Express
    - [ ] Configurar middleware básico
    - [ ] Carregar rotas dinamicamente
- [ ] Definir convenções de código
    - [ ] Padrões de nomenclatura de arquivos
    - [ ] Estrutura de commits
    - [ ] Guia de contribuição

### Fase 3: Configuração do Banco de Dados com Prisma
- [ ] Configurar Prisma ORM
    - [ ] Instalar `prisma` e `@prisma/client`
    - [ ] Executar `npx prisma init`
    - [ ] Configurar `DATABASE_URL`
- [ ] Definir schema inicial
    - [ ] Criar modelo `User`
    - [ ] Criar modelo `AccountMovement`
    - [ ] Definir relacionamentos
- [ ] Gerenciar migrações
    - [ ] Criar primeira migração
    - [ ] Aplicar migração com `npx prisma migrate dev`
- [ ] Documentação
    - [ ] Criar `DB_SCHEMA.md` com detalhes do banco de dados

### Fase 4: Autenticação e Segurança
- [ ] Implementar modelo de usuário
    - [ ] Criar schema de User no Prisma
    - [ ] Implementar hash de senhas com Argon2
- [ ] Desenvolver rotas de autenticação
    - [ ] Criar rota `POST /auth/register`
    - [ ] Criar rota `POST /auth/login`
- [ ] Integrar autenticação JWT
    - [ ] Gerar e validar tokens
    - [ ] Middleware de autenticação
    - [ ] Rotas protegidas
- [ ] Testes de autenticação
    - [ ] Testes unitários para registro
    - [ ] Testes unitários para login
    - [ ] Testes de middleware de autenticação

### Fase 5: Integração com RabbitMQ
- [ ] Configurar RabbitMQ
    - [ ] Instalar bibliotecas de conexão
    - [ ] Criar serviço de fila de mensagens
- [ ] Implementar fila de tarefas
    - [ ] Criar `tasks_queue`
    - [ ] Implementar produtor de mensagens
    - [ ] Implementar consumidor/worker
- [ ] Testes de mensageria
    - [ ] Testes unitários para serviço de fila
    - [ ] Testes de envio e recebimento de mensagens

### Fase 6: Funcionalidades Principais
- [ ] Modelar movimentações financeiras
    - [ ] Atualizar schema do Prisma
    - [ ] Definir tipos de movimentações
- [ ] Desenvolver rotas CRUD
    - [ ] `POST /movements`: Criar movimentação
    - [ ] `GET /movements`: Listar movimentações
    - [ ] `PUT /movements/:id`: Atualizar movimentação
    - [ ] `DELETE /movements/:id`: Excluir movimentação
- [ ] Implementar regras de negócio
    - [ ] Serviços de movimentações
    - [ ] Validações de entrada
    - [ ] Tratamento de erros
- [ ] Testes
    - [ ] Testes unitários para serviços
    - [ ] Testes de validação

### Fase 7: Testes de Integração e Qualidade
- [ ] Configurar testes de integração
    - [ ] Instalar Supertest
    - [ ] Preparar ambiente de testes
- [ ] Desenvolver testes de integração
    - [ ] Testar rotas de autenticação
    - [ ] Testar rotas de movimentações
- [ ] Garantir qualidade de código
    - [ ] Configurar cobertura de testes
    - [ ] Validar com ESLint
    - [ ] Realizar code review

### Fase 8: Preparação para Produção
- [ ] Containerização
    - [ ] Criar `Dockerfile` otimizado
    - [ ] Configurar `docker-compose.yml`
    - [ ] Definir variáveis de ambiente
- [ ] Configurações de deploy
    - [ ] Testar build local
    - [ ] Configurar variáveis de produção
- [ ] CI/CD (Opcional)
    - [ ] Configurar pipeline de integração
    - [ ] Definir estratégia de deploy
    - [ ] Configurar monitoramento

## 🏁 Conclusão
Este roadmap serve como guia para o desenvolvimento estruturado e de alta qualidade da Finance API.

**Nota**: Cada fase pode ser ajustada conforme necessidade do projeto.
