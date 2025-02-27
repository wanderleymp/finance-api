const { io } = require('socket.io-client');

/**
 * Exemplo de implementação do cliente Socket.IO para o Finance API
 */
class FinanceSocketClient {
  constructor() {
    this.baseUrl = 'https://dev.agilefinance.com.br';
    this.token = null;
    this.socket = null;
    this.chatSocket = null;
  }

  /**
   * Configura o token de autenticação
   * @param {string} token - Token JWT
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Inicia a conexão com o WebSocket
   * @returns {Promise} - Promise que resolve quando a conexão for estabelecida
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (!this.token) {
        reject(new Error('Token não definido. Use setToken antes de conectar.'));
        return;
      }

      // Opções de conexão
      const options = {
        path: '/socket.io',
        auth: { token: this.token },
        transports: ['websocket'],
        forceNew: true,
        reconnection: true,
        timeout: 10000
      };

      console.log('Conectando ao Socket.IO...');
      
      // Conectar ao Socket.IO base
      this.socket = io(this.baseUrl, options);

      this.socket.on('connect', () => {
        console.log('Conexão base estabelecida!');
        
        // Conectar ao namespace de chat
        this.connectToChatNamespace();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Erro na conexão base:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Desconectado do servidor:', reason);
      });
    });
  }

  /**
   * Conecta ao namespace de chat
   * @private
   */
  connectToChatNamespace() {
    const options = {
      path: '/socket.io',
      auth: { token: this.token },
      transports: ['websocket'],
      forceNew: true
    };

    this.chatSocket = io(`${this.baseUrl}/chats`, options);

    this.chatSocket.on('connect', () => {
      console.log('Conectado ao namespace de chat!');
      
      // Configurar eventos do chat
      this.setupChatEvents();
    });

    this.chatSocket.on('connect_error', (error) => {
      console.error('Erro na conexão ao chat:', error);
    });
  }

  /**
   * Configura os eventos do chat
   * @private
   */
  setupChatEvents() {
    // Evento de nova mensagem
    this.chatSocket.on('new_message', (data) => {
      console.log('Nova mensagem recebida:', data);
      // Implementar lógica para tratar a mensagem
    });

    // Evento de atualização de status
    this.chatSocket.on('status_update', (data) => {
      console.log('Atualização de status:', data);
      // Implementar lógica para atualizar status
    });
  }

  /**
   * Envia uma mensagem
   * @param {number} chatId - ID do chat
   * @param {string} message - Conteúdo da mensagem
   * @param {string} type - Tipo da mensagem (TEXT, FILE, etc)
   */
  sendMessage(chatId, message, type = 'TEXT') {
    if (!this.chatSocket || !this.chatSocket.connected) {
      throw new Error('Socket não conectado');
    }

    const payload = {
      chatId,
      content: message,
      type
    };

    this.chatSocket.emit('send_message', payload, (response) => {
      console.log('Resposta ao enviar mensagem:', response);
    });
  }

  /**
   * Desconecta os sockets
   */
  disconnect() {
    if (this.chatSocket) {
      this.chatSocket.disconnect();
    }
    
    if (this.socket) {
      this.socket.disconnect();
    }
    
    console.log('Desconectado de todos os sockets');
  }
}

// Exemplo de uso
const client = new FinanceSocketClient();

// Definir o token JWT
client.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsImlhdCI6MTc0MDY1MjczMiwiZXhwIjoxNzQwNjY3MTMyfQ.Nv09Q-6_bRqy4QmGcHC2rJJQfdK2fmN9dWEzZwQ_rP0');

// Conectar
client.connect()
  .then(() => {
    console.log('Cliente conectado com sucesso!');
    
    // Exemplo: enviar uma mensagem
    // client.sendMessage(215, 'Olá, esta é uma mensagem de teste!');
  })
  .catch(error => {
    console.error('Erro ao conectar:', error);
  });

// Configurar para desconectar ao encerrar o programa
process.on('SIGINT', () => {
  client.disconnect();
  process.exit(0);
});
