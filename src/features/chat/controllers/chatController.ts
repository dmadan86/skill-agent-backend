import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as chatService from '../services/chatService';
import { sendSuccess } from '../../../shared/utils/response.utils';
import { AuthenticatedRequest } from '../../../shared/middleware/authenticate';
import { AppError } from '../../../shared/errors/AppError';

/**
 * Create a new chat session
 */
export const createChatSession = async (
  req: AuthenticatedRequest<{}, {}, { agentId: string; sessionId?: string; sessionType: 'TRAINING' | 'EVALUATION' | 'QUICK_PREP' }>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { agentId, sessionType, sessionId } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const session = await chatService.createChatSession(userId, agentId, sessionType, sessionId);

    sendSuccess(
      res,
      {
        message: 'Chat session created successfully',
        data: {
          sessionId: session._id,
          agentId: session.agentId,
          sessionType: session.sessionType,
          status: session.status,
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific chat session
 */
export const getChatSession = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { id } = req.params;
    const session = await chatService.getChatSession(id);

    // Verify ownership
    if (!session.userId.equals(new mongoose.Types.ObjectId(req.user.userId))) {
      throw new AppError('Access denied', 'ACCESS_DENIED', 403);
    }

    sendSuccess(res, {
      message: 'Chat session retrieved successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user chat sessions
 */
export const getUserSessions = async (
  req: AuthenticatedRequest<{}, {}, {}, { page?: string; limit?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const result = await chatService.listUserChatSessions(userId, page, limit);

    sendSuccess(res, {
      message: 'Chat sessions retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * End a chat session
 */
export const endChatSession = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { id } = req.params;
    const summary = await chatService.endChatSession(id);

    sendSuccess(res, {
      message: 'Chat session ended successfully',
      data: { summary },
    });
  } catch (error) {
    next(error);
  }
}; 