import { defineBackend } from '@aws-amplify/backend';
import { Construct } from 'constructs';
import { ResourceProvider } from '@aws-amplify/plugin-types';
import { EventBusConstruct } from '../../infrastructure/EventBusConstruct';

/**
 * Define a custom event bus resource that uses our EventBusConstruct
 */
export const eventBusResource = {
  // Add getInstance method required by Amplify Gen 2
  getInstance() {
    return this;
  },
  
  defineResource({ stack }: { stack: Construct }) {
    // Create our custom EventBusConstruct
    const eventBusConstruct = new EventBusConstruct(stack, 'EventBus', {
      environmentName: process.env.NODE_ENV === 'production' ? 'prod' : 'dev'
    });
    
    // Return the outputs that might be useful for integration
    return {
      eventBusName: eventBusConstruct.eventBus.eventBusName,
      eventBusArn: eventBusConstruct.eventBus.eventBusArn,
      notificationLambdaArn: eventBusConstruct.notificationLambda.functionArn
    };
  }
} as ResourceProvider;
