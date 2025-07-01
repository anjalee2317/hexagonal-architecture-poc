#!/usr/bin/env node

/**
 * Deployment script for AWS Amplify Gen 2 with custom CDK resources
 * This script helps with the migration from standalone CDK to Amplify Gen 2
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define environment
const isProd = process.argv.includes('--prod');
process.env.NODE_ENV = isProd ? 'production' : 'dev';

console.log(`Deploying to ${process.env.NODE_ENV} environment...`);

// Build the project
console.log('Building the project...');
try {
  execSync('npm run prebuild && npx tsc --skipLibCheck', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

// Deploy with Amplify
console.log('Deploying with Amplify Gen 2...');
try {
  const deployCmd = isProd ? 'npx amplify deploy --prod' : 'npx amplify deploy';
  execSync(deployCmd, { stdio: 'inherit' });
} catch (error) {
  console.error('Deployment failed:', error);
  process.exit(1);
}

console.log('Deployment completed successfully!');
