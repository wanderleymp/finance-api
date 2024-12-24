# Sistema de Tasks

## Visão Geral
O sistema de tasks é responsável pelo processamento assíncrono de operações no sistema. Ele permite que operações longas ou que podem falhar sejam executadas em background, com suporte a retentativas e monitoramento.

## Estrutura do Módulo
```
/modules/tasks/
  /controllers/
    - task.controller.js       # Endpoints REST
  /services/
    - task.service.js         # Lógica de negócio
  /repositories/
    - task.repository.js      # Acesso ao banco
  /processors/
    - base.processor.js       # Classe base para processadores
    - message.processor.js    # Processador de mensagens
    - boleto.processor.js     # Processador de boletos
    - nfse.processor.js       # Processador de NFSe
  /workers/
    - task.worker.js         # Worker principal
  /schemas/
    - task.schema.js         # Schemas de validação
  /interfaces/
    - processor.interface.js  # Interface para processadores
  /dto/
    - task.dto.js            # DTOs para tasks
  - task.module.js           # Configuração do módulo
```

## Modelo de Dados

### Tasks
```sql
-- Tipos de Tasks
CREATE TABLE task_types (
    type_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,    -- MESSAGE_SEND, BOLETO_EMIT, etc
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    type_id INTEGER NOT NULL REFERENCES task_types(type_id),
    status VARCHAR(20) NOT NULL,         -- PENDING, PROCESSING, COMPLETED, FAILED
    priority INTEGER DEFAULT 0,          -- Prioridade de execução
    retries INTEGER DEFAULT 0,           -- Número de tentativas
    max_retries INTEGER DEFAULT 3,       -- Máximo de tentativas
    payload JSONB,                       -- Dados da task
    result JSONB,                        -- Resultado da execução
    error_message TEXT,                  -- Mensagem de erro se falhou
    scheduled_for TIMESTAMP,             -- Agendamento
    started_at TIMESTAMP,                -- Início do processamento
    completed_at TIMESTAMP,              -- Fim do processamento
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'))
);

-- Histórico de Execução
CREATE TABLE task_executions (
    execution_id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(task_id),
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    error_message TEXT,
    metadata JSONB                       -- Dados adicionais da execução
);
```

## Componentes Principais

### 1. Task Service
Responsável pela lógica de negócio das tasks:
- Criação de tasks
- Consulta de status
- Gerenciamento de execução
- Tratamento de falhas

### 2. Task Worker
Responsável pelo processamento das tasks:
- Execução em background
- Processamento em lotes
- Gerenciamento de concorrência
- Coleta de métricas

### 3. Processors
Implementam a lógica específica para cada tipo de task:
- Validação de payload
- Processamento da operação
- Tratamento de erros específicos
- Políticas de retry

## Fluxos

### 1. Criação de Task
1. Serviço solicita criação de task
2. TaskService valida tipo e payload
3. Task é criada com status PENDING
4. Task é agendada se necessário

### 2. Processamento de Task
1. Worker busca tasks pendentes
2. Atualiza status para PROCESSING
3. Executa processor específico
4. Registra resultado ou erro
5. Atualiza métricas

### 3. Tratamento de Falhas
1. Erro é capturado
2. Processor específico trata erro
3. Verifica política de retry
4. Atualiza status e contadores
5. Registra no histórico

## Monitoramento

### 1. Métricas
- Taxa de sucesso/falha por tipo
- Tempo de processamento
- Tamanho da fila
- Distribuição de status

### 2. Alertas
- Tasks com muitas falhas
- Fila muito grande
- Tasks travadas
- Erros críticos

## Roadmap de Implementação

### Fase 1: Estrutura Base
1. Criar estrutura do módulo
2. Implementar migrations
3. Configurar worker base
4. Implementar TaskService básico

### Fase 2: Processadores
1. Definir interface base
2. Migrar processadores existentes
3. Implementar novos processadores
4. Adicionar validações

### Fase 3: Monitoramento
1. Implementar métricas
2. Criar dashboards
3. Configurar alertas
4. Melhorar logs

### Fase 4: Otimizações
1. Adicionar priorização
2. Implementar rate limiting
3. Melhorar concorrência
4. Otimizar queries

## Uso do Sistema

### Criando uma Task
```javascript
// Em qualquer serviço
await taskService.createTask('SEND_MESSAGE', {
    message_id: 123,
    channel: 'whatsapp'
}, {
    priority: 1,
    scheduledFor: new Date('2024-12-25'),
    maxRetries: 3
});
```

### Implementando um Processor
```javascript
class MessageProcessor extends BaseProcessor {
    getTaskType() {
        return 'SEND_MESSAGE';
    }

    async validatePayload(payload) {
        // Validar dados necessários
    }

    async process(task) {
        // Implementar lógica de envio
    }

    async handleFailure(task, error) {
        // Tratamento específico de falhas
    }
}
```

## Considerações de Segurança
1. Validação de payload
2. Sanitização de dados
3. Rate limiting
4. Monitoramento de recursos
5. Auditoria de execução
