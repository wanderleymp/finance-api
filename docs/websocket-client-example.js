/**
 * Exemplo de código para o front-end se conectar ao WebSocket
 * 
 * Este arquivo demonstra como integrar o WebSocket no front-end para
 * receber atualizações em tempo real de mensagens, status e eventos de digitação.
 */

// Importe a biblioteca socket.io-client
// npm install socket.io-client
import { io } from 'socket.io-client';

class ChatSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.chatRooms = new Set();
  }

  /**
   * Conecta ao servidor WebSocket
   * @param {string} token - Token JWT para autenticação
   * @param {string} serverUrl - URL do servidor WebSocket (opcional)
   * @returns {Promise<boolean>} - Sucesso da conexão
   */
  connect(token, serverUrl = 'https://dev.agilefinance.com.br') {
    return new Promise((resolve, reject) => {
      try {
        // Desconectar se já estiver conectado
        if (this.socket) {
          this.disconnect();
        }

        // Criar nova conexão
        this.socket = io(`${serverUrl}/chats`, {
          auth: {
            token
          },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000
        });

        // Eventos de conexão
        this.socket.on('connect', () => {
          console.log('Conectado ao WebSocket');
          this.isConnected = true;
          
          // Reconectar a salas de chat anteriores
          this.chatRooms.forEach(chatId => {
            this.joinChat(chatId);
          });
          
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          console.error('Erro de conexão WebSocket:', error.message);
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Desconectado do WebSocket:', reason);
          this.isConnected = false;
        });

        // Configurar listeners para eventos do chat
        this.setupChatEventListeners();
      } catch (error) {
        console.error('Erro ao conectar ao WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Configura os listeners para eventos do chat
   */
  setupChatEventListeners() {
    if (!this.socket) return;

    // Evento de nova mensagem
    this.socket.on('NEW_MESSAGE', (data) => {
      console.log('Nova mensagem recebida:', data);
      this.notifyListeners('message', data);
    });

    // Evento de atualização de status de mensagem
    this.socket.on('STATUS_UPDATE', (data) => {
      console.log('Status de mensagem atualizado:', data);
      this.notifyListeners('messageStatus', data);
    });

    // Evento de atualização de status de chat
    this.socket.on('CHAT_STATUS', (data) => {
      console.log('Status de chat atualizado:', data);
      this.notifyListeners('chatStatus', data);
    });

    // Evento de digitação
    this.socket.on('typing', (data) => {
      console.log('Evento de digitação:', data);
      this.notifyListeners('typing', data);
    });

    // Evento de erro
    this.socket.on('error', (error) => {
      console.error('Erro no WebSocket:', error);
      this.notifyListeners('error', error);
    });
  }

  /**
   * Notifica os listeners registrados para um evento
   * @param {string} event - Nome do evento
   * @param {any} data - Dados do evento
   */
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erro ao executar callback para evento ${event}:`, error);
        }
      });
    }
  }

  /**
   * Registra um listener para um evento
   * @param {string} event - Nome do evento
   * @param {Function} callback - Função de callback
   * @returns {Function} - Função para remover o listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event).add(callback);
    
    return () => {
      if (this.listeners.has(event)) {
        this.listeners.get(event).delete(callback);
      }
    };
  }

  /**
   * Entra em uma sala de chat
   * @param {number} chatId - ID do chat
   */
  joinChat(chatId) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket não conectado. Impossível entrar no chat:', chatId);
      return;
    }
    
    this.socket.emit('joinChat', { chatId });
    this.chatRooms.add(chatId);
    console.log(`Entrou no chat ${chatId}`);
  }

  /**
   * Sai de uma sala de chat
   * @param {number} chatId - ID do chat
   */
  leaveChat(chatId) {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('leaveChat', { chatId });
    this.chatRooms.delete(chatId);
    console.log(`Saiu do chat ${chatId}`);
  }

  /**
   * Envia evento de digitação
   * @param {number} chatId - ID do chat
   * @param {boolean} isTyping - Se está digitando ou não
   */
  sendTypingEvent(chatId, isTyping) {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('typing', { chatId, isTyping });
  }

  /**
   * Desconecta do WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.chatRooms.clear();
    }
  }
}

// Exemplo de uso
const chatSocket = new ChatSocketService();

// Conectar ao WebSocket
async function connectToWebSocket() {
  try {
    const token = 'seu-token-jwt'; // Obtenha o token JWT da sua autenticação
    await chatSocket.connect(token);
    
    // Entrar em um chat
    chatSocket.joinChat(123);
    
    // Registrar listeners para eventos
    chatSocket.on('message', (data) => {
      // Atualizar a interface com a nova mensagem
      console.log('Mensagem recebida:', data);
      
      // Exemplo: adicionar mensagem à lista
      const messagesList = document.getElementById('messages-list');
      const messageItem = document.createElement('div');
      messageItem.className = 'message-item';
      messageItem.innerHTML = `
        <div class="message-content">${data.data.content}</div>
        <div class="message-time">${new Date(data.timestamp).toLocaleTimeString()}</div>
      `;
      messagesList.appendChild(messageItem);
    });
    
    chatSocket.on('typing', (data) => {
      // Mostrar indicador de digitação
      const typingIndicator = document.getElementById('typing-indicator');
      if (data.isTyping) {
        typingIndicator.textContent = 'Digitando...';
        typingIndicator.style.display = 'block';
      } else {
        typingIndicator.style.display = 'none';
      }
    });
    
    // Enviar evento de digitação quando o usuário digita
    const messageInput = document.getElementById('message-input');
    let typingTimeout;
    
    messageInput.addEventListener('input', () => {
      chatSocket.sendTypingEvent(123, true);
      
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        chatSocket.sendTypingEvent(123, false);
      }, 2000);
    });
    
  } catch (error) {
    console.error('Falha ao conectar ao WebSocket:', error);
  }
}

// Chamar a função para conectar
connectToWebSocket();

export default ChatSocketService;
