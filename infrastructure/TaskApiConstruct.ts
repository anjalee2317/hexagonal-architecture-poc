import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
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
export class TaskApiConstruct extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly taskTable: dynamodb.Table;
  public readonly taskFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: TaskApiConstructProps = {}) {
    super(scope, id);
    
    const environmentName = props.environmentName || 'dev';

    // Create DynamoDB table for tasks
    this.taskTable = new dynamodb.Table(this, 'TaskTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY // For demo purposes only
    });

    // Create Lambda function for task operations
    this.taskFunction = new lambda.Function(this, 'TaskFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'taskFunction.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist.zip')),
      environment: {
        TASK_TABLE_NAME: this.taskTable.tableName,
        REGION: cdk.Stack.of(this).region,
        ENVIRONMENT: environmentName
      }
    });

    // Grant Lambda function permissions to access DynamoDB table
    this.taskTable.grantReadWriteData(this.taskFunction);
    
    // Add EventBus integration if provided
    if (props.eventBus) {
      this.taskFunction.addEnvironment('EVENT_BUS_NAME', props.eventBus.eventBusName);
      props.eventBus.grantPutEventsTo(this.taskFunction);
    }
    
    // Add Cognito integration if provided
    if (props.userPool) {
      this.taskFunction.addEnvironment('USER_POOL_ID', props.userPool.userPoolId);
    }

    // Create API Gateway REST API
    this.api = new apigateway.RestApi(this, 'TaskApi', {
      restApiName: 'Task API',
      description: 'API for task operations',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization']
      }
    });
    
    // Create authorizer if Cognito User Pool is provided
    let authorizerProps = {};
    if (props.userPool) {
      const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'TaskApiAuthorizer', {
        cognitoUserPools: [props.userPool],
        authorizerName: 'TaskApiCognitoAuthorizer',
        identitySource: 'method.request.header.Authorization'
      });
      
      authorizerProps = {
        authorizer: authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO
      };
    }

    // Create API Gateway resources and methods
    const tasksResource = this.api.root.addResource('tasks');
    
    // GET /tasks - Get all tasks
    tasksResource.addMethod('GET', new apigateway.LambdaIntegration(this.taskFunction), authorizerProps);
    
    // POST /tasks - Create a task
    tasksResource.addMethod('POST', new apigateway.LambdaIntegration(this.taskFunction), authorizerProps);
    
    // Task-specific operations
    const taskResource = tasksResource.addResource('{taskId}');
    
    // GET /tasks/{taskId} - Get a task
    taskResource.addMethod('GET', new apigateway.LambdaIntegration(this.taskFunction), authorizerProps);
    
    // PUT /tasks/{taskId} - Update a task
    taskResource.addMethod('PUT', new apigateway.LambdaIntegration(this.taskFunction), authorizerProps);
    
    // DELETE /tasks/{taskId} - Delete a task
    taskResource.addMethod('DELETE', new apigateway.LambdaIntegration(this.taskFunction), authorizerProps);
    
    // PATCH /tasks/{taskId}/complete - Complete a task
    const completeResource = taskResource.addResource('complete');
    completeResource.addMethod('PATCH', new apigateway.LambdaIntegration(this.taskFunction), authorizerProps);
  }
}
