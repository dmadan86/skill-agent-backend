import { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
import * as authService from "../services/authService";
import { sendSuccess } from "../../../shared/utils/response.utils";
import {
  LoginInput,
  RegisterInput,
  RefreshTokenInput,
  GoogleAuthInput,
  UpdateProfileInput,
  FacebookAuthInput,
  CreateOnboardingInput,
} from "../validation/authSchema";
import { AuthenticatedRequest } from "../../../shared/middleware/authenticate";
import { AppError, GoogleAuthError } from "../../../shared/errors/AppError";
import config from "../../../shared/config";
import { authLogger, apiLogger } from "../../../shared/utils/loggerUtils";
import { assignUserToAgent } from "../../agents/services/publicAgentService";

const googleClient = new OAuth2Client(config.google);

export const register = async (
  req: Request<{}, {}, RegisterInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userData: RegisterInput & { profilePicture?: string } = {
      ...req.body,
    };

    if (req.file) {
      userData.profilePicture = req.file.filename;
    }

    const user = await authService.register(userData);

    await authService.initializeFreemiumTrial(user._id.toString());

    authLogger.register(user._id.toString());

    sendSuccess(
      res,
      {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profilePicture: user.profilePicture,
      },
      201,
    );
  } catch (error) {
    apiLogger.error("POST", "/api/auth/register", error);
    next(error);
  }
};

export const completeOnboarding = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const result = await authService.completeOnboarding(req.user.userId);
    sendSuccess(res, result);
  } catch (error) {
    apiLogger.error("GET", "/api/auth/complete-onboarding", error);
    next(error);
  }
};

export const login = async (
  req: Request<{}, {}, LoginInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password, isPilot } = req.body;
    const result = await authService.login(email, password, req, isPilot);

    // Only set refresh token cookie for non-superadmin users
    // if (result.user?.role !== "superadmin") {
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    // }

    authLogger.login(
      result.user?._id.toString() ?? "",
      isPilot ? "pilot" : "email",
    );

    sendSuccess(res, {
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    if (req.body.email) {
      authLogger.loginFailed(
        req.body.email,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
    apiLogger.error("POST", "/api/auth/login", error);
    next(error);
  }
};

export const refreshToken = async (
  req: Request<{}, {}, RefreshTokenInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get token from cookies or request body
    const token = req.cookies.refreshToken ?? req.body.refreshToken;

    if (!token) {
      throw new AppError(
        "Refresh token is required",
        "AUTH_REFRESH_TOKEN_REQUIRED",
        400,
      );
    }

    const tokens = await authService.refreshToken(token, req);

    // Set new refresh token in cookie
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendSuccess(res, {
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    apiLogger.error("POST", "/api/auth/refresh-token", error);
    next(error);
  }
};

export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const refreshToken = req.cookies.refreshToken;
    await authService.logout(req.user.userId, refreshToken);

    // Clear the refresh token cookie
    res.clearCookie("refreshToken");

    authLogger.logout(req.user.userId);

    sendSuccess(res, { message: "Logged out successfully" });
  } catch (error) {
    if (req.user) {
      apiLogger.error("POST", "/api/auth/logout", error, req.user.userId);
    } else {
      apiLogger.error("POST", "/api/auth/logout", error);
    }
    next(error);
  }
};

export const getUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    apiLogger.request("GET", "/api/auth/me", req.user.userId);
    const user = await authService.getUser(req.user.userId);

    if (!user) {
      throw new AppError("User not found", "USER_NOT_FOUND", 404);
    }

    sendSuccess(res, {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department,
      position: user.position,
      teams: user.teams,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      profilePicture: user.profilePicture,
      passwordChangeRequired: user.passwordChangeRequired,
    });
  } catch (error) {
    if (req.user) {
      apiLogger.error("GET", "/api/auth/me", error, req.user.userId);
    } else {
      apiLogger.error("GET", "/api/auth/me", error);
    }
    next(error);
  }
};

export const getAllUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    if (req.user.role !== "admin") {
      throw new AppError("Unauthorized", "UNAUTHORIZED", 403);
    }

    apiLogger.request("GET", "/api/auth/users", req.user.userId);
    const users = await authService.getAllUsers();
    sendSuccess(res, users);
  } catch (error) {
    if (req.user) {
      apiLogger.error("GET", "/api/auth/users", error, req.user.userId);
    } else {
      apiLogger.error("GET", "/api/auth/users", error);
    }
    next(error);
  }
};

export const googleAuth = async (
  req: Request<{}, {}, GoogleAuthInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    apiLogger.request("POST", "/api/auth/google");
    const { idToken } = req.body;

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload.sub) {
      throw new GoogleAuthError("Invalid Google token");
    }

    // Extract user info from Google payload
    const googleId = payload.sub;
    const email = payload.email;
    const firstName = payload.given_name ?? "";
    const lastName = payload.family_name ?? "";

    // Authenticate or create user with Google info
    const result = await authService.googleAuth(
      googleId,
      email,
      firstName,
      lastName,
      req,
    );

    if (result.user) {
      await authService.initializeFreemiumTrial(result.user._id.toString());
    }

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    authLogger.login(result.user?._id.toString() ?? "", "google");

    sendSuccess(res, {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    apiLogger.error("POST", "/api/auth/google", error);
    next(error);
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest<{}, {}, UpdateProfileInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const userData: {
      firstName?: string;
      lastName?: string;
      bio?: string;
      profilePicture?: string;
    } = { ...req.body };

    if (req.file) {
      userData.profilePicture = req.file.filename;
    }

    const user = await authService.updateUserProfile(req.user.userId, userData);

    sendSuccess(res, {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      role: user.role,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    apiLogger.error("PUT", "/api/auth/profile", error, req.user?.userId);
    next(error);
  }
};

export const facebookAuth = async (
  req: Request<{}, {}, FacebookAuthInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { accessToken } = req.body;
    const result = await authService.facebookAuth(accessToken, req);

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    authLogger.login(result.user?._id.toString() ?? "", "facebook");

    sendSuccess(res, {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    apiLogger.error("POST", "/api/auth/facebook", error);
    next(error);
  }
};

export const createOnboarding = async (
  req: AuthenticatedRequest<{}, {}, CreateOnboardingInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { type, onboardingStep, interests } = req.body;
    const user = await authService.createOnboarding(req.user.userId, {
      type,
      onboardingStep,
      interests,
    });
    if (user.type === "individual" && user.onboardingSteps.length === 3) {
      await assignUserToAgent(req.user.userId);
    }
    sendSuccess(res, user, 201);
  } catch (error) {
    apiLogger.error(
      "PUT",
      "/api/auth/complete-onboarding",
      error,
      req.user?.userId,
    );
    next(error);
  }
};

export const getUsageLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const logs = await authService.getUsageLogs(req.user.userId);
    sendSuccess(res, logs);
  } catch (error) {
    apiLogger.error("GET", "/api/auth/usage-logs", error, req.user?.userId);
    next(error);
  }
};
