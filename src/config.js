/**
 * Frontend configuration for connecting to the Amplify Gen 2 backend
 */

export const config = {
  // Cognito Configuration
  cognito: {
    userPoolId: 'us-east-1_RavpYb3b1',
    userPoolWebClientId: '5d4prm92sno68iofpjo0u0ul8c',
    region: 'us-east-1',
  },
  // API Configuration
  api: {
    baseUrl: 'https://f4brxi494m.execute-api.us-east-1.amazonaws.com/prod',
  },
};
