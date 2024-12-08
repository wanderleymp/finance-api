import { Router } from 'express';
import salesRoutes from './sales.routes';
import tasksRoutes from './tasks.routes';

const routes = Router();

routes.use('/sales', salesRoutes);
routes.use('/tasks', tasksRoutes);

export default routes;
