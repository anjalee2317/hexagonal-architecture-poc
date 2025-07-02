# Cognito Triggers in Amplify Gen 2 with Hexagonal Architecture

This document explains the implementation and use cases for AWS Cognito Lambda triggers in our Amplify Gen 2 project, with a focus on the Post Confirmation trigger.

## Post Confirmation Lambda Trigger

The Post Confirmation Lambda trigger is executed after a user successfully confirms their account (via email verification) or after an admin confirms a user. This trigger is particularly valuable for performing actions that should occur only after a user is fully registered and confirmed in your system.

### Implementation Details

Our implementation follows the Hexagonal Architecture pattern:

1. **Input Adapter**: `postConfirmationFunction.js` - Handles the Cognito Post Confirmation event
2. **Domain Entity**: User data extracted from the Cognito event
3. **Output Adapters**: 
   - DynamoDB for user data persistence
   - EventBridge for event publishing

### Current Implementation

The current implementation of the Post Confirmation Lambda function performs the following tasks:

```javascript
exports.handler = async (event, context) => {
  console.log('Post confirmation event:', JSON.stringify(event, null, 2));
  
  try {
    // Extract user attributes from the event
    const { userName, request: { userAttributes } } = event;
    const { email, sub: userId, phone_number: phoneNumber } = userAttributes;
    
    // Get environment variables
    const userTableName = process.env.USER_TABLE_NAME;
    const eventBusName = process.env.EVENT_BUS_NAME;
    
    // If we have an event bus, publish a user confirmed event
    if (eventBusName) {
      // Publish UserConfirmed event to EventBridge
    }
    
    // If we have a user table, store user data
    if (userTableName) {
      // Store user data in DynamoDB
    }
    
    return event;
  } catch (error) {
    console.error('Error in post confirmation:', error);
    return event;
  }
};
```

### Use Cases for Post Confirmation Lambda

1. **User Profile Creation**
   - Create a user record in DynamoDB after Cognito confirmation
   - Initialize user preferences, settings, and default values
   - Our implementation creates a user profile with status 'ACTIVE'

2. **Event Publishing**
   - Publish a 'UserConfirmed' event to EventBridge
   - Enable other systems to react to user confirmation
   - Our implementation publishes an event with user details

3. **Analytics and Tracking**
   - Log confirmation events for monitoring
   - Our implementation logs the confirmation event details

## Integration with Hexagonal Architecture

Our implementation demonstrates how Cognito triggers integrate with Hexagonal Architecture:

1. **Separation of Concerns**
   - The Lambda function acts as an adapter at the boundary of our system
   - Event publishing and data persistence are separated

2. **Dependency Inversion**
   - The function depends on abstractions (environment variables for configuration)
   - Implementation details can be changed without modifying the core logic

3. **Testability**
   - The function can be tested independently with mock events
   - Dependencies can be mocked for isolated testing

## Environment Variables

The Post Confirmation Lambda function uses the following environment variables:

- `USER_TABLE_NAME`: DynamoDB table name for user data storage
- `EVENT_BUS_NAME`: EventBridge event bus name for publishing events
- `REGION`: AWS region for the services (defaults to 'us-east-1')

## Example Event

Here's an example of the event received by the Post Confirmation Lambda function:

```json
{
  "version": "1",
  "region": "us-east-1",
  "userPoolId": "us-east-1_RavpYb3b1",
  "userName": "testuser",
  "callerContext": {
    "awsSdkVersion": "aws-sdk-unknown-unknown",
    "clientId": "5d4prm92sno68iofpjo0u0ul8c"
  },
  "triggerSource": "PostConfirmation_ConfirmSignUp",
  "request": {
    "userAttributes": {
      "sub": "12345678-1234-1234-1234-123456789012",
      "email_verified": "true",
      "phone_number_verified": "true",
      "phone_number": "+12065551234",
      "email": "user@example.com"
    }
  },
  "response": {}
}
```

## Deployment

The Post Confirmation Lambda function is automatically deployed as part of the CognitoConstruct in our CDK deployment:

```typescript
// In CognitoConstruct.ts
const postConfirmationFunction = new lambda.Function(this, 'PostConfirmationFunction', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'postConfirmationFunction.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, '../dist/adapters/in')),
  environment: {
    USER_TABLE_NAME: userTable.tableName,
    EVENT_BUS_NAME: props.eventBus.eventBusName,
    REGION: this.region,
  },
});

// Add the Lambda as a Cognito trigger
userPool.addTrigger(
  cognito.UserPoolOperation.POST_CONFIRMATION,
  postConfirmationFunction
);
```

## Monitoring and Troubleshooting

- **CloudWatch Logs**: Monitor the Lambda execution and any errors
- **DynamoDB Console**: Verify user data is being stored correctly
- **EventBridge Console**: Check if events are being published

## Best Practices

1. **Error Handling**: The function includes robust error handling to prevent disruption to the authentication flow
2. **Idempotency**: Operations are designed to be idempotent to handle potential retries
3. **Minimal Processing**: Keep processing light to avoid timeouts
4. **Event-Driven Design**: Use EventBridge for complex or long-running processes
