import { app, connectDB } from "./app";
import config from "./shared/config";
import { createServer } from "http";
import { initializeSocketServer } from "./features/chat/controllers/chatSocketController";
import logger from "./shared/utils/logger";

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket server
const io = initializeSocketServer(httpServer);

// Connect to database
connectDB();

// Start server
const server = httpServer.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
  logger.info("WebSocket server initialized");
});

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  logger.error("Uncaught Exception", { error: err.stack });
  // Close server & exit process
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  logger.error("Unhandled Promise Rejection", { error: err.stack });
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle SIGTERM (e.g., Kubernetes pod shutdown)
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received. Closing server gracefully.");
  server.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });
});

export default server;
