// app.js

const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes'); // <--- Adicione esta linha
const personRoutes = require('./routes/personRoutes');

app.use(express.json());

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).send('API is healthy');
});

// Definir a rota de autenticação
app.use('/auth', authRoutes);

// Definir a rota para Person
app.use('/person', personRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
