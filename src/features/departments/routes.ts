// src/features/departments/routes.ts
import { Router } from "express";
import * as departmentController from "./controllers/departmentController";
import { validate } from "../../shared/middleware/validate";
import { authenticate } from "../../shared/middleware/authenticate";
import { departmentSchemas } from "./validation/departmentSchema";

const router = Router();

// All department routes require authentication
router.use(authenticate);
// Department routes
router.post(
  "/",
  validate(departmentSchemas.createDepartmentSchema),
  departmentController.createDepartment,
);

router.put(
  "/:id",
  validate(departmentSchemas.updateDepartmentSchema),
  departmentController.updateDepartment,
);

router.get(
  "/:id",
  validate(departmentSchemas.getDepartmentSchema),
  departmentController.getDepartment,
);

router.delete(
  "/:id",
  validate(departmentSchemas.deleteDepartmentSchema),
  departmentController.deleteDepartment,
);

router.get("/", departmentController.listDepartments);

router.post(
  "/:id/members",
  validate(departmentSchemas.addMembersSchema),
  departmentController.addMembers,
);

router.delete(
  "/:id/members",
  validate(departmentSchemas.removeMembersSchema),
  departmentController.removeMembers,
);

export default router;
