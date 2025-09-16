import { Router } from 'express';
import { findRoutes } from '../controllers/routeController.js';

const router = Router();

router.post('/find', findRoutes);

export default router;


