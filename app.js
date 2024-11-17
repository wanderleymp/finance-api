// app.js
const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');

app.use(express.json()); // Para lidar com JSON no corpo das requisições

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).send('API is healthy');
});

// Definir a rota de autenticação
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
