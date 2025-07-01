"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskApiConstruct = void 0;
const constructs_1 = require("constructs");
const cdk = __importStar(require("aws-cdk-lib"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const path = __importStar(require("path"));
/**
 * Custom CDK construct for Task API following Hexagonal Architecture principles
 */
class TaskApiConstruct extends constructs_1.Construct {
    constructor(scope, id, props = {}) {
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
            code: lambda.Code.fromAsset(path.join(__dirname, '../dist')),
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
exports.TaskApiConstruct = TaskApiConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGFza0FwaUNvbnN0cnVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2luZnJhc3RydWN0dXJlL1Rhc2tBcGlDb25zdHJ1Y3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQXVDO0FBQ3ZDLGlEQUFtQztBQUNuQyxtRUFBcUQ7QUFDckQsK0RBQWlEO0FBQ2pELHVFQUF5RDtBQUV6RCwyQ0FBNkI7QUF3QjdCOztHQUVHO0FBQ0gsTUFBYSxnQkFBaUIsU0FBUSxzQkFBUztJQUs3QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLFFBQStCLEVBQUU7UUFDekUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsZUFBZSxJQUFJLEtBQUssQ0FBQztRQUV2RCxrQ0FBa0M7UUFDbEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNyRCxZQUFZLEVBQUU7Z0JBQ1osSUFBSSxFQUFFLElBQUk7Z0JBQ1YsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTTthQUNwQztZQUNELFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLGVBQWU7WUFDakQsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLHlCQUF5QjtTQUNuRSxDQUFDLENBQUM7UUFFSCw2Q0FBNkM7UUFDN0MsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUM1RCxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSxzQkFBc0I7WUFDL0IsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUks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QUN0QyxZQUFZLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFFcEcseUNBQXlDO1FBQ3pDLFlBQVksQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUV2RyxtREFBbUQ7UUFDbkQsTUFBTSxnQkFBZ0IsR0FBRyxZQUFZLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzlELGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQzVHLENBQUM7Q0FDRjtBQWpHRCw0Q0FpR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMnO1xuaW1wb3J0ICogYXMgY29nbml0byBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29nbml0byc7XG5cbi8qKlxuICogUHJvcGVydGllcyBmb3IgVGFza0FwaUNvbnN0cnVjdFxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRhc2tBcGlDb25zdHJ1Y3RQcm9wcyB7XG4gIC8qKlxuICAgKiBPcHRpb25hbCBDb2duaXRvIFVzZXIgUG9vbCBmb3IgYXV0aG9yaXphdGlvblxuICAgKi9cbiAgdXNlclBvb2w/OiBjb2duaXRvLklVc2VyUG9vbDtcbiAgXG4gIC8qKlxuICAgKiBPcHRpb25hbCBFdmVudEJ1cyBmb3IgcHVibGlzaGluZyBldmVudHNcbiAgICovXG4gIGV2ZW50QnVzPzogZXZlbnRzLklFdmVudEJ1cztcbiAgXG4gIC8qKlxuICAgKiBFbnZpcm9ubWVudCBuYW1lIChlLmcuLCBkZXYsIHByb2QpXG4gICAqL1xuICBlbnZpcm9ubWVudE5hbWU/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogQ3VzdG9tIENESyBjb25zdHJ1Y3QgZm9yIFRhc2sgQVBJIGZvbGxvd2luZyBIZXhhZ29uYWwgQXJjaGl0ZWN0dXJlIHByaW5jaXBsZXNcbiAqL1xuZXhwb3J0IGNsYXNzIFRhc2tBcGlDb25zdHJ1Y3QgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpOiBhcGlnYXRld2F5LlJlc3RBcGk7XG4gIHB1YmxpYyByZWFkb25seSB0YXNrVGFibGU6IGR5bmFtb2RiLlRhYmxlO1xuICBwdWJsaWMgcmVhZG9ubHkgdGFza0Z1bmN0aW9uOiBsYW1iZGEuRnVuY3Rpb247XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFRhc2tBcGlDb25zdHJ1Y3RQcm9wcyA9IHt9KSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcbiAgICBcbiAgICBjb25zdCBlbnZpcm9ubWVudE5hbWUgPSBwcm9wcy5lbnZpcm9ubWVudE5hbWUgfHwgJ2Rldic7XG5cbiAgICAvLyBDcmVhdGUgRHluYW1vREIgdGFibGUgZm9yIHRhc2tzXG4gICAgdGhpcy50YXNrVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1Rhc2tUYWJsZScsIHtcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiAnaWQnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklOR1xuICAgICAgfSxcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZIC8vIEZvciBkZW1vIHB1cnBvc2VzIG9ubHlcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBMYW1iZGEgZnVuY3Rpb24gZm9yIHRhc2sgb3BlcmF0aW9uc1xuICAgIHRoaXMudGFza0Z1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnVGFza0Z1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICBoYW5kbGVyOiAndGFza0Z1bmN0aW9uLmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9kaXN0JykpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFTS19UQUJMRV9OQU1FOiB0aGlzLnRhc2tUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIFJFR0lPTjogY2RrLlN0YWNrLm9mKHRoaXMpLnJlZ2lvbixcbiAgICAgICAgRU5WSVJPTk1FTlQ6IGVudmlyb25tZW50TmFtZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgTGFtYmRhIGZ1bmN0aW9uIHBlcm1pc3Npb25zIHRvIGFjY2VzcyBEeW5hbW9EQiB0YWJsZVxuICAgIHRoaXMudGFza1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh0aGlzLnRhc2tGdW5jdGlvbik7XG4gICAgXG4gICAgLy8gQWRkIEV2ZW50QnVzIGludGVncmF0aW9uIGlmIHByb3ZpZGVkXG4gICAgaWYgKHByb3BzLmV2ZW50QnVzKSB7XG4gICAgICB0aGlzLnRhc2tGdW5jdGlvbi5hZGRFbnZpcm9ubWVudCgnRVZFTlRfQlVTX05BTUUnLCBwcm9wcy5ldmVudEJ1cy5ldmVudEJ1c05hbWUpO1xuICAgICAgcHJvcHMuZXZlbnRCdXMuZ3JhbnRQdXRFdmVudHNUbyh0aGlzLnRhc2tGdW5jdGlvbik7XG4gICAgfVxuICAgIFxuICAgIC8vIEFkZCBDb2duaXRvIGludGVncmF0aW9uIGlmIHByb3ZpZGVkXG4gICAgaWYgKHByb3BzLnVzZXJQb29sKSB7XG4gICAgICB0aGlzLnRhc2tGdW5jdGlvbi5hZGRFbnZpcm9ubWVudCgnVVNFUl9QT09MX0lEJywgcHJvcHMudXNlclBvb2wudXNlclBvb2xJZCk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIEFQSSBHYXRld2F5IFJFU1QgQVBJXG4gICAgdGhpcy5hcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdUYXNrQXBpJywge1xuICAgICAgcmVzdEFwaU5hbWU6ICdUYXNrIEFQSScsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBmb3IgdGFzayBvcGVyYXRpb25zJyxcbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWdhdGV3YXkuQ29ycy5BTExfT1JJR0lOUyxcbiAgICAgICAgYWxsb3dNZXRob2RzOiBhcGlnYXRld2F5LkNvcnMuQUxMX01FVEhPRFMsXG4gICAgICAgIGFsbG93SGVhZGVyczogWydDb250ZW50LVR5cGUnLCAnQXV0aG9yaXphdGlvbiddXG4gICAgICB9XG4gICAgfSk7XG4gICAgXG4gICAgLy8gQ3JlYXRlIGF1dGhvcml6ZXIgaWYgQ29nbml0byBVc2VyIFBvb2wgaXMgcHJvdmlkZWRcbiAgICBsZXQgYXV0aG9yaXplclByb3BzID0ge307XG4gICAgaWYgKHByb3BzLnVzZXJQb29sKSB7XG4gICAgICBjb25zdCBhdXRob3JpemVyID0gbmV3IGFwaWdhdGV3YXkuQ29nbml0b1VzZXJQb29sc0F1dGhvcml6ZXIodGhpcywgJ1Rhc2tBcGlBdXRob3JpemVyJywge1xuICAgICAgICBjb2duaXRvVXNlclBvb2xzOiBbcHJvcHMudXNlclBvb2xdLFxuICAgICAgICBhdXRob3JpemVyTmFtZTogJ1Rhc2tBcGlDb2duaXRvQXV0aG9yaXplcicsXG4gICAgICAgIGlkZW50aXR5U291cmNlOiAnbWV0aG9kLnJlcXVlc3QuaGVhZGVyLkF1dGhvcml6YXRpb24nXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgYXV0aG9yaXplclByb3BzID0ge1xuICAgICAgICBhdXRob3JpemVyOiBhdXRob3JpemVyLFxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBBUEkgR2F0ZXdheSByZXNvdXJjZXMgYW5kIG1ldGhvZHNcbiAgICBjb25zdCB0YXNrc1Jlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgndGFza3MnKTtcbiAgICBcbiAgICAvLyBHRVQgL3Rhc2tzIC0gR2V0IGFsbCB0YXNrc1xuICAgIHRhc2tzUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih0aGlzLnRhc2tGdW5jdGlvbiksIGF1dGhvcml6ZXJQcm9wcyk7XG4gICAgXG4gICAgLy8gUE9TVCAvdGFza3MgLSBDcmVhdGUgYSB0YXNrXG4gICAgdGFza3NSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih0aGlzLnRhc2tGdW5jdGlvbiksIGF1dGhvcml6ZXJQcm9wcyk7XG4gICAgXG4gICAgLy8gVGFzay1zcGVjaWZpYyBvcGVyYXRpb25zXG4gICAgY29uc3QgdGFza1Jlc291cmNlID0gdGFza3NSZXNvdXJjZS5hZGRSZXNvdXJjZSgne3Rhc2tJZH0nKTtcbiAgICBcbiAgICAvLyBHRVQgL3Rhc2tzL3t0YXNrSWR9IC0gR2V0IGEgdGFza1xuICAgIHRhc2tSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRoaXMudGFza0Z1bmN0aW9uKSwgYXV0aG9yaXplclByb3BzKTtcbiAgICBcbiAgICAvLyBQVVQgL3Rhc2tzL3t0YXNrSWR9IC0gVXBkYXRlIGEgdGFza1xuICAgIHRhc2tSZXNvdXJjZS5hZGRNZXRob2QoJ1BVVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRoaXMudGFza0Z1bmN0aW9uKSwgYXV0aG9yaXplclByb3BzKTtcbiAgICBcbiAgICAvLyBERUxFVEUgL3Rhc2tzL3t0YXNrSWR9IC0gRGVsZXRlIGEgdGFza1xuICAgIHRhc2tSZXNvdXJjZS5hZGRNZXRob2QoJ0RFTEVURScsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRoaXMudGFza0Z1bmN0aW9uKSwgYXV0aG9yaXplclByb3BzKTtcbiAgICBcbiAgICAvLyBQQVRDSCAvdGFza3Mve3Rhc2tJZH0vY29tcGxldGUgLSBDb21wbGV0ZSBhIHRhc2tcbiAgICBjb25zdCBjb21wbGV0ZVJlc291cmNlID0gdGFza1Jlc291cmNlLmFkZFJlc291cmNlKCdjb21wbGV0ZScpO1xuICAgIGNvbXBsZXRlUmVzb3VyY2UuYWRkTWV0aG9kKCdQQVRDSCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRoaXMudGFza0Z1bmN0aW9uKSwgYXV0aG9yaXplclByb3BzKTtcbiAgfVxufVxuIl19