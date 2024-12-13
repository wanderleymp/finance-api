# Changelog - Finance API

## [Não Lançado]

### Adicionado
- Estrutura inicial do projeto
- Configuração básica do servidor Express
- Configuração do ambiente de desenvolvimento
- Estrutura de pastas para a API RESTful
- Tabela roadmap criada no banco de desenvolvimento dev_history para gerenciar o progresso do projeto finance-api.
- Etapas principais do desenvolvimento registradas no banco de desenvolvimento dev_history, tabela roadmap.

### Configurações
- Adicionado `.env` para gerenciamento de variáveis de ambiente
- Configurado `.gitignore` para ignorar arquivos sensíveis
- Criado `README.md` com instruções de instalação e uso

## [1.3.0] - 2024-12-13
### Adicionado
- Centralização da configuração do banco de dados
- Pool de conexões padronizado para toda a aplicação
- Documentação detalhada da arquitetura do banco de dados no README

### Modificado
- Refatoração do PersonRepository para usar conexão centralizada
- Atualização da configuração SSL do banco de dados
- Melhoria no sistema de logging das operações de banco

### Detalhes Técnicos
- Criado sistema centralizado de conexão em `src/config/database.js`
- Implementado pool de conexões com configurações otimizadas
- Padronização do tratamento de erros e logging
- Remoção de configurações duplicadas de banco de dados

## [1.2.0] - 2024-12-12
### Adicionado
- Script completo de roadmap para registro no banco de dados.
- Script `roadmap:populate` para popular roadmap com tarefas detalhadas.
- Mapeamento completo de etapas do projeto no roadmap.
- Suporte a registro em lote de tarefas.
- Verificação e criação automática do banco de dados ao iniciar
- Script de migração com registro automático na tabela migrations
- Função de inicialização do servidor com tratamento de erros

### Modificado
- Atualizada versão da API para 1.2.0.
- Expandido o escopo de gerenciamento de roadmap.
- Refatoração do processo de inicialização do servidor
- Melhoria no tratamento de erros durante a inicialização

### Detalhes Técnicos
- Implementado `setupDatabase.js` para verificação e criação do banco
- Criado `migrate.js` para gerenciamento de migrações
- Atualizado `index.js` com nova função de inicialização do servidor

## [1.1.1] - 2024-12-13
### Adicionado
- Configuração centralizada de versões da aplicação
- Função de verificação de compatibilidade de versões
- Suporte a versionamento semântico

### Detalhes Técnicos
- Criado `src/config/version.js` para gerenciar versões
- Implementada lógica de comparação de versões
- Adicionado suporte para verificações de compatibilidade de versão

## [1.1.0] - 2024-12-12
### Adicionado
- Atualização automática do roadmap sempre que uma funcionalidade for concluída.
- Método `completeRoadmapTask` para atualizar ou criar tarefas no roadmap.
- Registro de tarefa concluída ao iniciar o servidor.
- Teste de conexão com RabbitMQ configurado.
- Logs detalhados para atualização automática de tarefas.

### Modificado
- Atualizada versão da API para 1.1.0.
- Melhorada a flexibilidade do gerenciamento de roadmap.

## [1.0.0.2] - 2024-12-13
### Adicionado
- CRUD completo para a entidade Person
- Implementação de repositório, serviço, controlador e rotas para Person
- Validação de esquema para endpoints de Person
- Tratamento de erros e logs para operações de Person

### Alterado
- Estrutura de arquivos para seguir padrão de arquitetura do projeto
- Adicionado middleware de validação para rotas de Person

### Melhorias
- Implementação de tratamento de erros consistente
- Adição de logs para todas as operações de banco de dados
- Validação de entrada de dados com Joi

## [1.0.0] - 2024-12-12
### Adicionado
- Conexão ao RabbitMQ remoto configurada via variável de ambiente.
- Arquivo de configuração atualizado para reutilizar a conexão.
- Teste de conexão adicionado ao iniciar o servidor.
- Tratamento de erros na conexão com RabbitMQ.
- Logs detalhados para conexão e erros do RabbitMQ.
- Endpoint `/health` com verificação de saúde do RabbitMQ.
- Função de verificação de saúde com teste de criação e exclusão de fila temporária.

### Modificado
- Atualizada versão da API para 1.0.0.
- Removida importação de rotas de health check separadas.

## [0.8.0] - 2024-12-12
### Adicionado
- Logs estruturados usando Winston e Morgan.
- Registro de requisições, respostas e erros não tratados.
- Logs separados para erros críticos e eventos gerais.
- Tratamento de exceções não capturadas.
- Configuração de log com rotação de arquivos.
- Middleware de log centralizado.

### Modificado
- Atualizada estrutura de tratamento de erros.
- Melhorada a captura de informações de log.

## [0.7.0] - 2024-12-12
### Adicionado
- Implementação de arquitetura de repositório, serviço e controlador.
- Endpoints para gerenciamento de roadmap.
- Configuração inicial do banco de dados PostgreSQL.

## [0.6.0] - 2024-12-12
### Refatorado
- Arquitetura do projeto para seguir padrão de repositório, serviço e controlador.
- Separação de responsabilidades entre camadas de acesso a dados, lógica de negócio e controle.

### Adicionado
- Repositório `RoadmapRepository` para acesso direto ao banco de dados.
- Serviço `RoadmapService` para lógica de negócio.
- Novos endpoints RESTful para gerenciamento de tarefas do roadmap:
  - `GET /roadmap`: Listar tarefas
  - `POST /roadmap`: Criar nova tarefa
  - `PUT /roadmap/:id`: Atualizar status da tarefa

### Modificado
- Endpoints de roadmap para suportar operações CRUD.
- Tratamento de erros e validações na camada de serviço.

## [0.5.0] - 2024-12-12
### Adicionado
- Endpoint `/roadmap` para consulta de tarefas do roadmap.
- Suporte a filtro de tarefas por status.
- Testes automatizados para o endpoint de roadmap.

### Modificado
- Estrutura de rotas para incluir consulta de roadmap.

## [0.4.0] - 2024-12-12
### Adicionado
- Integração de registro automático de tarefas ao servidor Node.js.
- Atualização automática de status ao iniciar ou concluir tarefas.
- Tratamento de erros durante o registro de tarefas.

### Modificado
- Atualizada inicialização do servidor para incluir registro de tarefas.

## [0.3.0] - 2024-12-12
### Adicionado
- Funções `startTask` e `finishTask` para registrar o andamento de tarefas no banco `dev_history`.
- Registro automático no roadmap ao iniciar ou concluir tarefas.
- Função `getTaskByTitle` para buscar detalhes de tarefas específicas.

## Configuração do Banco de Dados de Logs de Desenvolvimento

- **Banco de Dados:** dev_history
- **Usuário:** dev_user
- **Permissões:** ALL PRIVILEGES
- **Tabela:** development_log
  - Campos: id, task, result, description, hours_spent, created_at
- **Configurações de Conexão:**
  - IP: 10.1.0.2
  - Método de Autenticação: md5

### Próximos Passos
- Implementar autenticação JWT
- Configurar conexão com banco de dados PostgreSQL
- Desenvolver rotas iniciais da API
