// src/features/teams/routes/teamRoutes.ts
import { Router } from "express";
import * as teamController from "./controllers/teamController";
import { authenticate } from "../../shared/middleware/authenticate";
import { validate } from "../../shared/middleware/validate";
import multer from "multer";
import { teamSchemas } from "./validation/teamSchema";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Team management routes
router.post(
  "/",
  authenticate,
  validate(teamSchemas.createTeamSchema),
  teamController.createTeam
);

router.get("/", authenticate, teamController.getAllTeams);

// User invitation routes
router.get("/user/invites", authenticate, teamController.getUserInvites);

router.get("/bulk-import/template", teamController.downloadImportTemplate);

router.post(
  "/invites/accept",
  validate(teamSchemas.acceptInviteSchema),
  teamController.acceptInvite
);

router.post(
  "/invites/reject",
  validate(teamSchemas.acceptInviteSchema),
  teamController.rejectInvite
);

router.delete("/invites/:inviteId", authenticate, teamController.cancelInvite);

router.get("/:teamId", authenticate, teamController.getTeam);

router.put(
  "/:teamId",
  authenticate,
  validate(teamSchemas.updateTeamSchema),
  teamController.updateTeam
);

router.delete("/:teamId", authenticate, teamController.deleteTeam);

// Team membership routes
router.post(
  "/:teamId/members",
  authenticate,
  validate(teamSchemas.addTeamMemberSchema),
  teamController.addTeamMembers
);

router.delete(
  "/:teamId/members",
  authenticate,
  teamController.removeTeamMembers
);

// Team invitation routes
router.post(
  "/:teamId/invites",
  authenticate,
  validate(teamSchemas.inviteToTeamSchema),
  teamController.inviteToTeam
);

router.get("/:teamId/invites", authenticate, teamController.getTeamInvites);

// Bulk import routes
router.post(
  "/:teamId/bulk-import",
  authenticate,
  upload.single("file"),
  teamController.bulkImportMembers
);

export default router;
