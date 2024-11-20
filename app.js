const express = require('express');
const app = express();
const addressRoutes = require('./routes/addressRoutes');
const authRoutes = require('./routes/authRoutes');
const personRoutes = require('./routes/personRoutes');

if (!process.env.JWT_SECRET) {
  console.error('Erro: JWT_SECRET não está configurado.');
} else {
  console.log('JWT_SECRET configurado corretamente.');
}


// Middlewares
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('API is healthy');
});

// Health check
app.get('/end', (req, res) => {
  res.status(200).send('API is end');
});

// Rotas principais
app.use('/addresses', addressRoutes);
app.use('/auth', authRoutes);
app.use('/person', personRoutes);

// Log para confirmar que o servidor está rodando
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
