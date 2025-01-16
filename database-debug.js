require('dotenv').config();
const { Pool } = require('pg');

console.log('Configurações de conexão:');
console.log('URL do banco:', process.env.SYSTEM_DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.SYSTEM_DATABASE_URL,
    ssl: false,
    // Adicionar mais configurações de conexão
    host: '23.88.48.122',
    port: 5432,
    user: 'postgres',
    password: 'ffcaa89a3e19bd98e911475c7974309b',
    database: 'AgileDB',
    // Desabilitar SSL explicitamente
    ssl: {
        rejectUnauthorized: false,
        require: false
    }
});

async function testConnection() {
    try {
        console.log('Tentando conectar ao banco de dados...');
        const client = await pool.connect();
        console.log('Conexão estabelecida com sucesso');
        
        try {
            const result = await client.query('SELECT NOW()');
            console.log('Resultado da consulta:', result.rows);
        } catch (queryError) {
            console.error('Erro na consulta:', queryError);
        } finally {
            client.release();
        }
    } catch (connectionError) {
        console.error('Erro de conexão:', connectionError);
        
        // Log detalhado do erro
        console.error('Detalhes do erro:', {
            message: connectionError.message,
            code: connectionError.code,
            stack: connectionError.stack
        });
    } finally {
        await pool.end();
    }
}

testConnection();
