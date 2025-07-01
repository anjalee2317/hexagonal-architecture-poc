// This is a simple entry point that delegates to our hexagonal architecture implementation
const path = require('path');
const fs = require('fs');

// Check if we're in a production environment or local development
const isProduction = process.env.NODE_ENV === 'production';

let handler;

if (isProduction) {
  // In production, use the compiled JavaScript version
  try {
    // Import the compiled handler from our hexagonal architecture implementation
    const taskFunction = require('../../../dist/src/adapters/in/taskFunction');
    handler = taskFunction.handler;
  } catch (error) {
    console.error('Error loading task function handler:', error);
    throw error;
  }
} else {
  // For local development, use ts-node to run TypeScript directly
  try {
    require('ts-node/register');
    const taskFunctionPath = path.join(process.cwd(), 'src', 'adapters', 'in', 'taskFunction.ts');
    
    if (fs.existsSync(taskFunctionPath)) {
      const taskFunction = require(taskFunctionPath);
      handler = taskFunction.handler;
    } else {
      console.error(`Task function not found at path: ${taskFunctionPath}`);
      throw new Error(`Task function not found at path: ${taskFunctionPath}`);
    }
  } catch (error) {
    console.error('Error loading task function handler for development:', error);
    throw error;
  }
}

// Export the handler function that will be called by AWS Lambda
exports.handler = async (event, context) => {
  try {
    // Add environment variables that might be needed by our hexagonal architecture
    process.env.TASK_TABLE_NAME = process.env.TASK_TABLE_NAME || 'TaskTable';
    process.env.REGION = process.env.REGION || process.env.AWS_REGION;
    
    // Call our hexagonal architecture handler
    return await handler(event, context);
  } catch (error) {
    console.error('Error in Lambda handler:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE,PATCH'
      },
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error.message
      })
    };
  }
};
