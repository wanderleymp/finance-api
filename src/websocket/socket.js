// src/websocket/socket.js
const { Server } = require('socket.io');
const { logger } = require('../middlewares/logger');
const JwtService = require('../config/jwt');

let io;

/**
 * Inicializa o servidor Socket.IO
 * @param {Object} server - Servidor HTTP
 */
function initialize(server) {
    io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                // Permitir conexões sem origem (como apps mobile ou Postman)
                if (!origin) {
                    callback(null, true);
                    return;
                }

                // Lista de origens permitidas
                const allowedOrigins = [
                    'http://localhost:5173',
                    'http://localhost:5174',
                    'http://localhost:5175',
                    'https://app.agilefinance.com.br',
                    'https://dev.agilefinance.com.br'
                ];

                // Verificar se a origem está na lista de permitidas
                if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
                    callback(null, true);
                } else {
                    callback(new Error('Origem não permitida pelo CORS'), false);
                }
            },
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Middleware de autenticação
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            
            if (!token) {
                return next(new Error('Autenticação necessária'));
            }

            // Verificar token JWT
            const decoded = JwtService.verifyToken(token);
            
            if (!decoded) {
                return next(new Error('Token inválido'));
            }

            // Adicionar informações do usuário ao socket
            socket.userId = decoded.userId;
            socket.user = decoded;
            
            next();
        } catch (error) {
            logger.error('Erro na autenticação do WebSocket', {
                error: error.message,
                stack: error.stack
            });
            next(new Error('Erro na autenticação'));
        }
    });

    // Configurar namespaces
    setupChatNamespace(io);

    logger.info('Servidor WebSocket inicializado');
    
    return io;
}

/**
 * Configura o namespace de chat
 * @param {Object} io - Instância do Socket.IO
 */
function setupChatNamespace(io) {
    const chatNamespace = io.of('/chats');
    
    chatNamespace.on('connection', (socket) => {
        const userId = socket.userId;
        
        logger.info('Novo cliente conectado ao WebSocket de chat', { userId });

        // Registrar o usuário como online
        updateUserStatus(userId, 'ONLINE');
        
        // Entrar em uma sala de chat específica
        socket.on('joinChat', (data) => {
            try {
                const { chatId } = data;
                
                if (!chatId) {
                    socket.emit('error', { message: 'ID do chat não fornecido' });
                    return;
                }
                
                // Entrar na sala do chat
                const roomName = `chat:${chatId}`;
                socket.join(roomName);
                
                logger.info('Usuário entrou em um chat', { userId, chatId, roomName });
                
                // Notificar outros usuários na sala
                socket.to(roomName).emit('userJoined', { 
                    userId,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                logger.error('Erro ao entrar no chat', {
                    error: error.message,
                    userId
                });
                socket.emit('error', { message: 'Erro ao entrar no chat' });
            }
        });
        
        // Sair de uma sala de chat
        socket.on('leaveChat', (data) => {
            try {
                const { chatId } = data;
                
                if (!chatId) {
                    socket.emit('error', { message: 'ID do chat não fornecido' });
                    return;
                }
                
                // Sair da sala do chat
                const roomName = `chat:${chatId}`;
                socket.leave(roomName);
                
                logger.info('Usuário saiu de um chat', { userId, chatId });
                
                // Notificar outros usuários na sala
                socket.to(roomName).emit('userLeft', { 
                    userId,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                logger.error('Erro ao sair do chat', {
                    error: error.message,
                    userId
                });
                socket.emit('error', { message: 'Erro ao sair do chat' });
            }
        });
        
        // Evento de digitação
        socket.on('typing', (data) => {
            try {
                const { chatId, isTyping } = data;
                
                if (!chatId) {
                    socket.emit('error', { message: 'ID do chat não fornecido' });
                    return;
                }
                
                const roomName = `chat:${chatId}`;
                
                // Notificar outros usuários na sala
                socket.to(roomName).emit('userTyping', { 
                    userId,
                    isTyping,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                logger.error('Erro no evento de digitação', {
                    error: error.message,
                    userId
                });
            }
        });
        
        // Evento de desconexão
        socket.on('disconnect', () => {
            logger.info('Cliente desconectado do WebSocket de chat', { userId });
            
            // Registrar o usuário como offline
            updateUserStatus(userId, 'OFFLINE');
        });
    });
}

/**
 * Atualiza o status do usuário (online/offline)
 * @param {number} userId - ID do usuário
 * @param {string} status - Status do usuário (ONLINE/OFFLINE)
 */
async function updateUserStatus(userId, status) {
    try {
        // Aqui você implementaria a lógica para atualizar o status do usuário no banco de dados
        // Por exemplo, usando um repositório de status de contato
        
        // Emitir evento de status para todos os chats do usuário
        if (io) {
            io.of('/chats').emit('userStatus', {
                userId,
                status,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        logger.error('Erro ao atualizar status do usuário', {
            error: error.message,
            userId,
            status
        });
    }
}

/**
 * Envia uma mensagem para um chat específico
 * @param {number} chatId - ID do chat
 * @param {Object} message - Objeto da mensagem
 */
function sendMessage(chatId, message) {
    if (!io) {
        logger.error('Socket.IO não inicializado');
        return;
    }
    
    const roomName = `chat:${chatId}`;
    io.of('/chats').to(roomName).emit('newMessage', message);
    
    logger.info('Mensagem enviada via WebSocket', { chatId });
}

/**
 * Notifica sobre atualização de status de mensagem
 * @param {number} chatId - ID do chat
 * @param {Object} statusUpdate - Objeto com informações de status
 */
function updateMessageStatus(chatId, statusUpdate) {
    if (!io) {
        logger.error('Socket.IO não inicializado');
        return;
    }
    
    const roomName = `chat:${chatId}`;
    io.of('/chats').to(roomName).emit('messageStatus', statusUpdate);
}

module.exports = {
    initialize,
    sendMessage,
    updateMessageStatus
};
