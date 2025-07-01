# AWS Cognito Authentication Implementation

This document provides detailed information about the AWS Cognito authentication implementation in the Hexagonal Architecture AWS Amplify Gen 2 project.

## Overview

The authentication system uses AWS Cognito User Pools with advanced security features to provide a robust, secure authentication mechanism for the application. The implementation follows Hexagonal Architecture principles, maintaining a clean separation between business logic and infrastructure.

## Architecture Components

### Infrastructure Layer
- **CognitoConstruct**: A CDK construct that provisions and configures the Cognito User Pool, User Pool Client, and Identity Pool with appropriate security settings.

### Application Layer
- **AuthUseCase**: An interface defining all authentication operations (sign-up, sign-in, MFA, password reset, etc.).
- **AuthService**: A service implementing the AuthUseCase interface, handling authentication logic using Cognito.

### Adapters Layer
- **authFunction.ts**: A Lambda function adapter that routes API Gateway requests to the appropriate AuthService methods.

## Security Features

The Cognito User Pool is configured with the following security features:

1. **Username Configuration**
   - Case-sensitive usernames to prevent enumeration attacks

2. **Password Policies**
   - Minimum length: 12 characters
   - Requires uppercase letters
   - Requires lowercase letters
   - Requires numbers
   - Requires special characters
   - Password history: Prevents reuse of last 12 passwords

3. **Multi-Factor Authentication (MFA)**
   - Optional TOTP (Time-based One-Time Password) MFA
   - Authenticator app support (Google Authenticator, Microsoft Authenticator, etc.)
   - SMS MFA disabled to avoid deployment conflicts

4. **Account Protection**
   - Temporary password expiry: 24 hours
   - Advanced security mode enabled for risk-based authentication
   - Email verification required

5. **Account Recovery**
   - Email-based account recovery

## API Endpoints

The authentication API is exposed through a dedicated API Gateway endpoint:

- **POST /auth**: Handles all authentication operations based on the `operation` field in the request body.

### Available Operations

1. **signUp**: Register a new user
2. **confirmSignUp**: Confirm registration with verification code
3. **signIn**: Sign in a user
4. **setupTOTP**: Set up TOTP MFA for a user
5. **verifyTOTP**: Verify and enable TOTP MFA
6. **forgotPassword**: Initiate password reset
7. **confirmForgotPassword**: Complete password reset
8. **refreshToken**: Refresh authentication tokens
9. **getUserInfo**: Get user profile information

## Usage Examples

### Sign Up

```bash
curl -X POST https://your-api-id.execute-api.region.amazonaws.com/prod/auth \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "signUp",
    "username": "testuser",
    "password": "Password123!@#",
    "email": "user@example.com",
    "phoneNumber": "+12065551234"
  }'
```

### Confirm Sign Up

```bash
curl -X POST https://your-api-id.execute-api.region.amazonaws.com/prod/auth \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "confirmSignUp",
    "confirmUsername": "testuser",
    "confirmationCode": "123456"
  }'
```

### Sign In

```bash
curl -X POST https://your-api-id.execute-api.region.amazonaws.com/prod/auth \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "signIn",
    "signInUsername": "testuser",
    "signInPassword": "Password123!@#"
  }'
```

### Setup TOTP MFA

```bash
curl -X POST https://your-api-id.execute-api.region.amazonaws.com/prod/auth \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{
    "operation": "setupTOTP"
  }'
```

### Verify TOTP MFA

```bash
curl -X POST https://your-api-id.execute-api.region.amazonaws.com/prod/auth \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{
    "operation": "verifyTOTP",
    "totpCode": "123456"
  }'
```

## Protected API Access

Once authenticated, you can access protected API endpoints using the ID token returned from the authentication process:

```bash
curl -X GET https://your-api-id.execute-api.region.amazonaws.com/prod/tasks \
  -H "Authorization: <ID_TOKEN_FROM_COGNITO>"
```

## Implementation Details

### CognitoConstruct (CDK)

The `CognitoConstruct` in the infrastructure layer provisions:

1. A Cognito User Pool with advanced security settings
2. A User Pool Client for application integration
3. An Identity Pool with appropriate IAM roles
4. Cognito triggers for custom authentication flows (if needed)

### AuthService

The `AuthService` implements the `AuthUseCase` interface and:

1. Validates input parameters
2. Calls Cognito APIs using AWS SDK
3. Handles authentication challenges and responses
4. Manages token refresh and validation
5. Publishes authentication events to EventBridge

### Integration with API Gateway

The API Gateway is configured with a Cognito User Pools authorizer that:

1. Validates JWT tokens from Cognito
2. Extracts user claims for authorization
3. Protects task API endpoints
4. Allows public access to authentication endpoints

## Security Considerations

1. **Token Storage**: Store tokens securely on the client side (e.g., HttpOnly cookies or secure storage)
2. **Token Validation**: Always validate tokens on the server side
3. **HTTPS**: Always use HTTPS for API communication
4. **MFA**: Enforce MFA for sensitive operations
5. **Rate Limiting**: Consider implementing rate limiting for authentication endpoints
6. **Monitoring**: Monitor authentication attempts and set up alerts for suspicious activities

## Deployment

The Cognito resources are deployed as part of the main CDK stack. After deployment, you can find the Cognito User Pool ID, Client ID, and Identity Pool ID in the CloudFormation outputs.
