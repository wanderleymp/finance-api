const express = require('express');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware para aceitar JSON
app.use(express.json());

// Rotas
app.use('/auth', authRoutes);

// Iniciar o servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
