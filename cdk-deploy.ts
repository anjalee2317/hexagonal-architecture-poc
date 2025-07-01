#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CognitoConstruct } from './infrastructure/CognitoConstruct';
import { EventBusConstruct } from './infrastructure/EventBusConstruct';
import { TaskApiConstruct } from './infrastructure/TaskApiConstruct';

/**
 * Stack that deploys all the resources for the Task application
 */
class TaskAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Deploy environment name
    const environmentName = this.node.tryGetContext('environment') || 'dev';
    console.log(`Deploying to ${environmentName} environment`);

    // Create EventBus first
    const eventBus = new EventBusConstruct(this, 'EventBus', {
      environmentName,
    });

    // Create Cognito resources
    const cognito = new CognitoConstruct(this, 'Cognito', {
      environmentName,
      eventBusName: eventBus.eventBus.eventBusName,
    });

    // Create Task API with references to Cognito and EventBus
    new TaskApiConstruct(this, 'TaskApi', {
      environmentName,
      userPool: cognito.userPool,
      eventBus: eventBus.eventBus,
    });
  }
}

// Create the CDK app
const app = new cdk.App();

// Get environment from context or use default
const environment = app.node.tryGetContext('environment') || 'dev';

// Create the stack
new TaskAppStack(app, `TaskApp-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `Task Application Stack (${environment})`,
  tags: {
    Environment: environment,
    Project: 'TaskApp',
    ManagedBy: 'CDK',
  },
});

app.synth();
