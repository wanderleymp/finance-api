import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { taskProcessorService } from '../services/task-processor.service';
import { logger } from '../utils/logger';

export class TasksController {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Criar uma nova tarefa
  async createTask(req: Request, res: Response) {
    try {
      const { 
        name, 
        description, 
        process_id, 
        type, 
        metadata 
      } = req.body;

      const task = await taskProcessorService.enqueueTask({
        name,
        description,
        processId: process_id,
        type,
        metadata
      });

      res.status(201).json(task);
    } catch (error) {
      logger.error('Erro ao criar tarefa', error);
      res.status(500).json({ error: 'Erro ao criar tarefa' });
    }
  }

  // Listar todas as tarefas
  async listTasks(req: Request, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        type 
      } = req.query;

      const pageNum = Number(page);
      const limitNum = Number(limit);

      const where: any = {};
      if (status) where.status_id = Number(status);
      if (type) where.metadata = { path: ['type'], string_contains: type };

      const tasks = await this.prisma.tasks.findMany({
        where,
        include: {
          tasks_status: true
        },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { 
          created_at: 'desc' 
        }
      });

      const total = await this.prisma.tasks.count({ where });

      res.json({
        tasks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      logger.error('Erro ao listar tarefas', error);
      res.status(500).json({ error: 'Erro ao listar tarefas' });
    }
  }

  // Buscar tarefa por ID
  async getTaskById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const task = await this.prisma.tasks.findUnique({
        where: { task_id: Number(id) },
        include: {
          tasks_status: true,
          task_logs: true
        }
      });

      if (!task) {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
      }

      res.json(task);
    } catch (error) {
      logger.error('Erro ao buscar tarefa', error);
      res.status(500).json({ error: 'Erro ao buscar tarefa' });
    }
  }

  // Atualizar tarefa
  async updateTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { 
        name, 
        description, 
        status_id, 
        metadata 
      } = req.body;

      const updatedTask = await this.prisma.tasks.update({
        where: { task_id: Number(id) },
        data: {
          ...(name && { name }),
          ...(description && { description }),
          ...(status_id && { status_id }),
          ...(metadata && { metadata: JSON.stringify(metadata) })
        }
      });

      res.json(updatedTask);
    } catch (error) {
      logger.error('Erro ao atualizar tarefa', error);
      res.status(500).json({ error: 'Erro ao atualizar tarefa' });
    }
  }

  // Cancelar tarefa
  async cancelTask(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const cancelledTask = await this.prisma.tasks.update({
        where: { task_id: Number(id) },
        data: { 
          status_id: await this.getCancelStatusId() 
        }
      });

      res.json(cancelledTask);
    } catch (error) {
      logger.error('Erro ao cancelar tarefa', error);
      res.status(500).json({ error: 'Erro ao cancelar tarefa' });
    }
  }

  // Método auxiliar para obter ID de status de cancelamento
  private async getCancelStatusId(): Promise<number> {
    const cancelStatus = await this.prisma.tasks_status.findFirst({
      where: { name: 'cancelled' }
    });

    if (!cancelStatus) {
      const newStatus = await this.prisma.tasks_status.create({
        data: { 
          name: 'cancelled', 
          is_default: false 
        }
      });
      return newStatus.status_id;
    }

    return cancelStatus.status_id;
  }
}

export const tasksController = new TasksController();
