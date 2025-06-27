import { validate } from "../../shared/middleware/validate";
import { Router } from "express";
import * as quickPrepController from "./controllers/quickPrepController";
import { quickPrepSchemas } from "./validation/quickPrepSchema";

const router = Router();

router.post('/', validate(quickPrepSchemas.updateUsageSchema), quickPrepController.updateUsage);

export default router;


