import { PostConfirmationTriggerEvent } from 'aws-lambda';
import { UserService } from '../../application/services/UserService';
import { DynamoDBUserRepository } from '../out/DynamoDBUserRepository';
import { EventBridgePublisher } from '../out/EventBridgePublisher';

/**
 * Environment variables expected to be set in the Lambda function
 */
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || '';
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || '';
const REGION = process.env.REGION || 'us-east-1';

// Create event publisher if event bus name is provided
const eventPublisher = EVENT_BUS_NAME ? new EventBridgePublisher(EVENT_BUS_NAME, REGION) : undefined;

/**
 * Lambda handler for Cognito Post Confirmation trigger
 * This adapter handles the post confirmation event from Cognito
 */
export const handler = async (event: PostConfirmationTriggerEvent): Promise<PostConfirmationTriggerEvent> => {
  try {
    console.log('Post confirmation event received:', JSON.stringify(event));
    
    // Extract user data from the event
    const { userName, request } = event;
    const { userAttributes } = request;
    
    // Create user repository
    const userRepository = new DynamoDBUserRepository(USER_TABLE_NAME, REGION);
    
    // Create user service
    const userService = new UserService(userRepository, eventPublisher);
    
    // Process the confirmed user
    await userService.createUserProfile({
      userId: userName,
      email: userAttributes.email,
      phoneNumber: userAttributes.phone_number,
      createdAt: new Date().toISOString(),
      preferences: {
        notifications: true,
        theme: 'light'
      }
    });
    
    console.log(`User profile created for ${userName}`);
    
    // Return the event to continue the authentication flow
    return event;
  } catch (error) {
    console.error('Error in post confirmation handler:', error);
    
    // Important: We still return the event to allow the user to be confirmed
    // even if our additional processing fails
    return event;
  }
};
