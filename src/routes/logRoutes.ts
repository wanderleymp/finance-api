import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const combinedLogPath = path.join(__dirname, '../../logs/combined.log');
    const errorLogPath = path.join(__dirname, '../../logs/error.log');

    // Ler logs combinados
    const combinedLogs = fs.existsSync(combinedLogPath) 
      ? fs.readFileSync(combinedLogPath, 'utf-8').split('\n').filter(Boolean)
      : [];

    // Ler logs de erro
    const errorLogs = fs.existsSync(errorLogPath)
      ? fs.readFileSync(errorLogPath, 'utf-8').split('\n').filter(Boolean)
      : [];

    // Combinar e ordenar logs
    const allLogs = [...combinedLogs, ...errorLogs]
      .map(log => {
        try {
          return JSON.parse(log);
        } catch {
          return { message: log };
        }
      })
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
      .slice(0, 100); // Limitar a 100 logs mais recentes

    res.json({
      totalLogs: allLogs.length,
      logs: allLogs
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro ao recuperar logs', 
      error: (error as Error).message 
    });
  }
});

export default router;
