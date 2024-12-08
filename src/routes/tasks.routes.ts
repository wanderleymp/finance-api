import { Router } from 'express';
import { tasksController } from '../controllers/tasks.controller';

const tasksRoutes = Router();

tasksRoutes.post('/', tasksController.createTask.bind(tasksController));
tasksRoutes.get('/', tasksController.listTasks.bind(tasksController));
tasksRoutes.get('/:id', tasksController.getTaskById.bind(tasksController));
tasksRoutes.put('/:id', tasksController.updateTask.bind(tasksController));
tasksRoutes.delete('/:id/cancel', tasksController.cancelTask.bind(tasksController));

export default tasksRoutes;
