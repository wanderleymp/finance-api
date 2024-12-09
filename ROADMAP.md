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
- [x] Criar estrutura de pastas do projeto
    - [x] `src/routes/`: Definição de rotas
    - [x] `src/controllers/`: Lógica de controle das requisições
    - [x] `src/services/`: Regras de negócio
    - [x] `src/repositories/`: Camada de acesso a dados
    - [x] `src/config/`: Configurações do projeto
    - [x] `src/utils/`: Utilitários e funções auxiliares
- [x] Criar `app.ts` com configuração do Express
    - [x] Configurar middleware básico
    - [x] Habilitar parsing de JSON
- [x] Criar `server.ts` para inicialização do servidor
    - [x] Definir porta de execução
    - [x] Adicionar log de inicialização
- [x] Definir convenções de código
    - [x] Padrões de nomenclatura de arquivos
    - [x] Estrutura de commits
    - [x] Guia de contribuição
- [x] Configurar variáveis de ambiente
    - [x] Instalar e configurar dotenv
    - [x] Criar `.env.example`
    - [x] Criar configuração de variáveis de ambiente
- [x] Criar primeira rota de exemplo
    - [x] Rota de health check
    - [x] Configurar controller de health check

### Fase 3: Configuração do Banco de Dados com Prisma
- [x] Configurar Prisma ORM
    - [x] Instalar Prisma e @prisma/client
    - [x] Inicializar configuração do Prisma
    - [x] Definir schema de banco de dados
    - [x] Criar modelo de User com user_name
    - [x] Aplicar migração inicial
- [x] Criar configuração de conexão com banco de dados
    - [x] Exportar instância do PrismaClient
    - [x] Configurar variável de ambiente DATABASE_URL
- [ ] Definir schema inicial
    - [ ] Criar modelo `AccountMovement`
    - [ ] Definir relacionamentos
- [ ] Gerenciar migrações
    - [ ] Criar primeira migração
    - [ ] Aplicar migração com `npx prisma migrate dev`
- [ ] Documentação
    - [ ] Criar `DB_SCHEMA.md` com detalhes do banco de dados

### Fase 4: Autenticação e Segurança
- [x] Implementar modelo de User
    - [x] Criar modelo de User com user_name
    - [x] Configurar campos de autenticação
- [x] Implementar hash de senhas
    - [x] Instalar Argon2
    - [x] Implementar hash de senhas no registro
    - [x] Implementar verificação de senhas no login
- [x] Desenvolver rotas de autenticação
    - [x] Criar controller de registro
    - [x] Criar controller de login
    - [x] Implementar rota POST /auth/register
    - [x] Implementar rota POST /auth/login
- [x] Integrar JWT para autenticação de rotas
    - [x] Instalar jsonwebtoken
    - [x] Gerar token JWT no registro
    - [x] Gerar token JWT no login
- [x] Criar testes unitários
    - [x] Testes para registro de usuário
    - [x] Testes para login de usuário
    - [x] Cobrir cenários de sucesso e erro

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
