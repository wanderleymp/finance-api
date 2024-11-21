const express = require('express');
const app = express();
const addressRoutes = require('./routes/addressRoutes');
const authRoutes = require('./routes/authRoutes');
const movementRoutes = require('./routes/movementRoutes');

const personRoutes = require('./routes/personRoutes');
const cors = require('cors');

app.use(cors({
  origin: 'https://zp1v56uxy8rdx5ypatb0ockcb9tr6a-oci3--5173--d3acb9e1.local-credentialless.webcontainer-api.io',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Configurar tratamento explícito para requisições OPTIONS
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://zp1v56uxy8rdx5ypatb0ockcb9tr6a-oci3--5173--d3acb9e1.local-credentialless.webcontainer-api.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).end();
});

app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.path}`);
  next();
});

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
app.use('/movements', movementRoutes);

app.use('/person', personRoutes);




// Log para confirmar que o servidor está rodando
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
