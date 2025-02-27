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
    auth: { 
        token: token 
    },
    transports: ['websocket'], 
    forceNew: true,
    reconnection: false,
    timeout: 10000,
    rejectUnauthorized: false,
    agent: new https.Agent({ rejectUnauthorized: false })
};

console.log('Detalhes da Conexão:');
console.log('URL:', url);
console.log('Token:', token);
console.log('Opções:', JSON.stringify(options, null, 2));

console.log('\nTentando conectar ao WebSocket...');

const socket = io(url, options);

// Eventos detalhados de conexão
socket.on('connect', () => {
    console.log('✅ Conexão WebSocket estabelecida com sucesso!');
    console.log('ID do Socket:', socket.id);
    
    // Tentar enviar um evento de teste
    socket.emit('test_event', { message: 'Teste de conexão' }, (response) => {
        console.log('Resposta do servidor:', response);
    });
});

socket.on('connect_error', (error) => {
    console.error('❌ Erro na conexão WebSocket:', error);
    console.error('Detalhes completos do erro:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
});

socket.on('error', (error) => {
    console.error('❌ Erro no socket:', error);
});

socket.on('disconnect', (reason) => {
    console.log('🔌 Desconectado:', reason);
});

// Adicionar timeout para encerrar o script
setTimeout(() => {
    console.log('\n⏰ Tempo limite de conexão atingido');
    process.exit(0);
}, 15000);
