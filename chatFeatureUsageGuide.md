# Chat Feature Integration Guide

## Table of Contents

- [Introduction](#introduction)
- [REST API Endpoints](#rest-api-endpoints)
- [WebSocket Integration](#websocket-integration)
- [Event Reference](#event-reference)
- [Implementation Examples](#implementation-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Introduction

This guide provides detailed instructions for frontend developers to integrate with the chat feature API. The chat system offers real-time communication between users and AI agents with token-by-token streaming responses for a natural, conversational experience.

### Key Features

- **Real-time communication** via WebSockets
- **Token-by-token streaming** for smooth typing effect
- **Multi-session support** (TRAINING, EVALUATION, QUICK_PREP)
- **Comprehensive error handling**
- **Authentication integration** using JWT

---

## REST API Endpoints

### Authentication

All API endpoints require authentication using a JWT token:

```http
Authorization: Bearer <your-jwt-token>
```

### 1. Create a Chat Session

Creates a new chat session with a specified agent and session type.

**Endpoint:** `POST /api/chat`  
**Content-Type:** `application/json`

**Request Body:**

```json
{
  "agentId": "string",
  "sessionType": "TRAINING" | "EVALUATION" | "QUICK_PREP"
}
```

**Response (201):**

```json
{
  "message": "Chat session created successfully",
  "data": {
    "sessionId": "string",
    "agentId": "string",
    "sessionType": "string",
    "status": "active"
  }
}
```

### 2. Get a Specific Chat Session

Retrieves details of a specific chat session by ID.

**Endpoint:** `GET /api/chat/{id}`

**Response (200):**

```json
{
  "message": "Chat session retrieved successfully",
  "data": {
    "_id": "string",
    "userId": "string",
    "agentId": "string",
    "sessionType": "string",
    "status": "string",
    "startTime": "ISO-date",
    "endTime": "ISO-date",
    "messages": [...],
    "createdAt": "ISO-date",
    "updatedAt": "ISO-date"
  }
}
```

### 3. List User's Chat Sessions

Returns a paginated list of the user's chat sessions.

**Endpoint:** `GET /api/chat`

**Query Parameters:**

- `page` (integer, default=1)
- `limit` (integer, default=10)

**Response (200):**

```json
{
  "message": "Chat sessions retrieved successfully",
  "data": {
    "sessions": [...],
    "total": 42,
    "page": 1,
    "totalPages": 5
  }
}
```

### 4. End a Chat Session

Ends an active chat session and generates a summary.

**Endpoint:** `POST /api/chat/{id}/end`

**Response (200):**

```json
{
  "message": "Chat session ended successfully",
  "data": {
    "summary": "string"
  }
}
```

---

## WebSocket Integration

### Connection Setup

1. **Initialize the Socket.IO client**:

   ```javascript
   import { io } from "socket.io-client";

   const socket = io("your-backend-url/chat", {
     auth: {
       token: "your-jwt-token",
     },
   });
   ```

2. **Handle connection events**:

   ```javascript
   socket.on("connect", () => {
     console.log("Connected to chat server");
   });

   socket.on("disconnect", () => {
     console.log("Disconnected from chat server");
   });

   socket.on("error", (data) => {
     console.error(`Error: ${data.message}`);
   });
   ```

### Chat Session Workflow

#### Step 1: Join a Session

After creating a session with the REST API, join it via WebSocket:

```javascript
socket.emit(
  "join-session",
  sessionId, // Session ID from the REST API
  userName, // User's name
  userPosition, // User's job title/position
  userDepartment, // User's department
  previousSessionSummary, // Summary from previous session (or empty string)
);

socket.on("session-joined", (data) => {
  console.log(`Successfully joined session: ${data.sessionId}`);
});
```

#### Step 2: Receive Initial Greeting

The system will automatically send a greeting message. Handle it using one of two flows:

##### Streaming Greeting Flow (Recommended)

```javascript
// 1. Greeting stream starts
socket.on("greeting-stream-start", (data) => {
  console.log(`Greeting started for message: ${data.messageId}`);
  // Initialize message UI component
});

// 2. Receive tokens one by one
socket.on("greeting-token", (data) => {
  // Append each token to the UI
  console.log(`Token: ${data.token}`);
});

// 3. Greeting complete
socket.on("greeting-stream-complete", (data) => {
  console.log(`Greeting completed: ${data.fullMessage}`);
  // Finalize message UI
});
```

##### Non-Streaming Greeting (Legacy)

```javascript
socket.on("greeting", (data) => {
  console.log(`Received greeting: ${data.content}`);
  // Display complete message
});
```

#### Step 3: Send a Message

Send user messages to the assistant:

```javascript
socket.emit("send-message", {
  sessionId: "your-session-id",
  content: "Your message text",
});

socket.on("message-received", (data) => {
  console.log(`Message received with ID: ${data.messageId}`);
});
```

#### Step 4: Receive Assistant's Response

Handle the assistant's response in one of two ways:

##### Streaming Response Flow (Recommended)

```javascript
// 1. Response stream starts
socket.on("assistant-stream-start", (data) => {
  console.log(`Assistant response starting for session: ${data.sessionId}`);
  // Initialize response UI component
});

// 2. Receive tokens one by one
socket.on("assistant-token", (data) => {
  // Append token to UI
  console.log(`Token: ${data.token}`);
});

// 3. Response complete
socket.on("assistant-stream-complete", (data) => {
  console.log(`Response completed with ID: ${data.messageId}`);
  console.log(`Full message: ${data.fullMessage}`);
  // Finalize response UI
});
```

##### Non-Streaming Response (Legacy)

```javascript
socket.on("assistant-message", (data) => {
  console.log(`Received message ${data.messageId}: ${data.content}`);
  // Display complete message
});
```

#### Step 5: End the Session

End the conversation when needed:

```javascript
socket.emit("end-session", sessionId);

socket.on("session-ended", (data) => {
  console.log(`Session ${data.sessionId} ended`);
  console.log(`Summary: ${data.summary}`);
  // Update UI to show session ended
});
```

---

## Event Reference

### Client to Server Events

| Event Name     | Payload                                                                       | Description                           |
| -------------- | ----------------------------------------------------------------------------- | ------------------------------------- |
| `join-session` | `(sessionId, userName, userPosition, userDepartment, previousSessionSummary)` | Join an existing chat session         |
| `send-message` | `{ sessionId, content }`                                                      | Send a message in the current session |
| `end-session`  | `sessionId`                                                                   | End the current chat session          |

### Server to Client Events

| Event Name                  | Payload                                 | Description                               |
| --------------------------- | --------------------------------------- | ----------------------------------------- |
| `session-joined`            | `{ sessionId }`                         | Confirmation that user joined the session |
| `greeting-stream-start`     | `{ sessionId, messageId }`              | Initial greeting stream is starting       |
| `greeting-token`            | `{ sessionId, messageId, token }`       | Individual token from greeting stream     |
| `greeting-stream-complete`  | `{ sessionId, messageId, fullMessage }` | Greeting stream completed                 |
| `greeting`                  | `{ messageId, content }`                | Complete greeting (non-streaming)         |
| `message-received`          | `{ messageId }`                         | Confirmation that message was received    |
| `assistant-stream-start`    | `{ sessionId }`                         | Assistant's response stream is starting   |
| `assistant-token`           | `{ sessionId, token }`                  | Individual token from response stream     |
| `assistant-stream-complete` | `{ sessionId, messageId, fullMessage }` | Response stream completed                 |
| `assistant-message`         | `{ sessionId, messageId, content }`     | Complete response (non-streaming)         |
| `session-ended`             | `{ sessionId, summary }`                | Session ended with summary                |
| `error`                     | `{ message, sessionId? }`               | Error notification                        |

---

## Implementation Examples

### TypeScript React Implementation

Here's a simplified example of a React component implementing the chat interface:

```tsx
import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isComplete: boolean;
}

const ChatInterface: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect to WebSocket on component mount
  useEffect(() => {
    const newSocket = io("your-backend-url/chat", {
      auth: { token: localStorage.getItem("jwt") },
    });

    newSocket.on("connect", () => {
      console.log("Connected to chat server");
    });

    newSocket.on("error", (data) => {
      console.error(`Error: ${data.message}`);
      // Show error toast or notification
    });

    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set up event listeners for the session
  useEffect(() => {
    if (!socket || !sessionId) return;

    // Handle greeting stream
    socket.on("greeting-stream-start", (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: data.messageId,
          role: "assistant",
          content: "",
          isComplete: false,
        },
      ]);
    });

    socket.on("greeting-token", (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, content: msg.content + data.token }
            : msg,
        ),
      );
    });

    socket.on("greeting-stream-complete", (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, content: data.fullMessage, isComplete: true }
            : msg,
        ),
      );
    });

    // Handle assistant responses
    socket.on("message-received", (data) => {
      console.log(`Message received with ID: ${data.messageId}`);
    });

    socket.on("assistant-stream-start", () => {
      const tempId = `temp-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          role: "assistant",
          content: "",
          isComplete: false,
        },
      ]);
    });

    socket.on("assistant-token", (data) => {
      setMessages((prev) => {
        // Find the last assistant message (the one that's streaming)
        const lastAssistantIndex = [...prev]
          .reverse()
          .findIndex((m) => m.role === "assistant" && !m.isComplete);

        if (lastAssistantIndex === -1) return prev;

        const realIndex = prev.length - 1 - lastAssistantIndex;

        return prev.map((msg, i) =>
          i === realIndex ? { ...msg, content: msg.content + data.token } : msg,
        );
      });
    });

    socket.on("assistant-stream-complete", (data) => {
      setMessages((prev) => {
        const lastAssistantIndex = [...prev]
          .reverse()
          .findIndex((m) => m.role === "assistant" && !m.isComplete);

        if (lastAssistantIndex === -1) return prev;

        const realIndex = prev.length - 1 - lastAssistantIndex;

        return prev.map((msg, i) =>
          i === realIndex
            ? {
                ...msg,
                id: data.messageId,
                content: data.fullMessage,
                isComplete: true,
              }
            : msg,
        );
      });
    });

    // Handle session ended
    socket.on("session-ended", (data) => {
      console.log(`Session ended with summary: ${data.summary}`);
      // Show summary in UI
    });

    // Clean up listeners
    return () => {
      socket.off("greeting-stream-start");
      socket.off("greeting-token");
      socket.off("greeting-stream-complete");
      socket.off("message-received");
      socket.off("assistant-stream-start");
      socket.off("assistant-token");
      socket.off("assistant-stream-complete");
      socket.off("session-ended");
    };
  }, [socket, sessionId]);

  // Join session
  const joinSession = (id: string) => {
    if (!socket) return;

    socket.emit("join-session", id, "John Doe", "Developer", "Engineering", "");

    socket.on("session-joined", (data) => {
      setSessionId(data.sessionId);
      console.log(`Joined session: ${data.sessionId}`);
    });
  };

  // Send a message
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !sessionId || !input.trim()) return;

    // Add user message to UI immediately
    const userMessageId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: "user",
        content: input,
        isComplete: true,
      },
    ]);

    // Send to server
    socket.emit("send-message", {
      sessionId,
      content: input,
    });

    // Clear input
    setInput("");
  };

  // End the session
  const endSession = () => {
    if (!socket || !sessionId) return;
    socket.emit("end-session", sessionId);
  };

  return (
    <div className="chat-container">
      <div className="messages-container">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
            {!msg.isComplete && msg.role === "assistant" && (
              <div className="typing-indicator">...</div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="message-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={!sessionId}
        />
        <button type="submit" disabled={!sessionId || !input.trim()}>
          Send
        </button>
      </form>

      <div className="session-controls">
        <button onClick={endSession} disabled={!sessionId}>
          End Session
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
```

---

## Best Practices

### Performance Optimization

1. **Efficient DOM Updates**
   - Batch updates when receiving multiple tokens rapidly
   - Use virtual DOM frameworks (React, Vue) for optimal rendering
   - Consider using a text buffer and RAF (requestAnimationFrame) for very fast streams

2. **Memory Management**
   - Clean up event listeners when components unmount
   - Implement pagination for long chat history
   - Consider using a windowing library for very long conversations

### UX Best Practices

1. **Typing Indicators**
   - Show typing indicator during streaming responses
   - Use a subtle animation for a more natural feel

2. **Message States**
   - Indicate message status (sending, sent, received, error)
   - Show clear visual distinction between user and assistant messages

3. **Error Handling**
   - Provide user-friendly error messages
   - Implement automatic retry for transient errors
   - Allow manual resending of failed messages

4. **Accessibility**
   - Ensure chat interface is keyboard navigable
   - Use proper ARIA roles for chat elements
   - Provide text alternatives for any visual feedback

### Security Considerations

1. **Token Management**
   - Securely store JWT tokens
   - Implement token refresh when needed
   - Handle token expiration gracefully

2. **Input Validation**
   - Sanitize user input to prevent XSS attacks
   - Implement rate limiting on the client side
   - Apply reasonable message size limits

---

## Troubleshooting

### Common Issues

| Problem                      | Possible Causes                      | Solutions                                                      |
| ---------------------------- | ------------------------------------ | -------------------------------------------------------------- |
| Connection fails             | Invalid token, network issues        | Check token validity, network connection, try refreshing token |
| No response to messages      | Session timeout, server error        | Check session status, reconnect if needed                      |
| Messages out of order        | Network latency, race conditions     | Implement message sequencing, use timestamps                   |
| Streaming stops unexpectedly | Network interruption, server timeout | Implement reconnection logic, fallback to non-streaming        |

### Debug Checklist

1. Verify WebSocket connection is established
2. Confirm session was created successfully via REST API
3. Check session is joined successfully (`session-joined` event received)
4. Ensure all event listeners are properly set up
5. Verify token is valid and not expired
6. Check for console errors in the browser
7. Test with a simpler client to isolate frontend issues

### Support

For technical support or questions about the chat API implementation, please contact:

- Email: support@yourcompany.com
- Internal Slack: #chat-api-support
