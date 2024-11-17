// app.js

// Importações
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes'); // Importa as rotas de autenticação
require('dotenv').config();

// Inicializar o app Express
const app = express();

// Middlewares
app.use(bodyParser.json()); // Para interpretar o corpo das requisições em JSON

app.get('/health', (req, res) => {
  res.send('Hello Agile!');
});

// Rotas de autenticação
app.use('/auth', authRoutes); // Inclui as rotas de autenticação na URL /auth

// Configuração da Porta
const PORT = process.env.PORT || 3000;

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
