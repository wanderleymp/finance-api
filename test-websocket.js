const io = require('socket.io-client');
const https = require('https');

// Desabilitar verificação de certificado SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Token JWT para autenticação
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsImlhdCI6MTc0MDY1MjczMiwiZXhwIjoxNzQwNjY3MTMyfQ.Nv09Q-6_bRqy4QmGcHC2rJJQfdK2fmN9dWEzZwQ_rP0';

// URL do WebSocket
const url = 'wss://dev.agilefinance.com.br/chats';

// Opções de conexão
const options = {
    auth: { token },
    transports: ['websocket'], // Forçar apenas WebSocket
    forceNew: true,
    reconnection: false,
    timeout: 5000,
    rejectUnauthorized: false, // Adicional para ignorar certificado
    agent: new https.Agent({ rejectUnauthorized: false }) // Ignorar verificação de certificado
};

console.log('Tentando conectar ao WebSocket...');

const socket = io(url, options);

socket.on('connect', () => {
    console.log('Conexão WebSocket estabelecida com sucesso!');
});

socket.on('connect_error', (error) => {
    console.error('Erro na conexão WebSocket:', error);
});

socket.on('error', (error) => {
    console.error('Erro no socket:', error);
});

socket.on('disconnect', (reason) => {
    console.log('Desconectado:', reason);
});
