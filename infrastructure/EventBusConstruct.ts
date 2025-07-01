import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Construct } from 'constructs';

/**
 * Properties for the EventBusConstruct
 */
export interface EventBusProps {
  /**
   * Environment name (e.g., dev, prod)
   */
  environmentName: string;
}

/**
 * CDK construct for EventBridge event bus and notification Lambda
 */
export class EventBusConstruct extends Construct {
  /**
   * The EventBridge event bus
   */
  public readonly eventBus: events.EventBus;
  
  /**
   * The notification Lambda function
   */
  public readonly notificationLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: EventBusProps) {
    super(scope, id);

    const environmentName = props.environmentName;

    // Create custom event bus
    this.eventBus = new events.EventBus(this, 'TaskEventBus', {
      eventBusName: `task-event-bus-${environmentName}`
    });

    // Create notification Lambda function
    this.notificationLambda = new lambda.Function(this, 'NotificationFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'notificationFunction.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dist', 'src', 'adapters', 'in')),
      environment: {
        ENVIRONMENT: environmentName,
        REGION: cdk.Stack.of(this).region,
        DEFAULT_SENDER: `noreply@taskapp-${environmentName}.com`
      },
      timeout: cdk.Duration.seconds(30),
      description: 'Lambda function to process notification events and send emails',
    });

    // Grant SES permissions to the notification Lambda
    this.notificationLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'ses:SendEmail',
          'ses:SendRawEmail',
          'ses:SendTemplatedEmail'
        ],
        resources: ['*'], // For production, restrict to specific SES ARNs
        effect: iam.Effect.ALLOW
      })
    );

    // Create event rules for user registration events
    const userRegistrationRule = new events.Rule(this, 'UserRegistrationRule', {
      eventBus: this.eventBus,
      eventPattern: {
        source: ['com.taskapp.auth'],
        detailType: ['UserRegistration']
      },
      ruleName: `user-registration-rule-${environmentName}`,
      description: 'Rule to capture user registration events',
    });
    
    userRegistrationRule.addTarget(new targets.LambdaFunction(this.notificationLambda));

    // Create event rules for task creation events
    const taskCreationRule = new events.Rule(this, 'TaskCreationRule', {
      eventBus: this.eventBus,
      eventPattern: {
        source: ['com.taskapp.tasks'],
        detailType: ['TaskCreation']
      },
      ruleName: `task-creation-rule-${environmentName}`,
      description: 'Rule to capture task creation events',
    });
    
    taskCreationRule.addTarget(new targets.LambdaFunction(this.notificationLambda));

    // Create event rules for task completion events
    const taskCompletionRule = new events.Rule(this, 'TaskCompletionRule', {
      eventBus: this.eventBus,
      eventPattern: {
        source: ['com.taskapp.tasks'],
        detailType: ['TaskCompletion']
      },
      ruleName: `task-completion-rule-${environmentName}`,
      description: 'Rule to capture task completion events',
    });
    
    taskCompletionRule.addTarget(new targets.LambdaFunction(this.notificationLambda));

    // Grant the event bus permission to invoke the Lambda
    this.notificationLambda.addPermission('EventBusInvokePermission', {
      principal: new iam.ServicePrincipal('events.amazonaws.com'),
      sourceArn: this.eventBus.eventBusArn,
    });

    // Output the event bus ARN
    new cdk.CfnOutput(this, 'EventBusArn', {
      value: this.eventBus.eventBusArn,
      description: 'ARN of the Event Bus',
    });

    // Output the notification Lambda ARN
    new cdk.CfnOutput(this, 'NotificationLambdaArn', {
      value: this.notificationLambda.functionArn,
      description: 'ARN of the Notification Lambda',
    });
  }
}
