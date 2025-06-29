import { Router } from "express";
import * as chatController from "./controllers/chatController";
import { validate } from "../../shared/middleware/validate";
import { authenticate } from "../../shared/middleware/authenticate";
import { chatSchemas } from "./validation/chatSchema";

const router = Router();

// All chat routes require authentication
router.use(authenticate);

// Create a new chat session
router.post(
  "/",
  validate(chatSchemas.createChatSessionSchema),
  chatController.createChatSession,
);

// Get a specific chat session
router.get(
  "/:id",
  validate(chatSchemas.getChatSessionSchema),
  chatController.getChatSession,
);

// List user's chat sessions
router.get(
  "/",
  validate(chatSchemas.listChatSessionsSchema),
  chatController.getUserSessions,
);

// End a chat session
router.post(
  "/:id/end",
  validate(chatSchemas.endChatSessionSchema),
  chatController.endChatSession,
);

export default router;
