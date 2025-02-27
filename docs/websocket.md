# Documentação WebSocket - Finance API

## Introdução

Este documento descreve a implementação WebSocket para o sistema de chat da Finance API. O WebSocket permite comunicação em tempo real para recursos como envio de mensagens, atualizações de status e notificações de digitação.

## Configuração

O WebSocket está configurado para operar no namespace `/chats` e requer autenticação via token JWT.

### Conexão

Para se conectar ao WebSocket, o cliente deve fornecer um token JWT válido:

```javascript
const socket = io('https://api.example.com/chats', {
  auth: {
    token: 'seu-token-jwt'
  }
});
```

## Eventos

### Eventos do Cliente para o Servidor

| Evento | Descrição | Payload |
|--------|-----------|---------|
| `joinChat` | Entrar em uma sala de chat | `{ chatId: number }` |
| `leaveChat` | Sair de uma sala de chat | `{ chatId: number }` |
| `typing` | Notificar que está digitando | `{ chatId: number, isTyping: boolean }` |
| `message` | Enviar uma mensagem | `{ chatId: number, content: string, contentType: string }` |

### Eventos do Servidor para o Cliente

| Evento | Descrição | Payload |
|--------|-----------|---------|
| `NEW_MESSAGE` | Nova mensagem recebida | `{ type: 'NEW_MESSAGE', data: MessageObject, timestamp: string }` |
| `STATUS_UPDATE` | Atualização de status de mensagem | `{ type: 'STATUS_UPDATE', data: { messageId: number, status: string, timestamp: string } }` |
| `CHAT_STATUS` | Atualização de status do chat | `{ type: 'CHAT_STATUS', data: { chatId: number, status: string, timestamp: string } }` |
| `typing` | Notificação de digitação | `{ userId: number, isTyping: boolean, timestamp: string }` |

## Exemplos de Uso

### Conectar ao WebSocket

```javascript
const socket = io('https://api.example.com/chats', {
  auth: {
    token: 'seu-token-jwt'
  }
});

socket.on('connect', () => {
  console.log('Conectado ao WebSocket!');
});

socket.on('connect_error', (error) => {
  console.error('Erro de conexão:', error.message);
});
```

### Entrar em um Chat

```javascript
socket.emit('joinChat', { chatId: 123 });
```

### Enviar Notificação de Digitação

```javascript
socket.emit('typing', { chatId: 123, isTyping: true });

// Quando parar de digitar
setTimeout(() => {
  socket.emit('typing', { chatId: 123, isTyping: false });
}, 2000);
```

### Receber Mensagens

```javascript
socket.on('NEW_MESSAGE', (data) => {
  console.log('Nova mensagem recebida:', data);
  // Atualizar interface do usuário
});
```

### Receber Atualizações de Status

```javascript
socket.on('STATUS_UPDATE', (data) => {
  console.log('Status atualizado:', data);
  // Atualizar interface do usuário
});
```

### Receber Notificações de Digitação

```javascript
socket.on('typing', (data) => {
  if (data.isTyping) {
    console.log(`Usuário ${data.userId} está digitando...`);
    // Mostrar indicador de digitação
  } else {
    console.log(`Usuário ${data.userId} parou de digitar`);
    // Esconder indicador de digitação
  }
});
```

## Endpoints REST Relacionados

Além dos eventos WebSocket, os seguintes endpoints REST estão disponíveis para interagir com o sistema de chat:

### Atualizar Status de Mensagem

```
PATCH /chats/:chatId/messages/:messageId/status
```

Payload:
```json
{
  "status": "READ"
}
```

### Atualizar Status de Chat

```
PATCH /chats/:chatId/status
```

Payload:
```json
{
  "status": "ACTIVE"
}
```

### Enviar Evento de Digitação

```
POST /chats/:chatId/typing
```

Payload:
```json
{
  "isTyping": true
}
```

## Considerações de Segurança

1. Todas as conexões WebSocket são autenticadas usando JWT
2. Os tokens são validados a cada conexão
3. Os usuários só podem acessar chats aos quais têm permissão
4. As mensagens são validadas antes de serem processadas

## Tratamento de Erros

O WebSocket emite eventos de erro em caso de falhas:

```javascript
socket.on('error', (error) => {
  console.error('Erro no WebSocket:', error);
});
```

## Limitações e Considerações de Desempenho

1. Manter conexões WebSocket abertas consome recursos do servidor
2. Para aplicações com grande número de usuários, considere implementar balanceamento de carga
3. Implemente reconexão automática no cliente em caso de queda de conexão
