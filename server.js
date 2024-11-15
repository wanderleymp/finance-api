// Importando os módulos necessários
const express = require('express');
const { Pool } = require('pg');

// Configuração do servidor
const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
  user: 'agile_user', // Nome do usuário correto
  host: '157.90.31.218', // IP do servidor PostgreSQL
  database: 'agile_db', // Nome do banco de dados
  password: 'darct99KhVLJXvnbE9eX', // Senha correta
  port: 5432, // Porta do PostgreSQL
});

// Middleware para tratamento de JSON
app.use(express.json());

// Rota de teste para verificar o funcionamento do servidor
app.get('/', (req, res) => {
  console.log('Rota / foi acessada');
  res.send('Hello Agile API!');
});

// Rota para testar a conexão com o banco de dados
app.get('/test-db', async (req, res) => {
  try {
    console.log('Tentando conectar ao banco de dados...');
    await pool.query('SELECT 1');
    console.log('Conexão com o banco de dados bem-sucedida!');
    res.status(200).send('Conexão com o banco de dados bem-sucedida!');
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    res.status(500).send('Erro ao conectar ao banco de dados');
  }
});

// Rota para buscar todos os registros de uma tabela específica
app.get('/dados', async (req, res) => {
  try {
    console.log('Rota /dados foi acessada');
    const result = await pool.query('SELECT * FROM public.teste'); // Substitua "sua_tabela" pelo nome da sua tabela
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
    console.log('Tentando inserir um registro na tabela public.teste');
    const query = 'INSERT INTO public.teste (campo1, campo2) VALUES ($1, $2) RETURNING *';
    const values = [campo1, campo2];
    const result = await pool.query(query, values);
    console.log('Registro inserido com sucesso:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao inserir dados:', error);
    res.status(500).send('Erro ao inserir dados');
  }
});

// Iniciando o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT} ou http://157.90.31.218:${PORT}`);
});