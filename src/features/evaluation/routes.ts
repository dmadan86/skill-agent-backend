// src/features/evaluation/routes.ts
import { Router } from "express";
import * as evaluationController from "./controllers/evaluationController";
import * as evaluationProgressController from "./controllers/evalutionProgressController";
import { validate } from "../../shared/middleware/validate";
import { authenticate } from "../../shared/middleware/authenticate";
import { evaluationSchemas } from "./validation/evaluationSchema";

const router = Router();

// All evaluation routes require authentication
router.use(authenticate);

// Evaluation Routes
router.post(
  "/",
  validate(evaluationSchemas.createEvaluationSchema),
  evaluationController.createEvaluation,
);

router.get(
  "/",
  validate(evaluationSchemas.listEvaluationsSchema),
  evaluationController.listEvaluations,
);

router.get(
  "/progress",
  evaluationProgressController.listUserEvaluationProgress,
);

router.put(
  "/:id",
  validate(evaluationSchemas.updateEvaluationSchema),
  evaluationController.updateEvaluation,
);

router.get(
  "/:id",
  validate(evaluationSchemas.getEvaluationSchema),
  evaluationController.getEvaluation,
);

router.delete(
  "/:id",
  validate(evaluationSchemas.deleteEvaluationSchema),
  evaluationController.deleteEvaluation,
);

router.post(
  "/:id/assign",
  validate(evaluationSchemas.assignUsersSchema),
  evaluationController.assignUsers,
);

router.delete(
  "/:evaluationId/assignees/:userId",
  validate(evaluationSchemas.removeAssigneeSchema),
  evaluationController.removeAssignee,
);

router.put(
  "/progress/:evaluationId",
  validate(evaluationSchemas.updateEvaluationProgressSchema),
  evaluationProgressController.updateProgress,
);

router.get(
  "/progress/:evaluationId",
  evaluationProgressController.getEvaluationProgress,
);

router.get(
  "/:evaluationId/report/:userId",
  evaluationController.downloadEvaluationReport,
);

router.get(
  "/employee/progress/:progressId",
  evaluationProgressController.getEvaluationProgressByProgressId,
);

router.post(
  "/progress/:evaluationId/reset",
  evaluationProgressController.resetProgress,
);

export default router;
