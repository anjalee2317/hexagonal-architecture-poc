# Event-Driven Notification Service

This document provides detailed information about the event-driven notification system implemented in the Hexagonal Architecture AWS Amplify Gen 2 project.

## Overview

The notification system uses AWS EventBridge and Lambda to implement an event-driven architecture that decouples notification logic from core business logic. Email notifications are delivered using Amazon SES (Simple Email Service). This approach follows Hexagonal Architecture principles, ensuring clean separation of concerns and making the system more maintainable and extensible.

## Architecture Components

### Infrastructure Layer
- **EventBusConstruct**: A CDK construct that provisions an EventBridge event bus, notification Lambda function, and event rules for different event types.

### Application Layer
- **NotificationUseCase**: An interface defining notification operations.
- **NotificationService**: A service implementing the NotificationUseCase interface, handling notification logic.
- **EmailService**: A service for sending emails using Amazon SES.

### Adapters Layer
- **EventBridgePublisher**: An adapter implementing the EventPublisherPort interface, publishing events to EventBridge.
- **notificationFunction.js**: A Lambda function adapter that processes events from EventBridge and sends notifications.
- **SESEmailAdapter**: An adapter for sending emails using Amazon SES.

## Event Flow

1. **Event Publication**:
   - Domain events (user registration, task creation, task completion) are captured in the application services.
   - The EventPublisherPort is used to publish these events to the EventBridge event bus.

2. **Event Processing**:
   - EventBridge rules match specific event patterns and route them to the notification Lambda function.
   - The notification Lambda processes the events and sends appropriate notifications.

3. **Notification Delivery**:
   - The NotificationService sends notifications based on the event type and content.
   - Email notifications are sent using Amazon SES.
   - Other notification channels can be implemented (SMS, push notifications).

## Event Types

### User Events
- **UserConfirmed**: Triggered when a user confirms their account.
  - Source: `com.taskapp.auth`
  - Detail Type: `UserConfirmed`
  - Payload: `{ username, email, userId, phoneNumber }`

### Task Events
- **TaskCreated**: Triggered when a new task is created.
  - Source: `com.taskapp.tasks`
  - Detail Type: `TaskCreated`
  - Payload: `{ taskId, title, description, userId, createdAt }`

- **TaskCompleted**: Triggered when a task is marked as complete.
  - Source: `com.taskapp.tasks`
  - Detail Type: `TaskCompleted`
  - Payload: `{ taskId, title, userId, completedAt }`

## Implementation Details

### EventBusConstruct

The EventBusConstruct creates and configures the EventBridge event bus and related resources:

```typescript
export class EventBusConstruct extends Construct {
  public readonly eventBus: events.EventBus;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create EventBridge event bus
    this.eventBus = new events.EventBus(this, 'EventBus', {
      eventBusName: `TaskApp-EventBus-${process.env.ENV || 'dev'}`,
    });

    // Create notification Lambda function
    const notificationFunction = new lambda.Function(this, 'NotificationFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'notificationFunction.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist/adapters/in')),
      environment: {
        REGION: this.region,
        DEFAULT_SENDER: 'notifications@example.com', // SES verified email
      },
    });

    // Grant SES permissions to the notification Lambda
    notificationFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'],
    }));

    // Create event rules for different event types
    new events.Rule(this, 'UserConfirmedRule', {
      eventBus: this.eventBus,
      eventPattern: {
        source: ['com.taskapp.auth'],
        detailType: ['UserConfirmed'],
      },
      targets: [new targets.LambdaFunction(notificationFunction)],
    });

    new events.Rule(this, 'TaskEventsRule', {
      eventBus: this.eventBus,
      eventPattern: {
        source: ['com.taskapp.tasks'],
        detailType: ['TaskCreated', 'TaskCompleted'],
      },
      targets: [new targets.LambdaFunction(notificationFunction)],
    });

    // Grant permissions
    this.eventBus.grantPutEventsTo(notificationFunction);
  }
}
```

### Notification Lambda Function with SES Integration

The notification Lambda function processes events from EventBridge and sends email notifications using Amazon SES:

