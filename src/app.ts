import express from 'express';
import * as swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import swaggerSpec from './config/swagger';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import logRoutes from './routes/logRoutes';
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

// Rotas
app.use(healthRoutes);
app.use('/auth', authRoutes);
app.use('/api', taskRoutes);
app.use('/logs', logRoutes);

// Rota de documentação Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Tratamento de erros global
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Erro não tratado:', err);
  res.status(500).json({
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

export default app;
