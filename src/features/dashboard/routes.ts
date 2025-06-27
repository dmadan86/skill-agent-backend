import { Router } from 'express';
import * as dashboardController from './controller/dashboardController';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from '../../shared/middleware/authenticate';
import { dashboardSchemas } from './validation/dashboardSchema';

const router = Router();

router.use(authenticate);

router.get(
  '/recent-activities',
  validate(dashboardSchemas.recentActivitiesSchema),
  dashboardController.getRecentActivities
);

router.get(
  '/dashboard-data',
  dashboardController.getDashboardData
);

export default router;
