import crypto from "crypto";

export const generateApiKey = (): string => {
  const randomBytes = crypto.randomBytes(32).toString("hex");
  return `sk_${randomBytes}`;
};