```javascript
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const sesClient = new SESClient({ region: process.env.REGION || 'us-east-1' });
const DEFAULT_SENDER = process.env.DEFAULT_SENDER || 'notifications@example.com';

exports.handler = async (event, context) => {
  console.log('Notification event:', JSON.stringify(event, null, 2));
  
  try {
    const { source, 'detail-type': detailType, detail } = event;
    
    // Handle different event types
    switch (detailType) {
      case 'UserConfirmed':
        await handleUserConfirmed(detail);
        break;
      case 'TaskCreated':
        await handleTaskCreated(detail);
        break;
      case 'TaskCompleted':
        await handleTaskCompleted(detail);
        break;
      default:
        console.log(`Unknown event type: ${detailType}`);
    }
    
    return { statusCode: 200, body: 'Notification processed successfully' };
  } catch (error) {
    console.error('Error processing notification:', error);
    return { statusCode: 500, body: 'Error processing notification' };
  }
};

async function handleUserConfirmed(detail) {
  // Send welcome email notification
  const { username, email } = detail;
  console.log(`Sending welcome email to user: ${username} at ${email}`);
  
  await sendEmail({
    to: email,
    subject: 'Welcome to TaskApp!',
    htmlBody: `
      <h1>Welcome to TaskApp, ${username}!</h1>
      <p>Your account has been successfully confirmed.</p>
      <p>You can now start creating and managing your tasks.</p>
      <p>Thank you for joining us!</p>
    `,
    textBody: `Welcome to TaskApp, ${username}! Your account has been successfully confirmed. You can now start creating and managing your tasks. Thank you for joining us!`
  });
}

async function handleTaskCreated(detail) {
  // Send task creation notification
  const { taskId, title, userId } = detail;
  console.log(`Sending task creation notification for task: ${taskId}`);
  
  // In a real implementation, you would look up the user's email from the userId
  // For this example, we'll assume we have it
  const userEmail = 'user@example.com'; // In production, fetch from DynamoDB or pass in event
  
  await sendEmail({
    to: userEmail,
    subject: 'New Task Created',
    htmlBody: `
      <h1>New Task Created</h1>
      <p>Your task "${title}" has been created successfully.</p>
      <p>Task ID: ${taskId}</p>
      <p>You can view and manage your task in the TaskApp dashboard.</p>
    `,
    textBody: `New Task Created: Your task "${title}" has been created successfully. Task ID: ${taskId}. You can view and manage your task in the TaskApp dashboard.`
  });
}

async function handleTaskCompleted(detail) {
  // Send task completion notification
  const { taskId, title, userId, completedAt } = detail;
  console.log(`Sending task completion notification for task: ${taskId}`);
  
  // In a real implementation, you would look up the user's email from the userId
  // For this example, we'll assume we have it
  const userEmail = 'user@example.com'; // In production, fetch from DynamoDB or pass in event
  
  const formattedDate = new Date(completedAt).toLocaleString();
  
  await sendEmail({
    to: userEmail,
    subject: 'Task Completed',
    htmlBody: `
      <h1>Task Completed</h1>
      <p>Congratulations! Your task "${title}" has been marked as complete.</p>
      <p>Task ID: ${taskId}</p>
      <p>Completed at: ${formattedDate}</p>
      <p>Well done!</p>
    `,
    textBody: `Task Completed: Congratulations! Your task "${title}" has been marked as complete. Task ID: ${taskId}. Completed at: ${formattedDate}. Well done!`
  });
}

async function sendEmail({ to, subject, htmlBody, textBody }) {
  const params = {
    Source: DEFAULT_SENDER,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: {
        Html: { Data: htmlBody },
        Text: { Data: textBody }
      }
    }
  };
  
  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    console.log('Email sent successfully:', response.MessageId);
    return response.MessageId;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
```

## Email Templates

The notification system uses professional HTML email templates for different types of notifications:

### Welcome Email Template

Sent when a user confirms their account, this template includes:
- Personalized greeting with the user's name
- Introduction to the TaskApp features
- Getting started information
- Contact information for support

### Task Creation Email Template

