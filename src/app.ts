import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { ENV } from './config/env';
import { authMiddleware } from './middleware/authMiddleware';
import { errorMiddleware } from './middleware/errorMiddleware';
import logger from './config/logger';
import swaggerSpec from './config/swagger';
import { AppDataSource } from './config/typeorm';

// Importações de rotas
import userRoutes from './routes/userRoutes';
import personRoutes from './routes/personRoutes';
import authRoutes from './routes/authRoutes';
import healthRoutes from './routes/healthRoutes';
import taskRoutes from './routes/taskRoutes';
import logRoutes from './routes/logRoutes';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Middleware de logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Middleware padrão
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas públicas
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/logs', logRoutes);

// Middleware de autenticação
app.use(authMiddleware);

// Rotas protegidas
app.use('/users', userRoutes);
app.use('/persons', personRoutes);

// Middleware de tratamento de erros
app.use(errorMiddleware);

// Documentação Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rota 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    status: 404
  });
});

// Função para iniciar o servidor
async function startServer() {
  try {
    // Inicializar conexão com banco de dados
    await AppDataSource.initialize();
    logger.info('✅ Conexão com banco de dados estabelecida');

    // Iniciar servidor Express
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });

    // Tratamento de erros no servidor
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Porta ${PORT} já está em uso`);
      } else {
        logger.error('❌ Erro ao iniciar servidor:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Falha ao inicializar aplicação:', error);
    process.exit(1);
  }
}

// Iniciar o servidor
startServer();

export default app;
