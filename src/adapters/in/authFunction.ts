import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthService } from '../../application/services/AuthService';
import { EventBridgePublisher } from '../out/EventBridgePublisher';

/**
 * Environment variables expected to be set in the Lambda function
 */
const USER_POOL_ID = process.env.USER_POOL_ID || '';
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID || '';
const REGION = process.env.REGION || 'us-east-1';
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || '';

// Create event publisher if event bus name is provided
const eventPublisher = EVENT_BUS_NAME ? new EventBridgePublisher(EVENT_BUS_NAME, REGION) : undefined;

/**
 * Lambda handler for authentication operations
 * This adapter handles API Gateway events for authentication operations
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Authentication request received:', JSON.stringify(event));
    
    // Create auth service
    const authService = new AuthService(USER_POOL_ID, USER_POOL_CLIENT_ID, REGION, eventPublisher);
    
    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};
    
    // Get operation from path or body
    const path = event.path;
    const operation = body.operation || getOperationFromPath(path);
    
    let response;
    
    // Route to appropriate operation
    switch (operation) {
      case 'signUp':
        response = await authService.signUp(
          body.username,
          body.password,
          body.email,
          body.phoneNumber
        );
        break;
        
      case 'confirmSignUp':
        await authService.confirmSignUp(
          body.username,
          body.confirmationCode
        );
        response = { message: 'User confirmed successfully' };
        break;
        
      case 'resendConfirmationCode':
        await authService.resendConfirmationCode(body.username);
        response = { message: 'Confirmation code resent successfully' };
        break;
        
      case 'signIn':
        response = await authService.signIn(
          body.username,
          body.password
        );
        break;
        
      case 'respondToMfaChallenge':
        response = await authService.respondToMfaChallenge(
          body.username,
          body.session,
          body.mfaCode
        );
        break;
        
      case 'forgotPassword':
        await authService.forgotPassword(body.username);
        response = { message: 'Password reset initiated successfully' };
        break;
        
      case 'confirmForgotPassword':
        await authService.confirmForgotPassword(
          body.username,
          body.confirmationCode,
          body.newPassword
        );
        response = { message: 'Password reset confirmed successfully' };
        break;
        
      case 'changePassword':
        await authService.changePassword(
          getAuthToken(event),
          body.oldPassword,
          body.newPassword
        );
        response = { message: 'Password changed successfully' };
        break;
        
      case 'getCurrentUser':
        response = await authService.getCurrentUser(getAuthToken(event));
        break;
        
      case 'signOut':
        await authService.signOut(getAuthToken(event));
        response = { message: 'Signed out successfully' };
        break;
        
      case 'refreshTokens':
        response = await authService.refreshTokens(body.refreshToken);
        break;
        
      default:
        return {
          statusCode: 400,
          headers: getCorsHeaders(),
          body: JSON.stringify({ message: 'Invalid operation' })
        };
    }
    
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('Error in authentication handler:', error);
    
    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        message: 'Error processing authentication request',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

/**
 * Extract operation from path
 * @param path API path
 */
function getOperationFromPath(path: string): string {
  const pathSegments = path.split('/');
  const lastSegment = pathSegments[pathSegments.length - 1];
  
  switch (lastSegment) {
    case 'signup':
      return 'signUp';
    case 'confirm':
      return 'confirmSignUp';
    case 'resend-code':
      return 'resendConfirmationCode';
    case 'signin':
      return 'signIn';
    case 'mfa-challenge':
      return 'respondToMfaChallenge';
    case 'forgot-password':
      return 'forgotPassword';
    case 'confirm-forgot-password':
      return 'confirmForgotPassword';
    case 'change-password':
      return 'changePassword';
    case 'user':
      return 'getCurrentUser';
    case 'signout':
      return 'signOut';
    case 'refresh-tokens':
      return 'refreshTokens';
    default:
      return '';
  }
}

/**
 * Extract authorization token from event
 * @param event API Gateway event
 */
function getAuthToken(event: APIGatewayProxyEvent): string {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  if (!authHeader) {
    throw new Error('Authorization header is missing');
  }
  
  // Format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new Error('Invalid authorization header format');
  }
  
  return parts[1];
}

/**
 * Get CORS headers
 */
function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE,PATCH',
    'Content-Type': 'application/json'
  };
}
