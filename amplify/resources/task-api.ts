import { defineBackend } from '@aws-amplify/backend';
import { TaskApiConstruct } from '../../infrastructure/TaskApiConstruct';
import { Construct } from 'constructs';
import { ResourceProvider } from '@aws-amplify/plugin-types';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as events from 'aws-cdk-lib/aws-events';

/**
 * Define a custom resource using our TaskApiConstruct
 */
export const taskApi = {
  // Add getInstance method required by Amplify Gen 2
  getInstance() {
    return this;
  },
  
  defineResource({ stack, resources }: { stack: Construct, resources: Record<string, any> }) {
    // Get references to other resources if they exist
    let userPool: cognito.IUserPool | undefined;
    let eventBus: events.IEventBus | undefined;
    
    // Check if auth resource exists and has a userPool
    if (resources.auth && resources.auth.userPool) {
      userPool = resources.auth.userPool;
    }
    
    // Check if eventBus resource exists and has an eventBus
    if (resources.eventBus && resources.eventBus.eventBus) {
      eventBus = resources.eventBus.eventBus;
    }
    
    // Create our custom TaskApiConstruct with references to other resources
    const taskApiConstruct = new TaskApiConstruct(stack, 'TaskApi', {
      userPool,
      eventBus,
      environmentName: process.env.NODE_ENV === 'production' ? 'prod' : 'dev'
    });
    
    // Return the outputs that might be useful for frontend integration
    return {
      apiEndpoint: taskApiConstruct.api.url,
      taskTableName: taskApiConstruct.taskTable.tableName
    };
  }
} as ResourceProvider;
