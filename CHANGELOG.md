# Changelog - Finance API

## [1.3.0] - 2024-12-16

### Added
- CRUD completo para movimentações (`movements`)
  - Endpoint `GET /movements` para listar movimentações com filtros avançados
  - Endpoint `GET /movements/:id` para buscar movimentação específica
  - Endpoint `POST /movements` para criar nova movimentação
  - Endpoint `PUT /movements/:id` para atualizar movimentação
  - Endpoint `DELETE /movements/:id` para excluir movimentação
- Validação de entrada com Joi para todos os endpoints de movimentações
- Suporte a filtros avançados na listagem de movimentações:
  - Filtro por pessoa
  - Filtro por tipo de movimentação
  - Filtro por status de movimentação
  - Filtro por licença
  - Filtro por data de início e fim
  - Filtro por valor mínimo e máximo
  - Filtro por template

## [1.2.0] - 2024-12-15

### Added
- Sistema completo de recuperação de senha
  - Endpoint `/forgot-password` para solicitar recuperação
  - Endpoint `/reset-password` para redefinir senha com token
  - Endpoint `/change-password` para alterar senha (autenticado)
  - Endpoint `/password-status` para verificar status da senha
- Novas tabelas no banco de dados:
  - `password_reset_tokens` para gerenciar tokens de recuperação
  - `password_history` para histórico de senhas
- Campos adicionais na tabela `users`:
  - `password_changed_at`
  - `password_expires_at`
  - `require_password_change`
- Middlewares de segurança:
  - Rate limiting para tentativas de recuperação de senha
  - Validação de complexidade de senha
- Sistema de envio de emails para recuperação de senha
- Auditoria de alterações de senha
- Política de histórico de senhas (últimas 5)

### Security
- Implementação de rate limiting para prevenção de força bruta
- Tokens criptograficamente seguros para recuperação
- Hashing seguro de senhas com bcrypt
- Não revelação de existência de emails no sistema
- Expiração configurável de senhas
- Validação de complexidade de senha

## [1.1.1] - 2024-12-16
### Adicionado
- CRUD completo para status de movimentação financeira
- Rotas RESTful para gerenciamento de status de movimentação
- Validação de esquema para status de movimentação
- Suporte a filtros e paginação para status de movimentação
- Ordenação por display_order nos status de movimentação

## [1.1.0] - 2024-12-16
### Adicionado
- CRUD completo para tipos de movimentação financeira
- Migração de banco de dados para tabela `movement_types`
- Rotas RESTful para gerenciamento de tipos de movimentação
- Validação de esquema para tipos de movimentação
- Suporte a filtros e paginação para tipos de movimentação

## [1.0.0.8] - 2024-12-14

### Adicionado
- Serviço de consulta de CNPJ
  - Nova rota `GET /persons/cnpj/:cnpj`
  - Integração com API Brasil API
  - Validação de formato de CNPJ
  - Mapeamento de campos para padrão da API
  - Logs e tratamento de erros
  - Instalação da biblioteca cnpj-validator

## [1.0.0.7] - 2024-12-14

### Corrigido
- Middleware de validação de requisições
  - Corrigido erro no processamento de schemas do Joi
  - Adicionada lógica para seleção correta de schemas
  - Removida chamada incorreta de `schema.describe()`

### Melhorado
- Tratamento de erros no middleware de validação
- Logs de validação de requisições

## [1.0.0.6] - 2024-12-15
### Segurança
- ✅ Adicionado middleware de autenticação para rotas de persons
- ✅ Adicionado middleware de autenticação para rotas de person contacts
- ✅ Validação de proteção de endpoints
- ✅ Testes de autenticação concluídos

### Modificações
- Rotas de persons agora requerem token JWT
- Rotas de person contacts agora requerem token JWT
- Removida permissão de acesso sem autenticação para rotas sensíveis

## [1.0.0.6] - 2024-12-14

### Adicionado
- Serviço de consulta de CEP (ViaCEP):
  - Nova rota `GET /addresses/cep/:cep`
  - Validação de formato de CEP
  - Integração com API externa ViaCEP
  - Mapeamento de campos para padrão da API
  - Logs e tratamento de erros
  - Instalação da biblioteca axios

## [1.0.0.5] - 2024-12-14

### Alterado
- Reestruturação da tabela `person_documents`:
  - Removida tabela `document_types`
  - Adicionado ENUM `document_type_enum` para tipos de documentos
  - Migração de dados existentes para novo formato
  - Adicionado índice único para `person_id`, `document_type` e `document_value`

## [1.0.0.4] - 2024-12-13

### Adicionado
- Paginação Global para Listagens (GET)
- Implementação para a Entidade Person
- Suporte a page, limit, total e last_page

## [1.0.0.3] - 2024-12-12

### Adicionado
- Implementação inicial do projeto
- Estrutura base de arquivos
- Configuração do ambiente de desenvolvimento

## [1.0.3] - 2024-12-21
### Added
- Implementação completa de movement payments
- Novo módulo de payment methods
- Validação aprimorada com novo middleware
- Script de build para Docker com suporte multi-plataforma

### Changed
- Refatoração da estrutura de movement payments
- Melhorias nas rotas e controllers
- Otimização do processo de build

## [Unreleased]

## [1.0.8] - 2024-12-22
### Added
- Nova versão estável



## [1.0.7] - 2024-12-22
### Added
- Nova versão estável



## [1.0.7] - 2024-12-22
### Added
- Nova versão estável



## [1.0.6] - 2024-12-22
### Added
- Nova versão estável



## [1.0.6] - 2024-12-21
### Added
- Nova versão estável



## [1.0.5] - 2024-12-21
### Added
- Nova versão estável



## [1.0.5] - 2024-12-21
### Added
- Development version



### Added
- Implementação inicial do módulo de Licenças
- Criação de endpoints para gerenciamento de licenças
- Regras de negócio para criação e gerenciamento de licenças
  - Restrição de uma licença ativa por pessoa
  - Validações de dados de licença (nome, datas, status)
- Implementação completa do módulo de associação pessoa-licença
- Repositório `personLicenseRepository` com métodos CRUD
- Serviço `personLicenseService` com validações de negócio
- Controlador `personLicenseController` para gerenciamento de rotas
- Rotas para criação, listagem e remoção de associações pessoa-licença
- Validações de integridade para associações pessoa-licença
- Implementação de autenticação JWT com middleware
- Geração de tokens JWT no login
- Rota protegida de exemplo `/users/profile`
- Suporte a bcrypt para hash de senhas
- Recurso de Items completamente implementado
- Suporte a filtros avançados para items
- Validações de negócio para criação e atualização de items
- Testes abrangentes para repositório e serviço de items
- Documentação detalhada do recurso de items

### Changed
- Adicionada lógica de validação no serviço de licenças
- Implementado tratamento de erros específicos para criação de licenças
- Adicionadas novas rotas em `/person-licenses` para gerenciamento de associações
- Atualização do processo de autenticação para usar JWT
- Melhoria na segurança de geração e validação de tokens
- Refactored route management to centralize all routes in `routes/index.js`
- Removed route definitions from `app.js`
- Improved route organization and maintainability
- Padronização da implementação do recurso de items
- Melhoria nos logs e tratamento de erros
- Implementação de validações mais robustas

### Improved
- Performance de consultas de items
- Tratamento de erros no recurso de items
- Consistência de código entre diferentes recursos

### Security
- Adicionado middleware de autenticação para proteger rotas sensíveis

### Pending
- Refinamento do endpoint de deleção de licenças
- Testes completos de todos os cenários de criação e atualização de licenças
