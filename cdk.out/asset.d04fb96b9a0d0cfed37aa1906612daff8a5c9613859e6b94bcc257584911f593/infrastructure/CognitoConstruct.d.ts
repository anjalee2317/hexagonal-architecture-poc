import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
export interface CognitoConstructProps {
    /**
     * Optional environment name (e.g., 'dev', 'prod')
     */
    environmentName?: string;
    /**
     * Optional event bus name for publishing events
     */
    eventBusName?: string;
}
export declare class CognitoConstruct extends Construct {
    readonly userPool: cognito.UserPool;
    readonly userPoolClient: cognito.UserPoolClient;
    readonly identityPool: cognito.CfnIdentityPool;
    readonly authenticatedRole: iam.Role;
    readonly unauthenticatedRole: iam.Role;
    readonly userTable: dynamodb.Table;
    readonly postConfirmationFunction: lambda.Function;
    constructor(scope: Construct, id: string, props?: CognitoConstructProps);
}
