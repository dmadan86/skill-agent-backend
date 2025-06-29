import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

// Extended request with user information
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role?: string;
  };
}

/**
 * Middleware to check if a user has the required role(s)
 * @param roles Array of allowed roles
 */
export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    // Check if user exists and has a role
    if (!user || !user.role) {
      return next(
        new AppError("Unauthorized: No user role found", "UNAUTHORIZED", 403),
      );
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(user.role)) {
      return next(
        new AppError("Forbidden: Insufficient permissions", "FORBIDDEN", 403),
      );
    }

    // User is authorized, proceed to the next middleware/controller
    next();
  };
};
