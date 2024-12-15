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

### 1.0.0.7 - Serviço de Consulta de CEP
- [x] Implementar integração com ViaCEP
- [x] Criar rota de consulta de CEP
- [x] Adicionar validação de formato
- [x] Implementar tratamento de erros
- [x] Documentar novo endpoint
- [x] Atualizar changelog

### 1.0.0.8 - Autenticação de Rotas
- [x] Adicionar middleware de autenticação para rotas de persons
- [x] Adicionar middleware de autenticação para rotas de person contacts
- [x] Validar proteção de endpoints
- [x] Testar rotas com e sem autenticação
- [ ] Documentar novos requisitos de autenticação

## Versão 1.0.0.7

- [ ] Implementar filtro automático de licenças em todas as consultas
  - Criar middleware para filtrar registros baseado nas licenças do usuário
  - Modificar repositórios para aplicar filtro de licenças
  - Detalhes completos em `ROADMAP_LICENSE_FILTER.md`

## Próximas Melhorias

### Infraestrutura e Qualidade
- [x] Implementar middleware de validação de requisições
- [ ] Adicionar mais testes unitários para rotas de endereço
- [ ] Implementar cache para consultas de CEP
- [ ] Adicionar mais tratamentos de erro específicos

### Funcionalidades
- [x] Consulta de CEP via ViaCEP
- [ ] Adicionar suporte para CEPs internacionais
- [ ] Criar endpoint para geocodificação de endereços

### Performance
- [ ] Otimizar middleware de validação
- [ ] Implementar rate limiting para rotas de consulta
- [ ] Adicionar métricas de performance para consultas externas

## Autenticação e Segurança

### Concluído
- [x] Implementação de autenticação JWT
- [x] Middleware de proteção de rotas
- [x] Geração de tokens seguros
- [x] Hash de senhas com bcrypt
- [x] Rota protegida de exemplo

### Próximos Passos
- [ ] Implementar refresh tokens
- [ ] Adicionar rate limiting para rotas de autenticação
- [ ] Criar mecanismo de bloqueio de conta após múltiplas tentativas de login
- [ ] Implementar recuperação de senha
- [ ] Adicionar autenticação de dois fatores (2FA)
- [ ] Implementar validação de complexidade de senha

## Pendências de Segurança

### Validação de Complexidade de Senha
- **Status**: Temporariamente desabilitado
- **Descrição**: Implementar validação robusta de complexidade de senha
- **Requisitos**:
  - [ ] Definir critérios de complexidade (comprimento mínimo, caracteres especiais, etc.)
  - [ ] Atualizar schema de validação no Joi
  - [ ] Adicionar testes unitários para novos critérios
  - [ ] Documentar novos requisitos de senha para usuários

### Próximos Passos
1. Discutir requisitos específicos de complexidade de senha com a equipe
2. Definir política de segurança de senhas
3. Implementar validação atualizada
4. Atualizar documentação do sistema

## Histórico de Implementações

### Dezembro 2024
- Implementação da rota de consulta de CEP
- Correção do middleware de validação de requisições
- Adição de logs detalhados para consultas de endereço

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
- [x] Sistema de autenticação
- [ ] Gestão de permissões
- [ ] Logs de auditoria

### 2.0.0 - Expansão do Sistema
- [ ] API de relatórios
- [ ] Integração com sistemas externos
- [ ] Processamento em lote
