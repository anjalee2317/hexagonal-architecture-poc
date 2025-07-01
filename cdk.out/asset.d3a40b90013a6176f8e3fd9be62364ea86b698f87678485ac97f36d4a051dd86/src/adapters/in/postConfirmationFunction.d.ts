import { PostConfirmationTriggerEvent } from 'aws-lambda';
/**
 * Lambda handler for Cognito Post Confirmation trigger
 * This adapter handles the post confirmation event from Cognito
 */
export declare const handler: (event: PostConfirmationTriggerEvent) => Promise<PostConfirmationTriggerEvent>;
