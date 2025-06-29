import swaggerJsdoc from "swagger-jsdoc";
import { version } from "../../../package.json";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DigitalAgents.io API Documentation",
      version,
      description: "API documentation for the DigitalAgents.io platform",
      license: {
        name: "Proprietary",
      },
      contact: {
        name: "DigitalAgents.io Support",
        email: "support@digitalagents.io",
      },
    },
    servers: [
      {
        url: "/api",
        description: "API Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  example: "AUTH_INVALID_CREDENTIALS",
                },
                message: {
                  type: "string",
                  example: "Invalid email or password",
                },
                status: {
                  type: "number",
                  example: 401,
                },
                details: {
                  type: "object",
                  example: null,
                },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "60d21b4667d0d8992e610c85",
            },
            email: {
              type: "string",
              example: "user@example.com",
            },
            firstName: {
              type: "string",
              example: "John",
            },
            lastName: {
              type: "string",
              example: "Doe",
            },
            role: {
              type: "string",
              enum: ["admin", "manager", "employee"],
              example: "employee",
            },
            department: {
              type: "string",
              example: "Sales",
            },
            position: {
              type: "string",
              example: "Sales Representative",
            },
            profilePicture: {
              type: "string",
              example: "/uploads/profile-pictures/1234567890.jpg",
              description: "URL to the user profile picture",
            },
            passwordChangeRequired: {
              type: "boolean",
              example: false,
              description:
                "Indicates if the user needs to change their password",
            },
          },
        },
        Agent: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "60d21b4667d0d8992e610c86",
            },
            name: {
              type: "string",
              example: "Sales Training Agent",
            },
            type: {
              type: "string",
              enum: ["Training", "Evaluation", "Simulation", "Onboarding"],
              example: "Training",
            },
            description: {
              type: "string",
              example: "AI agent for sales training and onboarding",
            },
            industry: {
              type: "string",
              example: "Retail",
            },
            content: {
              type: "string",
              example: "This agent is configured to provide sales training...",
            },
            instructions: {
              type: "string",
              example: "Optional instructions for using this agent",
            },
            owner: {
              type: "string",
              example: "60d21b4667d0d8992e610c85",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2023-01-01T00:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2023-01-01T00:00:00.000Z",
            },
          },
        },
        AgentInput: {
          type: "object",
          required: ["name", "type", "description", "industry", "content"],
          properties: {
            name: {
              type: "string",
              example: "Sales Training Agent",
            },
            type: {
              type: "string",
              enum: ["Training", "Evaluation", "Simulation", "Onboarding"],
              example: "Training",
            },
            description: {
              type: "string",
              example: "AI agent for sales training and onboarding",
            },
            industry: {
              type: "string",
              example: "Retail",
            },
            content: {
              type: "string",
              example: "This agent is configured to provide sales training...",
            },
            instructions: {
              type: "string",
              example: "Optional instructions for using this agent",
            },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Agent",
              },
            },
            meta: {
              type: "object",
              properties: {
                total: {
                  type: "integer",
                  example: 10,
                },
                page: {
                  type: "integer",
                  example: 1,
                },
                limit: {
                  type: "integer",
                  example: 10,
                },
                totalPages: {
                  type: "integer",
                  example: 1,
                },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Authentication information is missing or invalid",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        ForbiddenError: {
          description: "User does not have permission to access this resource",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        NotFoundError: {
          description: "The requested resource was not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/features/*/routes.ts", "./src/features/*/swagger.ts"], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
