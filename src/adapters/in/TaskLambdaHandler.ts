import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TaskUseCase } from '../../application/ports/in/TaskUseCase';

/**
 * Lambda handler adapter for the TaskUseCase input port
 */
export class TaskLambdaHandler {
  constructor(private readonly taskUseCase: TaskUseCase) {}

  /**
   * Handle API Gateway events and route to appropriate use case methods
   */
  async handle(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const { httpMethod, path, body } = event;
      const pathSegments = path.split('/').filter(Boolean);
      const taskId = pathSegments.length > 1 ? pathSegments[1] : undefined;
      
      // Extract user information from Cognito authorizer if available
      const userInfo = this.extractUserInfo(event);
      
      // Create task
      if (httpMethod === 'POST' && pathSegments[0] === 'tasks' && !taskId) {
        const { title, description } = JSON.parse(body || '{}');
        if (!title) {
          return this.errorResponse(400, 'Title is required');
        }
        
        const task = await this.taskUseCase.createTask(
          title, 
          description || '', 
          userInfo?.userId,
          userInfo?.email
        );
        return this.successResponse(201, task.toObject());
      }
      
      // Get all tasks
      if (httpMethod === 'GET' && pathSegments[0] === 'tasks' && !taskId) {
        const tasks = await this.taskUseCase.getAllTasks();
        return this.successResponse(200, tasks.map(task => task.toObject()));
      }
      
      // Get task by ID
      if (httpMethod === 'GET' && pathSegments[0] === 'tasks' && taskId) {
        const task = await this.taskUseCase.getTask(taskId);
        if (!task) {
          return this.errorResponse(404, 'Task not found');
        }
        return this.successResponse(200, task.toObject());
      }
      
      // Update task
      if (httpMethod === 'PUT' && pathSegments[0] === 'tasks' && taskId) {
        const { title, description } = JSON.parse(body || '{}');
        const task = await this.taskUseCase.updateTask(taskId, title, description);
        if (!task) {
          return this.errorResponse(404, 'Task not found');
        }
        return this.successResponse(200, task.toObject());
      }
      
      // Complete task
      if (httpMethod === 'PATCH' && pathSegments[0] === 'tasks' && taskId && pathSegments[2] === 'complete') {
        const task = await this.taskUseCase.completeTask(
          taskId,
          userInfo?.userId,
          userInfo?.email
        );
        if (!task) {
          return this.errorResponse(404, 'Task not found');
        }
        return this.successResponse(200, task.toObject());
      }
      
      // Delete task
      if (httpMethod === 'DELETE' && pathSegments[0] === 'tasks' && taskId) {
        const success = await this.taskUseCase.deleteTask(taskId);
        if (!success) {
          return this.errorResponse(404, 'Task not found');
        }
        return this.successResponse(204, null);
      }
      
      return this.errorResponse(404, 'Route not found');
    } catch (error) {
      console.error('Error handling request:', error);
      return this.errorResponse(500, 'Internal server error');
    }
  }
  
  /**
   * Extract user information from Cognito authorizer claims
   * @param event API Gateway event
   * @returns User information or undefined if not available
   */
  private extractUserInfo(event: APIGatewayProxyEvent): { userId: string; email: string } | undefined {
    try {
      // Check if we have Cognito authorizer claims
      if (
        event.requestContext?.authorizer?.claims &&
        typeof event.requestContext.authorizer.claims === 'object'
      ) {
        const claims = event.requestContext.authorizer.claims as any;
        
        // Extract user ID (sub) and email from claims
        const userId = claims.sub;
        const email = claims.email;
        
        if (userId && email) {
          return { userId, email };
        }
      }
      
      return undefined;
    } catch (error) {
      console.error('Error extracting user info from claims:', error);
      return undefined;
    }
  }
  
  private successResponse(statusCode: number, data: any): APIGatewayProxyResult {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE,PATCH'
      },
      body: data ? JSON.stringify(data) : ''
    };
  }
  
  private errorResponse(statusCode: number, message: string): APIGatewayProxyResult {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE,PATCH'
      },
      body: JSON.stringify({ message })
    };
  }
}
