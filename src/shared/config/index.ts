import dotenv from "dotenv";
import { StringValue } from "../types/jwt.types";
import { retailLllModel } from "../types/retell.types";

// Load environment variables
dotenv.config();

const config = {
  port: process.env.PORT ?? 5001,
  mongodbUri:
    process.env.MONGODB_URI ?? "mongodb://localhost:27017/digital-agents",
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "default_access_secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "default_refresh_secret",
    accessExpiresIn:
      (process.env.JWT_ACCESS_EXPIRATION as StringValue) ?? "15m",
    refreshExpiresIn:
      (process.env.JWT_REFRESH_EXPIRATION as StringValue) ?? "7d",
  },
  env: process.env.NODE_ENV ?? "development",
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : ["*"],
  retell: {
    apiKey: process.env.RETELL_API_KEY ?? "",
    defaultLlmModel:
      (process.env.RETELL_DEFAULT_LLM_MODEL as retailLllModel) ?? "gpt-4o",
    defaultVoice: process.env.RETELL_DEFAULT_VOICE ?? "11labs-Adrian",
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    model: process.env.OPENAI_MODEL ?? "gpt-4o",
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    currency: process.env.STRIPE_CURRENCY ?? "usd",
    successUrl: process.env.STRIPE_SUCCESS_URL ?? "",
    cancelUrl: process.env.STRIPE_CANCEL_URL ?? "",
  },
  pdf: {
    tempDir: process.env.PDF_TEMP_DIR ?? "temp",
    logoPath: process.env.PDF_LOGO_PATH ?? "public/images/logo.png",
  },
  logging: {
    level:
      process.env.LOG_LEVEL ??
      (process.env.NODE_ENV === "development" ? "debug" : "info"),
    console: process.env.LOG_CONSOLE !== "false",
    file:
      process.env.LOG_FILE === "true" || process.env.NODE_ENV === "production",
    maxSize: process.env.LOG_MAX_SIZE ?? "20m",
    maxFiles: process.env.LOG_MAX_FILES ?? "14d",
    directory: process.env.LOG_DIRECTORY ?? "logs",
  },
  analytics: {
    aggregationScheduled:
      process.env.ANALYTICS_AGGREGATION_SCHEDULED !== "false", // Enabled by default
  },
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  email: {
    provider: process.env.EMAIL_PROVIDER ?? "nodemailer", // 'nodemailer' or 'resend'
    from: process.env.EMAIL_FROM ?? "noreply@dmadan.com",
    // Nodemailer settings
    host: process.env.EMAIL_HOST ?? "",
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER ?? "",
      pass: process.env.EMAIL_PASSWORD ?? "",
    },
    // Resend settings
    resendApiKey: process.env.RESEND_API_KEY ?? "",
  },
};

export default config;
