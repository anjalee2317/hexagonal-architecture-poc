# AWS Amplify Gen 2 Hexagonal Architecture PoC

This project demonstrates a Hexagonal Architecture implementation using AWS Amplify Gen 2 with custom CDK resources, focusing on clean separation of concerns between domain logic and infrastructure.

## Documentation

- [Backend Architecture](./docs/AMPLIFY_BACKEND.md) - Details about the AWS backend infrastructure
- [Deployment Guide](./docs/DEPLOYMENT.md) - Instructions for deploying, running, and testing
- [API Documentation](./openapi.yaml) - OpenAPI/Swagger documentation for the REST API
- [Postman Collection](./postman_collection.json) - Ready-to-use Postman collection for testing

## Project Structure

The project follows a Hexagonal Architecture (Ports and Adapters) pattern with the following layers:

### Domain Layer
- Contains the core business entities and logic
- Independent of any external frameworks or technologies
- Example: `Task` entity with business logic methods

### Application Layer
- Contains use cases and ports (interfaces)
- Input Ports: `TaskUseCase` interface defining operations
- Output Ports: `TaskRepository` interface for persistence
- Services: `TaskService` implementing the use cases

### Adapters Layer
- Input Adapters: `TaskLambdaHandler` for handling API Gateway events
- Output Adapters: `DynamoDBTaskRepository` implementing the repository interface

### Infrastructure
- Custom CDK constructs integrated with Amplify Gen 2
- `TaskApiConstruct` for DynamoDB, Lambda, and API Gateway
- `CognitoConstruct` for User Pool with advanced security features
- `EventBusConstruct` for event-driven notifications

## Features

### Hexagonal Architecture Benefits

- **Separation of Concerns**: Domain logic is isolated from external dependencies
- **Testability**: Business logic can be tested without infrastructure dependencies
- **Flexibility**: Easy to swap implementations (e.g., switch from DynamoDB to another database)
- **Maintainability**: Clear boundaries between layers make the code easier to understand and modify

### AWS Cognito Authentication

- Strong password policies (12+ chars, mixed case, numbers, special chars)
- Optional TOTP MFA (Time-based One-Time Password)
- Account recovery via email
- Advanced security mode for risk-based authentication

### Email Templates and SES Integration

- Externalized email templates for better maintainability
- Separate HTML and plain text versions for maximum compatibility
- Template utility for loading and rendering with dynamic content
- AWS SES integration for sending personalized emails
- Post-confirmation trigger for welcome emails to new users

### Event-Driven Architecture

- Custom EventBridge event bus for decoupled event handling
- Event publishing for key domain events:
  - User registration events
  - Task creation events
  - Task completion events
- Clean separation between business logic and notification concerns

### API Documentation and Testing

- OpenAPI/Swagger documentation for all API endpoints
- Comprehensive Postman collection for testing all features
- Authentication flows with Cognito included in Postman collection
- Email testing endpoints for verifying SES integration

## Additional Documentation

More detailed documentation is available in the `docs` folder:

- [**Amplify Backend**](./docs/AMPLIFY_BACKEND.md) - Details about the AWS Amplify Gen 2 backend infrastructure
- [**Cognito Authentication**](./docs/COGNITO.md) - User authentication setup and configuration
- [**Post-Confirmation Triggers**](./docs/POST_CONFIRMATION_TRIGGERS.md) - Implementation of Cognito post-confirmation Lambda triggers
- [**Event-Driven Notification**](./docs/EVENT_DRIVEN_NOTIFICATION.md) - EventBridge-based notification system architecture
- [**Deployment Guide**](./docs/DEPLOYMENT.md) - Comprehensive instructions for building and deploying the application

## Quick Start

### Prerequisites

- Node.js v18.x or later
- AWS CLI configured with appropriate credentials
- AWS CDK v2 installed (`npm install -g aws-cdk`)

### Deployment

```bash
# Install dependencies
npm install

# Build the project
npm run prebuild
npx tsc --skipLibCheck

# Deploy to AWS
npm run cdk:deploy
```

See the [Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions.

## Backend Resources

After deployment, the following resources are created:

- **Cognito User Pool**: Authentication service
- **API Gateway**: RESTful API for task management
- **Lambda Functions**: Serverless business logic
- **DynamoDB Tables**: Data storage for users and tasks
- **EventBridge**: Event bus for notifications
- **SES**: Email sending service for notifications

See the [Backend Architecture](./docs/AMPLIFY_BACKEND.md) for detailed information.

## License

MIT
