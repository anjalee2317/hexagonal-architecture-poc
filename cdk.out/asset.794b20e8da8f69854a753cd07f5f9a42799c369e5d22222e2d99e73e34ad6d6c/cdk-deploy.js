#!/usr/bin/env node
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
const cdk = __importStar(require("aws-cdk-lib"));
const CognitoConstruct_1 = require("./infrastructure/CognitoConstruct");
const EventBusConstruct_1 = require("./infrastructure/EventBusConstruct");
const TaskApiConstruct_1 = require("./infrastructure/TaskApiConstruct");
/**
 * Stack that deploys all the resources for the Task application
 */
class TaskAppStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Deploy environment name
        const environmentName = this.node.tryGetContext('environment') || 'dev';
        console.log(`Deploying to ${environmentName} environment`);
        // Create EventBus first
        const eventBus = new EventBusConstruct_1.EventBusConstruct(this, 'EventBus', {
            environmentName,
        });
        // Create Cognito resources
        const cognito = new CognitoConstruct_1.CognitoConstruct(this, 'Cognito', {
            environmentName,
            eventBusName: eventBus.eventBus.eventBusName,
        });
        // Create Task API with references to Cognito and EventBus
        new TaskApiConstruct_1.TaskApiConstruct(this, 'TaskApi', {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLWRlcGxveS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2Nkay1kZXBsb3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsaURBQW1DO0FBRW5DLHdFQUFxRTtBQUNyRSwwRUFBdUU7QUFDdkUsd0VBQXFFO0FBRXJFOztHQUVHO0FBQ0gsTUFBTSxZQUFhLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDbEMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QiwwQkFBMEI7UUFDMUIsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLElBQUksS0FBSyxDQUFDO1FBQ3hFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLGVBQWUsY0FBYyxDQUFDLENBQUM7UUFFM0Qsd0JBQXdCO1FBQ3hCLE1BQU0sUUFBUSxHQUFHLElBQUkscUNBQWlCLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUN2RCxlQUFlO1NBQ2hCLENBQUMsQ0FBQztRQUVILDJCQUEyQjtRQUMzQixNQUFNLE9BQU8sR0FBRyxJQUFJLG1DQUFnQixDQUFDLElBQUksRUFBRSxTQUFTLEVBQUU7WUFDcEQsZUFBZTtZQUNmLFlBQVksRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLFlBQVk7U0FDN0MsQ0FBQyxDQUFDO1FBRUgsMERBQTBEO1FBQzFELElBQUksbUNBQWdCLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRTtZQUNwQyxlQUFlO1lBQ2YsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO1lBQzFCLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUTtTQUM1QixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFFRCxxQkFBcUI7QUFDckIsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFFMUIsOENBQThDO0FBQzlDLE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEtBQUssQ0FBQztBQUVuRSxtQkFBbUI7QUFDbkIsSUFBSSxZQUFZLENBQUMsR0FBRyxFQUFFLFdBQVcsV0FBVyxFQUFFLEVBQUU7SUFDOUMsR0FBRyxFQUFFO1FBQ0gsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CO1FBQ3hDLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLFdBQVc7S0FDdEQ7SUFDRCxXQUFXLEVBQUUsMkJBQTJCLFdBQVcsR0FBRztJQUN0RCxJQUFJLEVBQUU7UUFDSixXQUFXLEVBQUUsV0FBVztRQUN4QixPQUFPLEVBQUUsU0FBUztRQUNsQixTQUFTLEVBQUUsS0FBSztLQUNqQjtDQUNGLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IENvZ25pdG9Db25zdHJ1Y3QgfSBmcm9tICcuL2luZnJhc3RydWN0dXJlL0NvZ25pdG9Db25zdHJ1Y3QnO1xuaW1wb3J0IHsgRXZlbnRCdXNDb25zdHJ1Y3QgfSBmcm9tICcuL2luZnJhc3RydWN0dXJlL0V2ZW50QnVzQ29uc3RydWN0JztcbmltcG9ydCB7IFRhc2tBcGlDb25zdHJ1Y3QgfSBmcm9tICcuL2luZnJhc3RydWN0dXJlL1Rhc2tBcGlDb25zdHJ1Y3QnO1xuXG4vKipcbiAqIFN0YWNrIHRoYXQgZGVwbG95cyBhbGwgdGhlIHJlc291cmNlcyBmb3IgdGhlIFRhc2sgYXBwbGljYXRpb25cbiAqL1xuY2xhc3MgVGFza0FwcFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gRGVwbG95IGVudmlyb25tZW50IG5hbWVcbiAgICBjb25zdCBlbnZpcm9ubWVudE5hbWUgPSB0aGlzLm5vZGUudHJ5R2V0Q29udGV4dCgnZW52aXJvbm1lbnQnKSB8fCAnZGV2JztcbiAgICBjb25zb2xlLmxvZyhgRGVwbG95aW5nIHRvICR7ZW52aXJvbm1lbnROYW1lfSBlbnZpcm9ubWVudGApO1xuXG4gICAgLy8gQ3JlYXRlIEV2ZW50QnVzIGZpcnN0XG4gICAgY29uc3QgZXZlbnRCdXMgPSBuZXcgRXZlbnRCdXNDb25zdHJ1Y3QodGhpcywgJ0V2ZW50QnVzJywge1xuICAgICAgZW52aXJvbm1lbnROYW1lLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIENvZ25pdG8gcmVzb3VyY2VzXG4gICAgY29uc3QgY29nbml0byA9IG5ldyBDb2duaXRvQ29uc3RydWN0KHRoaXMsICdDb2duaXRvJywge1xuICAgICAgZW52aXJvbm1lbnROYW1lLFxuICAgICAgZXZlbnRCdXNOYW1lOiBldmVudEJ1cy5ldmVudEJ1cy5ldmVudEJ1c05hbWUsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgVGFzayBBUEkgd2l0aCByZWZlcmVuY2VzIHRvIENvZ25pdG8gYW5kIEV2ZW50QnVzXG4gICAgbmV3IFRhc2tBcGlDb25zdHJ1Y3QodGhpcywgJ1Rhc2tBcGknLCB7XG4gICAgICBlbnZpcm9ubWVudE5hbWUsXG4gICAgICB1c2VyUG9vbDogY29nbml0by51c2VyUG9vbCxcbiAgICAgIGV2ZW50QnVzOiBldmVudEJ1cy5ldmVudEJ1cyxcbiAgICB9KTtcbiAgfVxufVxuXG4vLyBDcmVhdGUgdGhlIENESyBhcHBcbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbi8vIEdldCBlbnZpcm9ubWVudCBmcm9tIGNvbnRleHQgb3IgdXNlIGRlZmF1bHRcbmNvbnN0IGVudmlyb25tZW50ID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW52aXJvbm1lbnQnKSB8fCAnZGV2JztcblxuLy8gQ3JlYXRlIHRoZSBzdGFja1xubmV3IFRhc2tBcHBTdGFjayhhcHAsIGBUYXNrQXBwLSR7ZW52aXJvbm1lbnR9YCwge1xuICBlbnY6IHtcbiAgICBhY2NvdW50OiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5ULFxuICAgIHJlZ2lvbjogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfUkVHSU9OIHx8ICd1cy1lYXN0LTEnLFxuICB9LFxuICBkZXNjcmlwdGlvbjogYFRhc2sgQXBwbGljYXRpb24gU3RhY2sgKCR7ZW52aXJvbm1lbnR9KWAsXG4gIHRhZ3M6IHtcbiAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnQsXG4gICAgUHJvamVjdDogJ1Rhc2tBcHAnLFxuICAgIE1hbmFnZWRCeTogJ0NESycsXG4gIH0sXG59KTtcblxuYXBwLnN5bnRoKCk7XG4iXX0=