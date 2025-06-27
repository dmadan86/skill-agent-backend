// src/features/training/routes.ts
import { Router } from 'express';
import * as trainingSessionController from './controllers/trainingSessionController';
import * as trainingProgressController from './controllers/trainingProgressController';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from '../../shared/middleware/authenticate';
import { trainingSchemas } from './validation/trainingSchema';

const router = Router();

// All training routes require authentication
router.use(authenticate);

// Training Session Routes 
router.post(
  '/',
  validate(trainingSchemas.createTrainingSessionSchema),
  trainingSessionController.createTrainingSession
);

router.get(
  '/progress',
  trainingProgressController.listUserTrainingProgress
);

router.get(
  '/assigned',
  validate(trainingSchemas.listTrainingSessionsSchema),
  trainingSessionController.listAssignedTrainingSessions
);


router.put(
  '/:id',
  validate(trainingSchemas.updateTrainingSessionSchema),
  trainingSessionController.updateTrainingSession
);

router.get(
  '/:id',
  validate(trainingSchemas.getTrainingSessionSchema),
  trainingSessionController.getTrainingSession
);

router.delete(
  '/:id',
  validate(trainingSchemas.deleteTrainingSessionSchema),
  trainingSessionController.deleteTrainingSession
);

router.post(
  '/:id/trainees',
  validate(trainingSchemas.assignTraineesSchema),
  trainingSessionController.assignTrainees
);

router.delete(
  '/:sessionId/trainees/:userId',
  validate(trainingSchemas.removeTraineeSchema),
  trainingSessionController.removeTrainee
);

router.post(
  '/reminder/:userId',
  validate(trainingSchemas.sendMemberReminderSchema),
  trainingSessionController.sendMemberReminder 
);

router.get(
  '/',
  validate(trainingSchemas.listTrainingSessionsSchema),
  trainingSessionController.listTrainingSessions
);

router.put(
  '/progress/:sessionId',
  validate(trainingSchemas.updateProgressSchema),
  trainingProgressController.updateProgress
);

router.post(
  '/progress/:sessionId/reset',
  validate(trainingSchemas.resetProgressSchema),
  trainingProgressController.resetProgress
);


router.post(
  '/progress/:sessionId/evaluations',
  validate(trainingSchemas.submitEvaluationSchema),
  trainingProgressController.submitEvaluation
);


router.get(
  '/progress/:sessionId',
  validate(trainingSchemas.startTrainingSchema),
  trainingProgressController.getTrainingProgress
);

router.get(
  '/employee/progress/:progressId',
  trainingProgressController.getTrainingProgressByProgressId
);

export default router;