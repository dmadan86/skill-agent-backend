import express, { Express } from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import authRoutes from "./features/auth/routes";
import agentRoutes from "./features/agents/routes";
import trainingRoutes from "./features/training/routes";
import departmentRoutes from "./features/departments/routes";
import evaluationRoutes from "./features/evaluation/routes";
import teamRoutes from "./features/teams/routes";
import chatRoutes from "./features/chat/routes";
import dashboardRoutes from "./features/dashboard/routes";
import analyticsRoutes from "./features/analytics/routes";
import billingRoutes from "./features/billing/routes";
import apiKeyRoutes from "./features/apikey/routes";
import webhookRouter from './features/webhook/routes';
import { errorHandler } from "./shared/middleware/errorHandler";
import { httpLogger, requestBodyLogger } from "./shared/middleware/httpLogger";
import config from "./shared/config";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./shared/config/swagger";
import seedUsers from "./shared/utils/seedUsers";
import ensureAdminUser from "./shared/utils/ensureAdminUser";
import logger from "./shared/utils/logger";
import { dbLogger } from "./shared/utils/loggerUtils";
import path from "path";
import fs from "fs";
import { schedulerService } from "./shared/services/schedulerService";
import { SystemLogService } from './shared/services/systemLogService';

// Create Express app
const app: Express = express();

// Ensure logs directory exists if file logging is enabled
if (config.logging.file) {
  const logDir = path.join(process.cwd(), config.logging.directory);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
    logger.info(`Created logs directory at ${logDir}`);
  }
}

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info(`Created uploads directory at ${uploadsDir}`);
}

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    dbLogger.connected("MongoDB");

    // Seed initial users
    await seedUsers();

    // Ensure admin user exists
    await ensureAdminUser();

    // Initialize scheduler service after DB connection
    schedulerService.initialize();

    await SystemLogService.logSystemStatus('up', 'database', {
      message: 'MongoDB connection established'
    });
  } catch (error) {
    dbLogger.connectionError(error);
    await SystemLogService.logSystemStatus('down', 'database', {
      message: 'MongoDB connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  }
};

// stripe signature parse
app.use("/api/billing/stripe/webhook", express.raw({ type: "application/json" }));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(helmet());
app.use(httpLogger);

// Serve static files for uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Use request body logger in development environment
if (config.env === "development") {
  app.use(requestBodyLogger);
}

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://skill-agent-backend.onrender.com",
      "https://api.skillagent.dmadan.com"
    ],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", limiter);
if (process.env.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  // API spec in JSON format
  app.get("/api-spec.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/evaluation", evaluationRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/api-key", apiKeyRoutes);
app.use('/api/endpoint', webhookRouter);

// Health check endpoint
app.get("/health", async (req, res) => {
  const startTime = Date.now();
  try {
    const responseTime = Date.now() - startTime;
    await SystemLogService.logPerformance('health_check', responseTime, 'system', {
      path: req.path,
      method: req.method
    });
    res.status(200).json({ status: "ok" });
  } catch (error) {
    logger.error('Health check failed:', error);
    await SystemLogService.logError(error as Error, 'health-check', {
      path: req.path,
      method: req.method
    });
    res.status(500).json({ status: "error" });
  }
});

// Error handler
app.use(errorHandler);

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  logger.error('Uncaught Exception:', error);
  await SystemLogService.logError(error, 'system', {
    type: 'uncaught_exception'
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason) => {
  logger.error('Unhandled Rejection:', reason);
  await SystemLogService.logError(reason as Error, 'system', {
    type: 'unhandled_rejection'
  });
  process.exit(1);
});

export { app, connectDB };
