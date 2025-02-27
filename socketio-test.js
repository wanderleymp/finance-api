const io = require('socket.io-client');

// Desabilitar verificação de certificado SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Token JWT para autenticação
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsImlhdCI6MTc0MDY1MjczMiwiZXhwIjoxNzQwNjY3MTMyfQ.Nv09Q-6_bRqy4QmGcHC2rJJQfdK2fmN9dWEzZwQ_rP0';

// URL base do Socket.IO (sem o namespace)
const url = 'wss://dev.agilefinance.com.br';

// Opções de conexão
const options = {
    path: '/socket.io', // Path padrão do Socket.IO
    auth: { token },
    transports: ['websocket'], // Forçar apenas WebSocket
    forceNew: true,
    reconnection: false,
    timeout: 10000,
    rejectUnauthorized: false
};

console.log('Tentando conectar ao Socket.IO...');
console.log('URL base:', url);
console.log('Opções:', JSON.stringify(options, null, 2));

// Primeiro, tentar conectar na raiz do Socket.IO
const socket = io(url, options);

socket.on('connect', () => {
    console.log('✅ Conexão Socket.IO estabelecida com sucesso!');
    console.log('ID do Socket:', socket.id);
    
    // Após conectar na raiz, tentar conectar no namespace /chats
    console.log('\nTentando conectar ao namespace /chats...');
    const chatSocket = io(`${url}/chats`, options);
    
    chatSocket.on('connect', () => {
        console.log('✅ Conexão ao namespace /chats estabelecida com sucesso!');
        console.log('ID do Socket do chat:', chatSocket.id);
    });
    
    chatSocket.on('connect_error', (error) => {
        console.error('❌ Erro na conexão ao namespace /chats:', error.message);
    });
});

socket.on('connect_error', (error) => {
    console.error('❌ Erro na conexão Socket.IO:', error.message);
    console.error('Detalhes do erro:', error);
});

// Adicionar timeout para encerrar o script
setTimeout(() => {
    console.log('\n⏰ Tempo limite de conexão atingido');
    process.exit(0);
}, 15000);
