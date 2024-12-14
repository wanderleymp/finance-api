# Roadmap - Finance API

## Versão 1.0.0 - Base do Sistema

### 1.0.0.5 - Ajuste na Estrutura de Documentos
- [x] Remover tabela document_types
- [x] Criar ENUM document_type_enum
- [x] Ajustar tabela person_documents
- [x] Migrar dados existentes
- [x] Criar índices de unicidade

### 1.0.0.4 - Sistema de Paginação
- [x] Implementar paginação global
- [x] Aplicar em listagem de pessoas
- [x] Documentar padrões de resposta

### 1.0.0.3 - Configuração Inicial
- [x] Estrutura base do projeto
- [x] Configuração de banco de dados
- [x] Sistema de migrations

### 1.0.0.6 - Modelagem de Associação de Contatos
- [x] Criar tabela `person_contacts`
- [x] Implementar migração automática
- [x] Adicionar restrições de integridade referencial
- [x] Documentar estrutura da tabela
- [x] Atualizar changelog
- [x] Atualizar README

## Próximas Versões

### 1.0.1 - Melhorias e Otimizações
- [ ] Cache para consultas frequentes
- [ ] Rate limiting
- [ ] Compressão de resposta

### 1.0.2 - Desenvolvimento de Serviços de Contatos
- [ ] Desenvolver serviços para manipulação de `person_contacts`
- [ ] Criar testes unitários para associação de contatos
- [ ] Implementar validações de negócio

### 1.1.0 - Novas Funcionalidades
- [ ] Sistema de autenticação
- [ ] Gestão de permissões
- [ ] Logs de auditoria

### 2.0.0 - Expansão do Sistema
- [ ] API de relatórios
- [ ] Integração com sistemas externos
- [ ] Processamento em lote