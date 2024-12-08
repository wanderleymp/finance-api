# Changelog

## [1.1.0] - 2024-12-08

### Added
- Novo endpoint para atualizar status de tarefas (PATCH /tasks/:id/status)
- Novo endpoint para listar erros de tarefas (GET /tasks/:id/errors)
- Implementação de repositório dedicado para tarefas
- Melhor tratamento de erros e logging em tarefas
- Paginação melhorada para listagem de tarefas
- Correção na paginação do endpoint de vendas

### Changed
- Atualizado Node.js para versão 20 no Docker
- Melhorias de segurança no Dockerfile
- Otimizações de performance no container Docker
- Reorganização do código de tarefas para melhor manutenibilidade
- Melhorias na documentação Swagger

### Security
- Adicionadas flags de segurança no Node.js
- Melhorias na execução do container como usuário não-root
- Otimização das permissões de arquivos no container

## [1.0.1] - Versão Anterior

- Versão inicial do sistema
