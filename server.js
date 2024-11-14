// Importando os módulos necessários
const express = require('express');
const { Pool } = require('pg');

// Configuração do servidor
const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
  user: 'user_agile', // Substitua pelo seu usuário do PostgreSQL
  host: 'localhost',   // Ou o IP do seu servidor PostgreSQL
  database: 'agile_db', // Substitua pelo nome do seu banco de dados
  password: 'darct99KhVLJXvnbE9eX', // Substitua pela sua senha do PostgreSQL
  port: 5432,           // Porta padrão do PostgreSQL
});

// Middleware para tratamento de JSON
app.use(express.json());

// Rota de teste para verificar o funcionamento do servidor
app.get('/', (req, res) => {
  res.send('Hello Agile API!');
});

// Rota para buscar todos os registros de uma tabela específica
app.get('/dados', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM teste'); // Substitua "sua_tabela" pelo nome da sua tabela
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).send('Erro ao buscar dados');
  }
});

// Rota para inserir um registro na tabela
app.post('/dados', async (req, res) => {
  const { campo1, campo2 } = req.body; // Substitua pelos nomes dos campos que deseja inserir
  try {
    const query = 'INSERT INTO sua_tabela (campo1, campo2) VALUES ($1, $2) RETURNING *';
    const values = [campo1, campo2];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao inserir dados:', error);
    res.status(500).send('Erro ao inserir dados');
  }
});

// Iniciando o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
