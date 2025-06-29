import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import config from "../../../shared/config";
import * as chatService from "../services/chatService";
import mongoose from "mongoose";
import { AppError } from "../../../shared/errors/AppError";
import { verifyAccessToken } from "../../../shared/services/tokenService";
import logger from "../../../shared/utils/logger";

/**
 * Socket.io Events Documentation
 *
 * Events emitted by the server that the frontend should listen for:
 *
 * - 'session-joined': Emitted when a user successfully joins a chat session
 *    Payload: { sessionId: string }
 *
 * - 'greeting': Emitted when joining a session (non-streaming mode)
 *    Payload: { messageId: string, content: string }
 *
 * - 'greeting-stream-start': Signals the start of a streaming greeting
 *    Payload: { sessionId: string, messageId: string }
 *
 * - 'greeting-token': Each individual token from the streaming greeting
 *    Payload: { sessionId: string, messageId: string, token: string }
 *
 * - 'greeting-stream-complete': Signals the end of a streaming greeting
 *    Payload: { sessionId: string, messageId: string, fullMessage: string }
 *
 * - 'message-received': Confirmation that user's message has been received
 *    Payload: { messageId: string }
 *
 * - 'assistant-stream-start': Signals the start of a streaming response
 *    Payload: { sessionId: string }
 *
 * - 'assistant-token': Each individual token from the streaming response
 *    Payload: { sessionId: string, token: string }
 *
 * - 'assistant-stream-complete': Signals the end of a streaming response
 *    Payload: { sessionId: string, messageId: string, fullMessage: string }
 *
 * - 'assistant-message': Complete message for non-streaming responses
 *    Payload: { sessionId: string, messageId: string, content: string }
 *
 * - 'session-ended': Emitted when a session is ended
 *    Payload: { sessionId: string, summary: object }
 *
 * - 'error': Emitted when an error occurs
 *    Payload: { message: string, sessionId?: string }
 */

interface ChatSocket extends Socket {
  userId?: string;
  sessionId?: string;
  role?: string;
  email?: string;
}

interface MessageData {
  content: string;
  sessionId: string;
}

/**
 * Initialize WebSocket server
 */
