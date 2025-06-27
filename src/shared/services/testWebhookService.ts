import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET as string;

export const verifyAgentWebhook = (req: Request, res: Response, next: NextFunction): void => {
  const signature = req.headers["x-signature"] as string;

  if (!signature) {
    res.status(400).send("Missing signature header");
    return;
  }

  // Verify the signature
  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

  if (signature !== expectedSignature) {
    res.status(401).send("Invalid signature");
    return;
  }

  // Process the verified payload
  const parsedBody = req.body;
  console.log("Verified agent creation:", parsedBody);

  res.status(200).send("Webhook verified and received");
};