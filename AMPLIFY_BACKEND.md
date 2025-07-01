# AWS Amplify Gen 2 Backend Architecture

This document outlines the backend architecture of the AWS Amplify Gen 2 project implementing Hexagonal Architecture for a task management system.

## Backend Architecture Overview

The backend is built using AWS Amplify Gen 2 with custom CDK constructs, following a Hexagonal Architecture pattern that separates business logic from infrastructure concerns.

### Key Components

#### 1. Authentication (Cognito)

- **User Pool ID**: `us-east-1_RavpYb3b1`
- **User Pool Client ID**: `5d4prm92sno68iofpjo0u0ul8c`
- **Identity Pool ID**: `us-east-1:44fdae6e-39a9-4f5d-8201-5a6df21c96c8`
- **User Table**: `TaskApp-Users-dev`

**Security Features**:
- Strong password policies (12+ chars, mixed case, numbers, special chars)
- Optional TOTP MFA (Time-based One-Time Password)
- Account recovery via email
- Advanced security mode for risk-based authentication

#### 2. Task API

- **API Endpoint**: `https://f4brxi494m.execute-api.us-east-1.amazonaws.com/prod/`
- **Task Table**: `TaskApp-dev-TaskApiTaskTable8901E7AD-1208169PLM5XD`

**API Endpoints**:
- `POST /tasks` - Create a new task
- `GET /tasks` - List all tasks
- `GET /tasks/{id}` - Get a specific task
- `PATCH /tasks/{id}` - Update a task
- `DELETE /tasks/{id}` - Delete a task
- `PATCH /tasks/{id}/complete` - Mark a task as complete

#### 3. Email Service (SES)

- **Sender Email**: `anjalee@smashtaps.com` (verified in SES)
- **Email Templates**: Located in `src/templates/email/`
  - `welcome-email.html` - HTML version of the welcome email
  - `welcome-email.txt` - Plain text version of the welcome email

**Template Features**:
- Dynamic content with placeholder substitution
- Responsive HTML design for various email clients
- Plain text fallback for maximum compatibility
- Template loading and rendering utilities in `src/utils/templateUtils.js`

#### 4. Event Bus

- **Event Bus Name**: `task-event-bus-dev`
- **Event Bus ARN**: `arn:aws:events:us-east-1:265613951253:event-bus/task-event-bus-dev`
- **Notification Lambda**: `TaskApp-dev-EventBusNotificationFunction536AC88F-n6sh6UeYxVxe`

**Event Types**:
- `UserConfirmed` - Triggered when a user confirms their account
- `TaskCreated` - Triggered when a new task is created
- `TaskCompleted` - Triggered when a task is marked as complete

### Infrastructure Components

#### CDK Constructs

1. **CognitoConstruct**:
   - Defines Cognito User Pool with advanced security features
   - Configures post-confirmation Lambda trigger
   - Creates DynamoDB table for user data
   - Sets up SES permissions for email sending

2. **TaskApiConstruct**:
   - Creates API Gateway REST API
   - Defines Lambda functions for task operations
   - Sets up DynamoDB table for task storage
   - Configures IAM permissions

3. **EventBusConstruct**:
   - Creates EventBridge event bus
   - Defines event rules for different event types
   - Sets up notification Lambda function

#### Lambda Functions

1. **Post-Confirmation Function**:
   - Triggered after a user confirms their account
   - Stores user data in DynamoDB
   - Publishes UserConfirmed event to EventBridge
   - Sends personalized welcome email using SES and external templates

2. **Task Lambda Handler**:
   - Handles API Gateway requests for task operations
   - Implements the hexagonal architecture pattern
   - Publishes task-related events to EventBridge

3. **Notification Function**:
   - Processes events from EventBridge
   - Sends notifications based on event type

## Hexagonal Architecture Implementation

The backend follows a strict Hexagonal Architecture pattern:

### Domain Layer
- Contains the Task entity with business logic methods like complete(), updateTitle(), etc.

### Application Layer
- **Input Ports**: TaskUseCase interface defining operations like createTask, getTask, etc.
- **Output Ports**: TaskRepository interface for persistence operations
- **Services**: TaskService implementing the TaskUseCase interface

### Adapters Layer
- **Input Adapters**: TaskLambdaHandler for handling API Gateway events
- **Output Adapters**: DynamoDBTaskRepository implementing the TaskRepository interface
- **Email Adapters**: Template utilities for loading and rendering email templates

### Infrastructure
- Custom CDK constructs integrated with Amplify Gen 2

## Environment Variables

- `USER_TABLE_NAME`: DynamoDB table name for user data
- `EVENT_BUS_NAME`: EventBridge event bus name
- `REGION`: AWS region for SDK clients
- `FROM_EMAIL`: Verified SES sender email address

## Deployment Configuration

The backend is deployed using AWS CDK with TypeScript. The deployment process is managed through npm scripts in package.json:

```json
{
  "scripts": {
    "cdk:bootstrap": "npx cdk bootstrap",
    "cdk:deploy": "npx cdk deploy --require-approval never",
    "cdk:deploy:prod": "NODE_ENV=production npx cdk deploy --require-approval never",
    "cdk:destroy": "npx cdk destroy"
  }
}
```

See DEPLOYMENT.md for detailed deployment instructions.
