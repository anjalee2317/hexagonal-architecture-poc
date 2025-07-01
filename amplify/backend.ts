import { defineBackend } from '@aws-amplify/backend';
import { data } from '@aws-amplify/backend/data';
import { Function } from '@aws-amplify/backend/function';
import * as path from 'path';

// Import our custom resource providers
import { taskApi } from './resources/task-api';
import { authResource } from './resources/auth-resource';
import { eventBusResource } from './resources/event-bus-resource';

// Define the backend
export const backend = defineBackend({
  // Use our custom auth resource instead of the built-in auth
  auth: authResource,
  
  // Define a simple data model for tasks using Amplify's schema
  data: data({
    schema: `
      type Task @model {
        id: ID!
        title: String!
        description: String
        completed: Boolean!
        createdAt: AWSDateTime!
        updatedAt: AWSDateTime!
      }
    `
  }),
  
  // Use our custom task API resource
  taskApi: taskApi,
  
  // Add our custom event bus resource
  eventBus: eventBusResource
});
