import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as cognito from 'aws-cdk-lib/aws-cognito';
/**
 * Properties for TaskApiConstruct
 */
export interface TaskApiConstructProps {
    /**
     * Optional Cognito User Pool for authorization
     */
    userPool?: cognito.IUserPool;
    /**
     * Optional EventBus for publishing events
     */
    eventBus?: events.IEventBus;
    /**
     * Environment name (e.g., dev, prod)
     */
    environmentName?: string;
}
/**
 * Custom CDK construct for Task API following Hexagonal Architecture principles
 */
export declare class TaskApiConstruct extends Construct {
    readonly api: apigateway.RestApi;
    readonly taskTable: dynamodb.Table;
    readonly taskFunction: lambda.Function;
    constructor(scope: Construct, id: string, props?: TaskApiConstructProps);
}
