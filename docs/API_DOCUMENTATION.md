# API Documentation

## Overview

This document provides detailed information about the REST API endpoints available in the Amplify Gen 2 Hexagonal Architecture PoC. The API follows RESTful principles and uses AWS Cognito for authentication.

## Authentication

All API endpoints require authentication using AWS Cognito. You need to include an `Authorization` header with a valid JWT token:

```
Authorization: Bearer <your-cognito-id-token>
```

To obtain a token, use the Cognito authentication flow as described in the Postman collection.

## Base URL

```
https://f4brxi494m.execute-api.us-east-1.amazonaws.com/prod
```

## API Endpoints

### Task Management

#### List Tasks

```
GET /tasks
```

Retrieves all tasks for the authenticated user.

**Response**

```json
[
  {
    "taskId": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "user123",
    "title": "Complete API documentation",
    "description": "Write comprehensive API docs for the project",
    "completed": false,
    "createdAt": "2023-05-20T14:30:00Z",
    "updatedAt": "2023-05-20T14:30:00Z"
  },
  {
    "taskId": "223e4567-e89b-12d3-a456-426614174001",
    "userId": "user123",
    "title": "Deploy to production",
    "description": "Deploy the application to production environment",
    "completed": true,
    "createdAt": "2023-05-19T10:15:00Z",
    "updatedAt": "2023-05-20T16:45:00Z"
  }
]
```

#### Create Task

```
POST /tasks
```

Creates a new task for the authenticated user.

**Request Body**

```json
{
  "title": "New task title",
  "description": "Detailed description of the task"
}
```

**Response**

```json
{
  "taskId": "323e4567-e89b-12d3-a456-426614174002",
  "userId": "user123",
  "title": "New task title",
  "description": "Detailed description of the task",
  "completed": false,
  "createdAt": "2023-05-21T09:00:00Z",
  "updatedAt": "2023-05-21T09:00:00Z"
}
```

#### Get Task by ID

```
GET /tasks/{taskId}
```

Retrieves a specific task by its ID.

**Response**

```json
{
  "taskId": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "user123",
  "title": "Complete API documentation",
  "description": "Write comprehensive API docs for the project",
  "completed": false,
  "createdAt": "2023-05-20T14:30:00Z",
  "updatedAt": "2023-05-20T14:30:00Z"
}
```

#### Update Task

```
PUT /tasks/{taskId}
```

Updates an existing task.

**Request Body**

```json
{
  "title": "Updated task title",
  "description": "Updated description of the task"
}
```

**Response**

```json
{
  "taskId": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "user123",
  "title": "Updated task title",
  "description": "Updated description of the task",
  "completed": false,
  "createdAt": "2023-05-20T14:30:00Z",
  "updatedAt": "2023-05-21T10:15:00Z"
}
```

#### Delete Task

```
DELETE /tasks/{taskId}
```

Deletes a specific task.

**Response**

204 No Content

#### Complete Task

```
PATCH /tasks/{taskId}/complete
```

Marks a task as complete.

**Response**

```json
{
  "taskId": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "user123",
  "title": "Complete API documentation",
  "description": "Write comprehensive API docs for the project",
  "completed": true,
  "createdAt": "2023-05-20T14:30:00Z",
  "updatedAt": "2023-05-21T11:20:00Z"
}
```

## Email Functionality

The application sends welcome emails to users upon confirmation of their registration. This is handled automatically by the post-confirmation Lambda function.

### Email Templates

Email templates are stored in the `src/templates/email/` directory:

- `welcome-email.html`: HTML version of the welcome email
- `welcome-email.txt`: Plain text version of the welcome email

The templates use placeholders like `{{username}}` and `{{currentYear}}` which are replaced with actual values when the email is sent.

### Testing Email Functionality

To test the email functionality:

1. Register a new user with a verified email address (or verify your email in SES)
2. Confirm the user registration (either through the confirmation code or admin confirmation)
3. Check the specified email inbox for the welcome email

Note: In SES sandbox mode, both sender and recipient email addresses must be verified in SES.

## Error Handling

The API returns appropriate HTTP status codes and error messages in case of failures:

- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

Error responses follow this format:

```json
{
  "message": "Error message describing what went wrong",
  "code": "ERROR_CODE"
}
```

## Using the Postman Collection

A comprehensive Postman collection is provided in the repository to help test all API endpoints and authentication flows:

1. Import the `postman_collection.json` file into Postman
2. Update the collection variables with your specific values:
   - `baseUrl`: API Gateway endpoint URL
   - `region`: AWS region (e.g., `us-east-1`)
   - `userPoolId`: Cognito User Pool ID
   - `clientId`: Cognito App Client ID
   - `email`: Your email address for testing

3. Execute the authentication requests first to obtain valid tokens
4. Use the task management requests to test CRUD operations
5. Use the email testing requests to test welcome email functionality

## Using the OpenAPI Documentation

The API is documented using the OpenAPI 3.0 specification in the `openapi.yaml` file. You can view this file in any OpenAPI-compatible tool such as:

- [Swagger Editor](https://editor.swagger.io/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Redoc](https://redocly.github.io/redoc/)

To view the documentation:

1. Copy the contents of `openapi.yaml`
2. Paste into an online OpenAPI viewer like Swagger Editor
3. Explore the API endpoints, request/response schemas, and authentication requirements
