import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TaskUseCase } from '../../application/ports/in/TaskUseCase';
/**
 * Lambda handler adapter for the TaskUseCase input port
 */
export declare class TaskLambdaHandler {
    private readonly taskUseCase;
    constructor(taskUseCase: TaskUseCase);
    /**
     * Handle API Gateway events and route to appropriate use case methods
     */
    handle(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
    /**
     * Extract user information from Cognito authorizer claims
     * @param event API Gateway event
     * @returns User information or undefined if not available
     */
    private extractUserInfo;
    private successResponse;
    private errorResponse;
}