export const initializeSocketServer = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigins,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  // Authentication middleware for the main namespace
  io.use(async (socket: ChatSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(
          new AppError(
            "Authentication required",
            "AUTHENTICATION_REQUIRED",
            401,
          ),
        );
      }

      // Verify JWT token
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      socket.role = decoded.role;
      socket.email = decoded.email;
      next();
    } catch (error) {
      console.error("Error authenticating socket:", error);
      next(
        new AppError("Invalid authentication token", "INVALID_AUTH_TOKEN", 401),
      );
    }
  });

  // Chat namespace with authentication
  const chatNamespace = io.of("/api/chat");

  // Apply authentication middleware to chat namespace
  chatNamespace.use(async (socket: ChatSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(
          new AppError(
            "Authentication required",
            "AUTHENTICATION_REQUIRED",
            401,
          ),
        );
      }

      // Verify JWT token
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      socket.role = decoded.role;
      socket.email = decoded.email;
      next();
    } catch (error) {
      console.error("Error authenticating socket:", error);
      next(
        new AppError("Invalid authentication token", "INVALID_AUTH_TOKEN", 401),
      );
    }
  });

  chatNamespace.on("connection", (socket: ChatSocket) => {
    // Join session
    socket.on(
      "join-session",
      async (
        sessionId: string,
        userName: string,
        userPosition: string,
        userDepartment: string,
      ) => {
        try {
          if (!socket.userId) {
            throw new AppError(
              "Authentication required",
              "AUTHENTICATION_REQUIRED",
              401,
            );
          }

          const session = await chatService.getChatSession(sessionId);

          // Verify session belongs to user
          if (
            !session.userId.equals(new mongoose.Types.ObjectId(socket.userId))
          ) {
            throw new AppError("Access denied", "ACCESS_DENIED", 403);
          }

          socket.sessionId = sessionId;
          socket.join(sessionId);

          // Send initial greeting if this is a new session with no messages
          if (session.messages.length === 0) {
            const greeting = await chatService.getInitialGreeting(
              sessionId,
              new mongoose.Types.ObjectId(socket.userId),
              userName,
              userPosition,
              userDepartment,
            );

            // Handle streaming greeting
            if (greeting.stream) {
              // Notify frontend that stream is starting
              socket.emit("greeting-stream-start", {
                sessionId,
                messageId: greeting.messageId,
              });
              logger.info(
                `stream object ${Object.getOwnPropertyNames(greeting.stream)}`,
              );

              let greetingContent = "";

              for await (const event of greeting.stream) {
                logger.debug("event streaming started");
                logger.debug(event);
                if (event.type === "response.output_text.delta") {
                  const contentToken = event.delta ?? "";
                  greetingContent += contentToken;
                  socket.emit("greeting-token", {
                    sessionId,
                    messageId: greeting.messageId,
                    token: contentToken,
                  });
                } else if (event.type === "response.content_part.done") {
                  const fullMessage = event.part.text;
                  logger.debug(`message: ${fullMessage}`);
                  await chatService.saveAssistantMessage(
                    sessionId,
                    fullMessage,
                  );
                  socket.emit("greeting-stream-complete", {
                    sessionId,
                    messageId: greeting.messageId,
                    fullMessage: fullMessage,
                  });
                }
              }

              // greeting.stream.on('data', (chunk: { choices: { delta: { content: any; }; }[]; }) => {
              //   // Only emit content chunks (not control messages like [DONE])
              //   if (chunk.choices[0]?.delta?.content) {
              //     const contentToken = chunk.choices[0].delta.content;
              //     greetingContent += contentToken;

              //     // Emit each token to the client immediately
              //     socket.emit('greeting-token', {
              //       sessionId,
              //       messageId: greeting.messageId,
              //       token: contentToken
              //     });
              //   }
              // });

              // greeting.stream.on('end', async () => {
              //   // Save the complete greeting to database
              //   await chatService.saveAssistantMessage(
              //     sessionId,
              //     greetingContent
              //   );

              //   // Emit completion event with full message
              //   socket.emit('greeting-stream-complete', {
              //     sessionId,
              //     messageId: greeting.messageId,
              //     fullMessage: greetingContent
              //   });
              // });

              // greeting.stream.on('error', (error: Error) => {
              //   console.error('Greeting stream error:', error);
              //   socket.emit('error', {
              //     message: 'Error in greeting response stream',
              //     sessionId
              //   });
              // });
            } else {
              // Fallback to non-streaming for backward compatibility
              socket.emit("greeting", {
                messageId: greeting.messageId,
                content: greeting.content,
              });
            }
          }

          socket.emit("session-joined", { sessionId });
        } catch (error) {
          console.error("Error joining session:", error);
          socket.emit("error", {
            message:
              error instanceof Error ? error.message : "Failed to join session",
          });
        }
      },
    );

    // Handle incoming messages
    socket.on("send-message", async (data: MessageData) => {
      try {
        if (!data.sessionId) {
          throw new Error("Authentication required");
        }

        // Save user message
        const { messageId } = await chatService.processChatMessage(
          data.sessionId,
          data.content,
        );
        const sessionId = data.sessionId;

        // Confirm message received
        socket.emit("message-received", { messageId });

        // Generate and stream AI response
        const responseStream = await chatService.generateAssistantResponse(
          data.sessionId,
        );

        let assistantResponse = "";

        // Handle streaming response
        if (responseStream.stream) {
          // Notify frontend that stream is starting
          socket.emit("assistant-stream-start", {
            sessionId: data.sessionId,
          });

          for await (const event of responseStream.stream) {
            logger.debug("event streaming started");
            logger.debug(event);
            if (event.type === "response.output_text.delta") {
              const contentToken = event.delta ?? "";
              assistantResponse += contentToken;
              socket.emit("assistant-token", {
                sessionId,
                messageId: responseStream.messageId,
                token: contentToken,
              });
            } else if (event.type === "response.content_part.done") {
              const fullMessage = event.part.text;
              const { messageId } = await chatService.saveAssistantMessage(
                data.sessionId,
                fullMessage,
              );
              socket.emit("assistant-stream-complete", {
                sessionId,
                messageId: messageId,
                fullMessage: fullMessage,
              });
            }
          }

          // responseStream.stream.on('data', (chunk: { choices: { delta: { content: any; }; }[]; }) => {
          //   // Only emit content chunks (not control messages like [DONE])
          //   if (chunk.choices[0]?.delta?.content) {
          //     const contentToken = chunk.choices[0].delta.content;
          //     assistantResponse += contentToken;

          //     // Emit each token to the client immediately
          //     socket.emit('assistant-token', {
          //       sessionId: data.sessionId,
          //       token: contentToken
          //     });
          //   }
          // });

          // responseStream.stream.on('end', async () => {
          //   // Save the complete response to database
          //   const { messageId } = await chatService.saveAssistantMessage(
          //     data.sessionId,
          //     assistantResponse
          //   );

          //   // Emit completion event with full message and messageId
          //   socket.emit('assistant-stream-complete', {
          //     sessionId: data.sessionId,
          //     messageId,
          //     fullMessage: assistantResponse
          //   });
          // });

          // responseStream.stream.on('error', (error: Error) => {
          //   console.error('Stream error:', error);
          //   socket.emit('error', {
          //     message: 'Error in assistant response stream',
          //     sessionId: data.sessionId
          //   });
          // });
        } else {
          // Handle non-streaming case
          // const nonStreamResponse = responseStream;
          // assistantResponse = nonStreamResponse.choices[0].message.content;
          // // Save the response
          // const { messageId } = await chatService.saveAssistantMessage(
          //   data.sessionId,
          //   assistantResponse
          // );
          // // Send the complete message
          // socket.emit('assistant-message', {
          //   sessionId: data.sessionId,
          //   messageId,
          //   content: assistantResponse
          // });
        }
      } catch (error) {
        console.error("Error processing message:", error);
        socket.emit("error", {
          message:
            error instanceof Error
              ? error.message
              : "Failed to process message",
        });
      }
    });

    // End session
    socket.on("end-session", async (sessionId: string) => {
      try {
        if (!socket.userId) {
          throw new Error("Authentication required");
        }

        const summary = await chatService.endChatSession(sessionId);
        socket.emit("session-ended", {
          sessionId,
          summary,
        });

        socket.leave(sessionId);
        socket.sessionId = undefined;
      } catch (error) {
        console.error("Error ending session:", error);
        socket.emit("error", {
          message:
            error instanceof Error ? error.message : "Failed to end session",
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      logger.debug(
        `User disconnected from chat namespace: ${socket.userId} and session id: ${socket.sessionId}`,
      );

      // Auto-end session if user disconnects while in an active session
      if (socket.sessionId) {
        try {
          await chatService.endChatSession(socket.sessionId);
        } catch (error) {
          console.error("Error ending session on disconnect:", error);
        }
      }
    });
  });

  return io;
};
