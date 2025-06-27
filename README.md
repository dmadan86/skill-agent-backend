DigitalAgents.io API
A Node.js-based backend for the DigitalAgents.io platform, providing AI-powered training and evaluation services.

## Getting Started

### Prerequisites

Node.js (v14+)
MongoDB

### Installation

```bash
# Install dependencies
npm install
```

# Set up environment variables

```bash
cp .env.example .env
```

# Edit .env with your configuration

## Running the Application

````bash
# Development mode
```bash
npm run dev
````

# Production build

```bash
npm run build
npm start
```

## API Documentation

Interactive API documentation is available at:

http://localhost:5000/api-docs

The OpenAPI specification is also available at:

http://localhost:5000/api-spec.json

## Logging System

The application uses a comprehensive logging system based on Winston for structured logging and debugging.

### Log Levels

- `error`: For critical errors requiring immediate attention
- `warn`: For warnings that might require future attention
- `info`: For important events in normal operation
- `http`: For HTTP request/response logging
- `debug`: For detailed debugging information

### Configuration

Logging can be configured via environment variables:

```
LOG_LEVEL=debug          # Logging level (error, warn, info, http, debug)
LOG_CONSOLE=true         # Enable/disable console logging
LOG_FILE=false           # Enable/disable file logging
LOG_MAX_SIZE=20m         # Maximum log file size before rotation
LOG_MAX_FILES=14d        # Maximum retention period for logs
LOG_DIRECTORY=logs       # Directory for log files
```

In production, file logging is automatically enabled. Log files are rotated daily and stored in the `logs` directory.

### Log Files

When file logging is enabled, the following files are generated:

- `application-YYYY-MM-DD.log`: Contains all logs
- `error-YYYY-MM-DD.log`: Contains only error-level logs

### Structured Logging

All logs follow a structured format to enable easier parsing and analysis:

```json
{
  "level": "info",
  "message": "Server running on port 5000",
  "timestamp": "2023-05-10T12:34:56.789Z"
}
```

Error logs include additional error information and stack traces.
