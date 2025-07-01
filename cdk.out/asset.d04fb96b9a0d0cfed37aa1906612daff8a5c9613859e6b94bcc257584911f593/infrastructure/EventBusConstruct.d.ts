import * as events from 'aws-cdk-lib/aws-events';
import * as lambda from 'aws-cdk-lib/aws-lambda';
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
export declare class EventBusConstruct extends Construct {
    /**
     * The EventBridge event bus
     */
    readonly eventBus: events.EventBus;
    /**
     * The notification Lambda function
     */
    readonly notificationLambda: lambda.Function;
    constructor(scope: Construct, id: string, props: EventBusProps);
}
