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

## Finance API - Roadmap e Análise Técnica

### 1. Arquitetura do Projeto

O projeto segue uma arquitetura modular com clara separação de responsabilidades:

- **Padrão de Arquitetura**: Modular com camadas bem definidas
- **Gestão de Dados**: Padrão Repository
- **Cache**: Redis (opcional)
- **Validação**: Schemas Joi
- **Logging**: Sistema estruturado

### 2. Módulos Principais

#### 2.1 Módulos Existentes
- `auth`: Autenticação e autorização
- `health`: Monitoramento do sistema
- `items`: Gerenciamento de itens
- `installments`: Gerenciamento de parcelas
- `movement-items`: Itens de movimentação
- `movement-payments`: Pagamentos de movimentação
- `person-documents`: Documentos de pessoas

#### 2.2 Padrões de Implementação
- Services implementam interfaces (IService)
- Repositories implementam interfaces (IRepository)
- DTOs para entrada e saída de dados
- Validators para validação de dados
- Schemas para definição de estrutura

### 3. Análise de Conformidade

#### 3.1 Módulos Padronizados
✅ Módulos que seguem o padrão completo:
- `items`
- `auth`
- `movement-items`
- `person-documents`

#### 3.2 Módulos para Padronização
⚠️ Módulos que precisam de ajustes:
- `installments`: Falta testes
- `movement-payments`: Falta DTOs e validators
- `users`: Falta padronização de estrutura
- `boletos`: Falta interfaces e DTOs
- `movements`: Falta estrutura e testes

### 4. Estrutura Padrão de Módulo

```
módulo/
├── interfaces/
│   ├── IService.js
│   └── IRepository.js
├── dto/
│   ├── create.dto.js
│   ├── update.dto.js
│   └── response.dto.js
├── validators/
│   └── validator.js
├── schemas/
│   └── schema.js
├── __tests__/
│   └── unit.test.js
├── controller.js
├── service.js
├── repository.js
├── routes.js
└── module.js
```

### 5. Pontos de Atenção

#### 5.1 Problemas Identificados
- Estrutura inconsistente entre módulos
- Falta de testes unitários
- Validação inadequada em alguns módulos
- Uso inconsistente do sistema de cache
- Documentação variável entre módulos

#### 5.2 Módulo de Referência
O módulo `items` serve como referência por implementar:
- Interfaces completas
- DTOs para cada operação
- Validação Joi
- Cache Redis
- Testes unitários
- Documentação

### 6. Plano de Execução

#### Fase 1: Padronização de Estrutura
1. [ ] Criar scripts para gerar estrutura padrão de módulos
2. [ ] Reorganizar módulo `users`
3. [ ] Reorganizar módulo `movements`
4. [ ] Reorganizar módulo `boletos`
5. [ ] Reorganizar módulo `installments`

#### Fase 2: Implementação de Interfaces
1. [ ] Criar interfaces para `boletos`
2. [ ] Atualizar interfaces de `movements`
3. [ ] Revisar interfaces de `users`
4. [ ] Padronizar nomenclatura de interfaces

#### Fase 3: DTOs e Validação
1. [ ] Implementar DTOs para `movement-payments`
2. [ ] Implementar DTOs para `boletos`
3. [ ] Adicionar validators para `movement-payments`
4. [ ] Revisar schemas de validação

#### Fase 4: Cache e Performance
1. [ ] Implementar cache em `movements`
2. [ ] Implementar cache em `boletos`
3. [ ] Otimizar queries em `movement-payments`
4. [ ] Revisar índices do banco de dados

#### Fase 5: Testes
1. [ ] Adicionar testes para `installments`
2. [ ] Adicionar testes para `movements`
3. [ ] Adicionar testes para `boletos`
4. [ ] Implementar testes de integração

#### Fase 6: Documentação
1. [ ] Padronizar documentação de APIs
2. [ ] Criar documentação de arquitetura
3. [ ] Documentar padrões de código
4. [ ] Atualizar README principal

#### Fase 7: Monitoramento e Logs
1. [ ] Padronizar logs entre módulos
2. [ ] Implementar métricas de performance
3. [ ] Melhorar health checks
4. [ ] Configurar alertas

### 7. Prioridades de Execução

1. **Alta Prioridade**
   - Padronização do módulo `movements` (core do sistema)
   - Implementação de testes em módulos críticos
   - Correção de validações inadequadas

2. **Média Prioridade**
   - Implementação de cache
   - Padronização de DTOs
   - Documentação de APIs

3. **Baixa Prioridade**
   - Refatoração de módulos estáveis
   - Melhorias de performance não críticas
   - Documentação adicional

### 8. Estimativas de Tempo

- **Fase 1**: 2 semanas
- **Fase 2**: 1 semana
- **Fase 3**: 2 semanas
- **Fase 4**: 1 semana
- **Fase 5**: 2 semanas
- **Fase 6**: 1 semana
- **Fase 7**: 1 semana

**Tempo Total Estimado**: 10 semanas
