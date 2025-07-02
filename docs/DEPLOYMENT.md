# Deployment, Running, and Testing Guide

This document provides comprehensive instructions for deploying, running, and testing the AWS Amplify Gen 2 Hexagonal Architecture project.

## Deployment

### Prerequisites

- Node.js v18.x or later
- AWS CLI configured with appropriate credentials
- AWS CDK v2 installed (`npm install -g aws-cdk`)
- AWS SES verified sender email address

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Bootstrap CDK (First-time only)

If this is your first time using CDK in this AWS account/region:

```bash
npm run cdk:bootstrap
```

### Step 3: Build the Project

```bash
# Clean the dist directory
npm run prebuild

# Compile TypeScript with skipLibCheck to avoid dependency conflicts
npx tsc --skipLibCheck
```

### Step 4: Deploy to AWS

#### Development Environment

```bash
npm run cdk:deploy
```

#### Production Environment

```bash
npm run cdk:deploy:prod
```

### Step 5: Note the Outputs

After deployment completes, note the following outputs:

- Cognito User Pool ID
- Cognito User Pool Client ID
- API Gateway Endpoint URL
- Event Bus ARN

### Step 6: Configure SES

1. Verify your sender email address in SES:

```bash
aws ses verify-email-identity --email-address your-email@example.com
```

2. If you're in SES sandbox mode (default for new accounts), verify recipient email addresses too:

```bash
aws ses verify-email-identity --email-address recipient@example.com
```

3. Update the Lambda environment variable for the sender email:

```bash
aws lambda update-function-configuration \
  --function-name TaskApp-dev-CognitoPostConfirmationFunctionA497728-* \
  --environment "Variables={USER_TABLE_NAME=TaskApp-Users-dev,EVENT_BUS_NAME=task-event-bus-dev,REGION=us-east-1,FROM_EMAIL=your-verified-email@example.com}"
```

## Running the Application

### Backend Services

The backend services are fully managed by AWS and run automatically after deployment:

- Cognito User Pool for authentication
- API Gateway for the REST API
- Lambda functions for business logic
- DynamoDB for data storage
- EventBridge for event processing
- SES for email sending

### Frontend Integration

To integrate a frontend application with this backend:

1. Install the Amplify libraries:

```bash
npm install aws-amplify
```

2. Configure Amplify in your frontend app:

```javascript
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_RavpYb3b1',
    userPoolWebClientId: '5d4prm92sno68iofpjo0u0ul8c'
  },
  API: {
    endpoints: [
      {
        name: 'TaskAPI',
        endpoint: 'https://f4brxi494m.execute-api.us-east-1.amazonaws.com/prod'
      }
    ]
  }
});
```

## Testing the Application

### Authentication Testing

#### 1. Register a User

```javascript
import { Auth } from 'aws-amplify';

async function signUp(username, password, email, phoneNumber) {
  try {
    const { user } = await Auth.signUp({
      username,
      password,
      attributes: {
        email,
        phone_number: phoneNumber
      }
    });
    console.log('User successfully registered:', user);
    return user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
}
```

#### 2. Confirm Registration

```javascript
async function confirmSignUp(username, code) {
  try {
    await Auth.confirmSignUp(username, code);
    console.log('User confirmed successfully');
    // At this point, the post-confirmation Lambda will send a welcome email
  } catch (error) {
    console.error('Error confirming user:', error);
    throw error;
  }
}
```

#### 3. Sign In

```javascript
async function signIn(username, password) {
  try {
    const user = await Auth.signIn(username, password);
    console.log('User signed in successfully:', user);
    return user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}
```

#### 4. Setup MFA (Optional)

```javascript
async function setupTOTP() {
  try {
    const code = await Auth.setupTOTP();
    // Convert to QR code URL for display
    const qrCodeURL = `otpauth://totp/TaskApp:${username}?secret=${code}&issuer=TaskApp`;
    console.log('TOTP setup code:', code);
    return { code, qrCodeURL };
  } catch (error) {
    console.error('Error setting up TOTP:', error);
    throw error;
  }
}

async function verifyTOTP(code) {
  try {
    await Auth.verifyTotpToken(user, code);
    await Auth.setPreferredMFA(user, 'TOTP');
    console.log('TOTP verified and set as preferred MFA');
  } catch (error) {
    console.error('Error verifying TOTP:', error);
    throw error;
  }
}
```

### API Testing

#### 1. Create a Task

```javascript
import { API } from 'aws-amplify';

async function createTask(title, description) {
  try {
    const task = await API.post('TaskAPI', '/tasks', {
      body: {
        title,
        description
      }
    });
    console.log('Task created:', task);
    return task;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}
```

#### 2. Get All Tasks

```javascript
async function getTasks() {
  try {
    const tasks = await API.get('TaskAPI', '/tasks');
    console.log('Tasks retrieved:', tasks);
    return tasks;
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
}
```

#### 3. Get a Specific Task

```javascript
async function getTask(taskId) {
  try {
    const task = await API.get('TaskAPI', `/tasks/${taskId}`);
    console.log('Task retrieved:', task);
    return task;
  } catch (error) {
    console.error('Error getting task:', error);
    throw error;
  }
}
```

#### 4. Complete a Task

```javascript
async function completeTask(taskId) {
  try {
    const task = await API.patch('TaskAPI', `/tasks/${taskId}/complete`);
    console.log('Task completed:', task);
    return task;
  } catch (error) {
    console.error('Error completing task:', error);
    throw error;
  }
}
```

### Testing Email Templates

#### 1. Testing Welcome Emails

To test the welcome email functionality:

1. Register a new user in Cognito
2. Confirm the user (either via confirmation code or admin API)
3. Check the recipient's inbox for the welcome email

```bash
# Register a new user
aws cognito-idp sign-up \
  --client-id 5d4prm92sno68iofpjo0u0ul8c \
  --username test-user \
  --password "StrongPassword123!" \
  --user-attributes Name=email,Value=your-verified-email@example.com

# Confirm the user (as admin)
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id us-east-1_RavpYb3b1 \
  --username test-user
```

#### 2. Checking Email Logs

To check if emails were sent successfully, view the Lambda function logs:

```bash
aws logs filter-log-events \
  --log-group-name "/aws/lambda/TaskApp-dev-CognitoPostConfirmationFunctionA497728-*" \
  --filter-pattern "welcome email"
```

### Testing with Postman or cURL

For testing without a frontend, you can use Postman or cURL with JWT tokens:

1. Get an ID token using the Amplify Auth library or the Cognito Hosted UI
2. Use the token in API requests:

```bash
curl -X POST https://f4brxi494m.execute-api.us-east-1.amazonaws.com/prod/tasks \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","description":"This is a test task"}'
```

### Monitoring and Debugging

#### CloudWatch Logs

- Lambda function logs: Check execution details and errors
  - Navigate to CloudWatch > Log groups > `/aws/lambda/TaskApp-*`

#### DynamoDB Tables

- View stored tasks and user data
  - Navigate to DynamoDB > Tables > `TaskApp-*`

#### EventBridge

- Monitor events in the task-event-bus-dev event bus
  - Navigate to EventBridge > Event buses > `task-event-bus-dev`

#### SES

- Check email sending statistics and bounce/complaint rates
  - Navigate to SES > Email sending > Sending statistics
- Verify email identities
  - Navigate to SES > Configuration > Verified identities

## Cleanup

When you're done testing, you can delete all AWS resources:

```bash
npm run cdk:destroy
```

This will remove all AWS resources created for this project.
