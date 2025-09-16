import { Router } from 'express';
import { addFeedback, getFeedbackByRoute } from '../controllers/feedbackController.js';

const router = Router();

router.post('/add', addFeedback);
router.get('/:routeId', getFeedbackByRoute);

export default router;


