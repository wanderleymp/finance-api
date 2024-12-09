import express from 'express';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Rotas
app.use(healthRoutes);
app.use('/auth', authRoutes);

export default app;
