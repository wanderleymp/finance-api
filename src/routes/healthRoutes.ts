import { Router } from 'express';
import { getHealthStatus } from '../controllers/healthController';
const healthRoutes = Router();
healthRoutes.get("/health", getHealthStatus);
export default healthRoutes;
