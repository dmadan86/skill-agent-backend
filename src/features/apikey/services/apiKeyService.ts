import { ApiKey, IApiKey } from "../../../shared/models/ApiKey";
import { AppError } from "../../../shared/errors/AppError";
import { generateApiKey } from "../../../shared/utils/cryptoUtils";

export const getApiKeys = async (userId: string): Promise<IApiKey[]> => {
  return ApiKey.find({ userId }).select("-key");
};

export const createApiKey = async (
  userId: string,
  name: string
): Promise<IApiKey> => {
  const apiKey = new ApiKey({
    key: generateApiKey(),
    name,
    userId,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return apiKey.save();
};

export const revokeApiKey = async (
  id: string,
  userId: string
): Promise<void> => {
  const apiKey = await ApiKey.findOneAndDelete({ _id: id, userId });

  if (!apiKey) {
    throw new AppError("API key not found", "NOT_FOUND", 404);
  }
}; 