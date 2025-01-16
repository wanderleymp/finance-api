console.log('Iniciando script de diagnóstico');

// Verificar variáveis de ambiente
console.log('Variáveis de ambiente:', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    SYSTEM_DATABASE_URL: process.env.SYSTEM_DATABASE_URL
});

// Testar importações básicas
try {
    const { Pool } = require('pg');
    console.log('Importação do PostgreSQL: OK');
} catch (error) {
    console.error('Erro ao importar PostgreSQL:', error);
}

try {
    const express = require('express');
    console.log('Importação do Express: OK');
} catch (error) {
    console.error('Erro ao importar Express:', error);
}

// Testar criação de conexão básica
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.SYSTEM_DATABASE_URL || process.env.DATABASE_URL,
    ssl: false
});

async function testConnection() {
    try {
        console.log('Tentando conectar ao banco de dados');
        const client = await pool.connect();
        console.log('Conexão estabelecida com sucesso');
        
        const result = await client.query('SELECT NOW()');
        console.log('Consulta de teste:', result.rows);
        
        client.release();
    } catch (error) {
        console.error('Erro de conexão:', error);
    } finally {
        await pool.end();
    }
}

testConnection();
