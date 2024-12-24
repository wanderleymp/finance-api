# Sistema de Mensagens e Chat

## Estrutura do Sistema

### 1. Estrutura de Chat/Thread
```sql
-- Chats (conversas)
CREATE TABLE chats (
    chat_id SERIAL PRIMARY KEY,
    person_id INTEGER NOT NULL,         -- Cliente/Pessoa do chat
    status VARCHAR(20) NOT NULL,        -- ACTIVE, CLOSED, ARCHIVED
    last_message_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Mensagens do Chat
CREATE TABLE chat_messages (
    message_id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL,
    direction VARCHAR(10) NOT NULL,      -- INBOUND, OUTBOUND
    content TEXT NOT NULL,
    metadata JSONB,                      -- Dados adicionais (arquivos, etc)
    created_at TIMESTAMP DEFAULT NOW()
);

-- Status das Mensagens
CREATE TABLE message_status (
    status_id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,        -- SENT, DELIVERED, READ
    occurred_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Providers (Integrações)
Interface padrão para providers de mensagens:
```javascript
interface IMessageProvider {
    send(message: Message): Promise<ProviderResponse>;
    receive(payload: any): Promise<Message>;
    getStatus(messageId: string): Promise<MessageStatus>;
}
```

Implementações específicas para cada canal:
- WhatsAppProvider: Integração com WhatsApp Business API
- EmailProvider: Integração com serviços de email (SMTP)

### 3. Processadores de Mensagens
Seguindo o padrão existente de processadores:

```javascript
class MessageProcessor extends TaskProcessor {
    getTaskType() {
        return 'MESSAGE';
    }

    async process(task) {
        const { message_id, channel } = task.payload;
        const provider = this.getProvider(channel);
        
        try {
            // Buscar mensagem
            const message = await this.messageService.findById(message_id);
            if (!message) {
                throw new Error(`Mensagem ${message_id} não encontrada`);
            }

            // Enviar via provider
            await provider.send(message);

            // Atualizar status
            await this.messageService.updateStatus(message_id, 'SENT');
            
            logger.info('Mensagem processada com sucesso', {
                taskId: task.task_id,
                messageId: message_id
            });
        } catch (error) {
            logger.error('Erro ao processar mensagem', {
                taskId: task.task_id,
                error: error.message,
                payload: task.payload
            });
            throw error;
        }
    }
}
```

## Integração com Sistema de Tasks

### 1. Registro do Processador
```javascript
// Em processors/messageProcessor.js
const messageProcessor = new MessageProcessor();
processorManager.registerProcessor(messageProcessor);
```

### 2. Criação de Tasks de Mensagem
```javascript
class MessageService {
    async send(message) {
        // 1. Salva a mensagem
        const savedMessage = await this.repository.create(message);

        // 2. Cria task para processamento assíncrono
        await this.taskService.createTask('MESSAGE', {
            message_id: savedMessage.id,
            channel: message.channel
        });

        return savedMessage;
    }
}
```

### 3. Tipos de Tasks
- MESSAGE_SEND: Envio de mensagem
- MESSAGE_STATUS_CHECK: Verificação de status
- CHAT_CLEANUP: Limpeza de chats inativos

## Fluxos de Mensagens

### 1. Envio de Mensagem
1. MessageService.send cria a mensagem
2. Cria task do tipo MESSAGE_SEND
3. TaskWorker processa a task
4. MessageProcessor envia via provider apropriado
5. Status é atualizado

### 2. Recebimento de Mensagem (Webhook)
1. Provider recebe webhook
2. Converte para formato interno
3. Salva mensagem
4. Atualiza chat se necessário

### 3. Atualização de Status
1. Provider recebe webhook de status
2. Status é atualizado no banco

## Roadmap de Desenvolvimento

### Fase 1: Estrutura Base
1. Criar migrations para tabelas
2. Implementar MessageRepository
3. Implementar MessageService básico
4. Criar MessageProcessor
5. Registrar processor no ProcessorManager

### Fase 2: Providers
1. Implementar WhatsAppProvider
   - Configuração da API
   - Método de envio
   - Tratamento de webhooks
2. Implementar EmailProvider
   - Configuração SMTP
   - Templates de email
   - Tratamento de bounces

### Fase 3: Chat
1. Implementar ChatRepository
2. Implementar ChatService
3. Criar endpoints da API
   - GET /chats
   - GET /chats/:id
   - GET /chats/:id/messages
   - POST /chats/:id/messages

### Fase 4: Webhooks
1. Criar rotas para webhooks
2. Implementar handlers para cada provider
3. Implementar processamento de status

### Fase 5: Integração com Sistema
1. Integrar com MovementService
2. Integrar com InstallmentService
3. Criar templates de mensagens

### Fase 6: Testes e Documentação
1. Testes unitários
2. Testes de integração
3. Documentação da API

### Fase 7: Monitoramento
1. Implementar logs detalhados
2. Criar dashboards de métricas
3. Implementar alertas

## Padrões de Desenvolvimento

### Criação (Create)
1. Validação de entrada
2. Sanitização de dados
3. Criação de task quando necessário
4. Retorno padronizado

### Leitura (Read)
1. Validação de parâmetros
2. Filtros e paginação
3. Cache quando apropriado

### Atualização (Update)
1. Validação de existência
2. Verificação de permissões
3. Registro de alterações

### Deleção (Delete)
1. Soft delete para mensagens
2. Arquivamento de chats
3. Limpeza periódica

## Considerações de Segurança
1. Autenticação de webhooks
2. Validação de remetentes
3. Rate limiting por cliente
4. Criptografia de dados sensíveis
5. Auditoria de acesso

## Métricas e KPIs
1. Taxa de entrega
2. Tempo de resposta
3. Engajamento
4. Falhas por tipo
5. Uso por canal
