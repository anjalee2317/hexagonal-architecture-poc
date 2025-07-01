import { defineBackend } from '@aws-amplify/backend';
import { Construct } from 'constructs';
import { ResourceProvider } from '@aws-amplify/plugin-types';
import { CognitoConstruct } from '../../infrastructure/CognitoConstruct';

/**
 * Define a custom auth resource that uses our CognitoConstruct
 */
export const authResource = {
  // Add getInstance method required by Amplify Gen 2
  getInstance() {
    return this;
  },
  
  defineResource({ stack }: { stack: Construct }) {
    // Create our custom CognitoConstruct
    const cognitoConstruct = new CognitoConstruct(stack, 'Cognito', {
      environmentName: process.env.NODE_ENV === 'production' ? 'prod' : 'dev',
      // Use the verified SES email address
      fromEmail: 'anjalee@smashtaps.com'
    });
    
    // Return the outputs that might be useful for frontend integration
    return {
      userPoolId: cognitoConstruct.userPool.userPoolId,
      userPoolClientId: cognitoConstruct.userPoolClient.userPoolClientId,
      identityPoolId: cognitoConstruct.identityPool.ref,
      userTableName: cognitoConstruct.userTable.tableName
    };
  }
} as ResourceProvider;