Sent when a user creates a new task, this template includes:
- Task title and description
- Task ID for reference
- Styled task details section
- Information about accessing the task in the dashboard

### Task Completion Email Template

Sent when a user completes a task, this template includes:
- Completion badge
- Task title and ID
- Formatted completion timestamp
- Congratulatory message

## SES Configuration Requirements

Before deploying the notification system, you need to configure AWS SES:

1. **Verify Email Addresses**: In the AWS SES console, verify the sender email address specified in the `DEFAULT_SENDER` environment variable. In production, consider verifying your domain.

2. **SES Sandbox**: By default, new AWS accounts are in the SES sandbox, which restricts you to sending emails only to verified email addresses. For production use, request a move out of the sandbox.

3. **IAM Permissions**: Ensure the notification Lambda has the necessary permissions to send emails via SES, as configured in the EventBusConstruct.

4. **Email Templates**: Consider using SES Template feature for more sophisticated email templates.

## Testing the Notification System

### 1. Deploy the Application

```bash
npm run build
npm run deploy
```

### 2. Verify Email Addresses in SES

```bash
# Use the AWS CLI to verify email addresses
aws ses verify-email-identity --email-address your-verified-email@example.com
```

### 3. Trigger Events

#### User Registration and Confirmation

```bash
# Register a new user
curl -X POST https://f4brxi494m.execute-api.us-east-1.amazonaws.com/prod/auth \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "signUp",
    "username": "testuser",
    "password": "Password123!@#",
    "email": "your-verified-email@example.com",
    "phoneNumber": "+12065551234"
  }'

# Confirm the user (this will trigger the UserConfirmed event)
curl -X POST https://f4brxi494m.execute-api.us-east-1.amazonaws.com/prod/auth \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "confirmSignUp",
    "confirmUsername": "testuser",
    "confirmationCode": "123456"
  }'
```

#### Task Creation and Completion

```bash
# Sign in to get an ID token
curl -X POST https://f4brxi494m.execute-api.us-east-1.amazonaws.com/prod/auth \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "signIn",
    "signInUsername": "testuser",
    "signInPassword": "Password123!@#"
  }'

# Create a task (this will trigger the TaskCreated event)
curl -X POST https://f4brxi494m.execute-api.us-east-1.amazonaws.com/prod/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{
    "title": "Test Task",
    "description": "This is a test task"
  }'

# Complete a task (this will trigger the TaskCompleted event)
curl -X PUT https://f4brxi494m.execute-api.us-east-1.amazonaws.com/prod/tasks/TASK_ID/complete \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

### 4. Monitor Events and Notifications

- **CloudWatch Logs**: Check the logs for the notification Lambda function
- **EventBridge Console**: View events in the event bus
- **SES Console**: Monitor email sending activity, bounces, and complaints

## Extending the Notification System

### Adding New Event Types

1. Define the event structure in the domain layer
2. Update the event publisher to publish the new event type
3. Add a new event rule in the EventBusConstruct
4. Implement a handler for the new event type in the notification Lambda

### Adding New Notification Channels

1. Implement the notification delivery logic in the notification Lambda
2. Configure any required AWS services (e.g., SNS for SMS, FCM for push notifications)
3. Update the handler functions to use the new notification channel

## Monitoring and Troubleshooting

- **CloudWatch Logs**: Monitor Lambda execution and errors
- **EventBridge Console**: Check event delivery and rules
- **SES Console**: Monitor email sending activity, bounces, and complaints
- **CloudWatch Metrics**: Track event processing and notification delivery
- **X-Ray**: Trace event flow through the system (if enabled)

## Best Practices

1. **Error Handling**: Implement robust error handling in the notification Lambda
2. **Retry Logic**: Use DLQ (Dead Letter Queue) for failed event processing
3. **Monitoring**: Set up alarms for notification failures
4. **Testing**: Test the notification system with different event types and scenarios
5. **Email Best Practices**:
   - Include unsubscribe links in marketing emails
   - Follow anti-spam regulations (CAN-SPAM, GDPR)
   - Monitor bounce and complaint rates
   - Use proper email authentication (SPF, DKIM, DMARC)
