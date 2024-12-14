# Changelog - Finance API

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

## [Unreleased]

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

### Changed
- Adicionada lógica de validação no serviço de licenças
- Implementado tratamento de erros específicos para criação de licenças
- Adicionadas novas rotas em `/person-licenses` para gerenciamento de associações

### Pending
- Refinamento do endpoint de deleção de licenças
- Testes completos de todos os cenários de criação e atualização de licenças
