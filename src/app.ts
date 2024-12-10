import express from 'express';
import * as swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import swaggerSpec from './config/swagger';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import logRoutes from './routes/logRoutes';
import userRoutes from './routes/userRoutes';
import { loggerMiddleware } from './middleware/loggerMiddleware';
import logger from './config/logger';

const app = express();

// Configuração do CORS
const corsOptions: cors.CorsOptions = {
  origin: ['http://localhost:3000', 'http://162.55.160.99:3000', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));

// Middleware para parsear JSON
app.use(express.json());

// Middleware de logs
app.use(loggerMiddleware);

// Log de todas as rotas registradas
app.use((req, res, next) => {
  console.log(`🌐 DEBUG - Requisição recebida: ${req.method} ${req.path}`);
  console.log(`🔑 DEBUG - Headers: ${JSON.stringify(req.headers, null, 2)}`);
  console.log(`🔢 DEBUG - Corpo da requisição: ${JSON.stringify(req.body, null, 2)}`);
  next();
});

// Rotas
app.use(healthRoutes);
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/users', userRoutes);
app.use('/logs', logRoutes);

console.log('Rotas registradas:', {
  healthRoutes: healthRoutes.stack
    .filter((r: any) => r.route && r.route.path)
    .map((r: any) => r.route.path),
  authRoutes: authRoutes.stack
    .filter((r: any) => r.route && r.route.path)
    .map((r: any) => `/auth${r.route.path}`),
  taskRoutes: taskRoutes.stack
    .filter((r: any) => r.route && r.route.path)
    .map((r: any) => `/tasks${r.route.path}`),
  userRoutes: userRoutes.stack
    .filter((r: any) => r.route && r.route.path)
    .map((r: any) => `/users${r.route.path}`),
  logRoutes: logRoutes.stack
    .filter((r: any) => r.route && r.route.path)
    .map((r: any) => `/logs${r.route.path}`)
});

// Log de rotas não encontradas
app.use((req, res, next) => {
  console.log(`❌ DEBUG - Rota não encontrada: ${req.method} ${req.path}`);
  console.log(`🔍 DEBUG - Headers: ${JSON.stringify(req.headers, null, 2)}`);
  res.status(404).json({ 
    message: 'Rota não encontrada',
    method: req.method,
    path: req.path,
    headers: req.headers
  });
});

// Rota de documentação Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Tratamento de erros global
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro não tratado:', err);
  logger.error('Erro não tratado:', err);
  res.status(500).json({
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

export default app;
