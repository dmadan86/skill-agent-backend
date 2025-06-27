import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { InvalidTokenError, TokenExpiredError } from '../errors/AppError';
import config from '../config';
import logger from '../utils/logger';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  organizationOwner?: any;
  jti: string; // JWT ID for token tracking
}

export interface DecodedToken extends TokenPayload {
  exp: number;
  iat: number;
}

export interface EmailVerificationPayload {
  userId: string;
  email: string;
  action: 'email_verification' | 'password_reset' | 'magic_link_setup';
  jti: string;
}

export interface DecodedEmailToken extends EmailVerificationPayload {
  exp: number;
  iat: number;
}

export const generateAccessToken = (
  userId: string,
  email: string,
  role: string
): string => {
  const payload: TokenPayload = {
    userId,
    email,
    role,
    jti: uuidv4(),
  };

  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
};

export const generateRefreshToken = (
  userId: string,
  email: string,
  role: string
): string => {
  const payload: TokenPayload = {
    userId,
    email,
    role,
    jti: uuidv4(),
  };

  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as DecodedToken;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      jti: decoded.jti,
    };
  } catch (error) {
    if ((error as Error).name === 'TokenExpiredError') {
      throw new TokenExpiredError();
    }
    throw new InvalidTokenError();
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as DecodedToken;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      jti: decoded.jti,
    };
  } catch (error) {
    if ((error as Error).name === 'TokenExpiredError') {
      throw new TokenExpiredError();
    }
    throw new InvalidTokenError();
  }
};

export const getTokenExpirationDate = (token: string): Date => {
  try {
    const decoded = jwt.decode(token) as { exp: number };
    if (!decoded?.exp) {
      throw new InvalidTokenError();
    }
    return new Date(decoded.exp * 1000);
  } catch (error) {
    logger.error("Error getting token expiration date");
    logger.error(error);
    throw new InvalidTokenError();
  }
};

/**
 * Generate email verification token
 * @param userId - User ID
 * @param email - User email
 * @param action - Action type ('email_verification', 'password_reset', or 'magic_link_setup')
 * @returns JWT token for email verification
 */
export const generateEmailToken = (
  userId: string,
  email: string,
  action: 'email_verification' | 'password_reset' | 'magic_link_setup'
): string => {
  const payload: EmailVerificationPayload = {
    userId,
    email,
    action,
    jti: uuidv4(),
  };

  // Short expiration for security
  const expiresIn = action === 'email_verification' ? '48h' : '2h';

  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn,
  });
};

/**
 * Verify email verification token
 * @param token - JWT token
 * @param action - Expected action type
 * @returns Token payload if valid
 */
export const verifyEmailToken = (
  token: string,
  action: 'email_verification' | 'password_reset' | 'magic_link_setup'
): EmailVerificationPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as DecodedEmailToken;
    
    // Verify action matches to prevent token reuse for different purposes
    if (decoded.action !== action) {
      throw new InvalidTokenError({ message: 'Invalid token action' });
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      action: decoded.action,
      jti: decoded.jti,
    };
  } catch (error) {
    if ((error as Error).name === 'TokenExpiredError') {
      throw new TokenExpiredError();
    }
    throw new InvalidTokenError();
  }
};