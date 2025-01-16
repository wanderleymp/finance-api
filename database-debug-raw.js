const { Client } = require('pg');

const client = new Client({
    host: '23.88.48.122',
    port: 5432,
    user: 'postgres',
    password: 'ffcaa89a3e19bd98e911475c7974309b',
    database: 'AgileDB',
    ssl: false
});

async function testConnection() {
    try {
        console.log('Tentando conectar ao banco de dados...');
        await client.connect();
        console.log('Conexão estabelecida com sucesso');
        
        try {
            const result = await client.query('SELECT NOW()');
            console.log('Resultado da consulta:', result.rows);
        } catch (queryError) {
            console.error('Erro na consulta:', queryError);
        } finally {
            await client.end();
        }
    } catch (connectionError) {
        console.error('Erro de conexão:', connectionError);
        
        // Log detalhado do erro
        console.error('Detalhes do erro:', {
            message: connectionError.message,
            code: connectionError.code,
            stack: connectionError.stack
        });
    }
}

testConnection();
