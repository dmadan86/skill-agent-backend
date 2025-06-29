// src/features/agents/routes.ts
import { Router } from "express";
import * as agentController from "./controllers/agentController";
import * as publicAgentController from "./controllers/publicAgentController";
import * as assignmentController from "./controllers/assignmentController";
import { validate } from "../../shared/middleware/validate";
import { authenticate } from "../../shared/middleware/authenticate";
import { agentSchemas } from "./validation/agentSchema";

const router = Router();

// All agent routes require authentication
router.use(authenticate);

// Create a new agent
router.post(
  "/",
  validate(agentSchemas.createAgentSchema),
  agentController.createAgent,
);

// Create public agents for the user
router.post("/public", publicAgentController.createPublicAgents);

// Get public agents for the current user
router.get("/public", publicAgentController.getPublicAgents);

// List agents with pagination and filtering
router.get(
  "/",
  validate(agentSchemas.listAgentsSchema),
  agentController.listAgents,
);

// List agents with pagination and filtering
router.get("/individual", agentController.listIndividualAgents);

router.post(
  "/start-web-call",
  validate(agentSchemas.startWebCallSchema),
  agentController.startWebCall,
);

// Update an existing agent
router.put(
  "/:id",
  validate(agentSchemas.updateAgentSchema),
  agentController.updateAgent,
);

// Get an agent by ID
router.get(
  "/:id",
  validate(agentSchemas.getAgentSchema),
  agentController.getAgent,
);

// Delete an agent
router.delete(
  "/:id",
  validate(agentSchemas.deleteAgentSchema),
  agentController.deleteAgent,
);

// Unified assignment routes
router.post(
  "/:agentId/assign",
  validate(agentSchemas.unifiedAssignmentSchema),
  assignmentController.assignUsersToAgent,
);

router.delete(
  "/:agentId/assign/:userId",
  validate(agentSchemas.unifiedRemoveUserSchema),
  assignmentController.removeUsersFromAgent,
);

export default router;
