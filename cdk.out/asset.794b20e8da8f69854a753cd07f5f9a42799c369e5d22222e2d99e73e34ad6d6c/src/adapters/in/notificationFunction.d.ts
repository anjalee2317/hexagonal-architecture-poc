import { EventBridgeEvent } from 'aws-lambda';
/**
 * Lambda function handler for processing notification events from EventBridge
 * @param event EventBridge event
 */
export declare const handler: (event: EventBridgeEvent<string, any>) => Promise<void>;
