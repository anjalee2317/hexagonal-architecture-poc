import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBTaskRepository } from '../out/DynamoDBTaskRepository';
import { TaskService } from '../../application/services/TaskService';
import { TaskLambdaHandler } from './TaskLambdaHandler';
import { EventBridgePublisher } from '../out/EventBridgePublisher';

/**
 * Environment variables expected to be set in the Lambda function
 */
const REGION = process.env.REGION || 'us-east-1';
const TABLE_NAME = process.env.TASK_TABLE_NAME || '';
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || '';

// Wire up the dependencies using dependency injection
const taskRepository = new DynamoDBTaskRepository(REGION, TABLE_NAME);
const eventPublisher = EVENT_BUS_NAME ? new EventBridgePublisher(EVENT_BUS_NAME, REGION) : undefined;
const taskService = new TaskService(taskRepository, eventPublisher);
const taskHandler = new TaskLambdaHandler(taskService);

/**
 * Lambda function handler
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event received:', JSON.stringify(event, null, 2));
  
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE,PATCH'
      },
      body: ''
    };
  }
  
  return taskHandler.handle(event);
};
