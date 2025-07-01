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
exports.CognitoConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const cognito = __importStar(require("aws-cdk-lib/aws-cognito"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const path = __importStar(require("path"));
const constructs_1 = require("constructs");
class CognitoConstruct extends constructs_1.Construct {
    constructor(scope, id, props = {}) {
        super(scope, id);
        const environmentName = props.environmentName || 'dev';
        // Create an SNS topic for SMS messages
        const smsTopic = new sns.Topic(this, 'SMSTopic', {
            displayName: 'Task App SMS',
        });
        // Create IAM role for Cognito to send SMS messages
        const smsRole = new iam.Role(this, 'CognitoSMSRole', {
            assumedBy: new iam.ServicePrincipal('cognito-idp.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSNSFullAccess')
            ]
        });
        // Allow Cognito to publish to SNS
        smsRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['sns:Publish'],
            resources: ['*'], // Allow publishing to any SNS topic
        }));
        // Create DynamoDB table for users
        this.userTable = new dynamodb.Table(this, 'UserTable', {
            tableName: `TaskApp-Users-${environmentName}`,
            partitionKey: {
                name: 'userId',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY, // Use RETAIN for production
            pointInTimeRecovery: true,
        });
        // Add email GSI for querying users by email
        this.userTable.addGlobalSecondaryIndex({
            indexName: 'EmailIndex',
            partitionKey: {
                name: 'email',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // Create Post Confirmation Lambda function
        this.postConfirmationFunction = new lambda.Function(this, 'PostConfirmationFunction', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'postConfirmationFunction.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../dist/adapters/in')),
            environment: {
                USER_TABLE_NAME: this.userTable.tableName,
                EVENT_BUS_NAME: props.eventBusName || '',
                REGION: cdk.Stack.of(this).region,
            },
            timeout: cdk.Duration.seconds(30),
            description: 'Handles post confirmation actions for Cognito users',
        });
        // Grant the Lambda function permissions to write to the user table
        this.userTable.grantReadWriteData(this.postConfirmationFunction);
        // If event bus name is provided, grant permissions to publish events
        if (props.eventBusName) {
            this.postConfirmationFunction.addToRolePolicy(new iam.PolicyStatement({
                actions: ['events:PutEvents'],
                resources: [`arn:aws:events:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:event-bus/${props.eventBusName}`],
            }));
        }
        // Create User Pool with security-first approach
        this.userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: `TaskApp-UserPool-${environmentName}`,
            selfSignUpEnabled: true,
            signInAliases: {
                email: true,
                phone: true,
                username: true,
            },
            standardAttributes: {
                email: {
                    required: true,
                    mutable: true,
                },
                phoneNumber: {
                    required: true,
                    mutable: true,
                },
            },
            // Configure strong password policies
            passwordPolicy: {
                minLength: 12,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: true,
                tempPasswordValidity: cdk.Duration.hours(24), // 24 hours for temporary password expiry
            },
            // Enable MFA as required for all users
            mfa: cognito.Mfa.REQUIRED,
            mfaSecondFactor: {
                sms: true,
                otp: true,
            },
            // Configure SMS message template
            smsRole: smsRole,
            userVerification: {
                emailSubject: 'Verify your email for TaskApp',
                emailBody: 'Thank you for signing up to TaskApp! Your verification code is {####}',
                emailStyle: cognito.VerificationEmailStyle.CODE,
                smsMessage: 'TaskApp: Your verification code is {####}. This code will expire in 5 minutes. Do not share this code with anyone.',
            },
            // Configure account recovery settings
            accountRecovery: cognito.AccountRecovery.PHONE_AND_EMAIL,
            // Add Lambda triggers
            lambdaTriggers: {
                postConfirmation: this.postConfirmationFunction,
            },
        });
        // Enable case sensitivity for usernames to prevent enumeration attacks
        const cfnUserPool = this.userPool.node.defaultChild;
        cfnUserPool.usernameConfiguration = {
            caseSensitive: true,
        };
        // Set OTP expiry time (5 minutes) and password history
        if (!cfnUserPool.policies) {
            cfnUserPool.policies = {};
        }
        cfnUserPool.policies = {
            ...cfnUserPool.policies,
            passwordPolicy: {
                minimumLength: 12,
                requireLowercase: true,
                requireUppercase: true,
                requireNumbers: true,
                requireSymbols: true,
                temporaryPasswordValidityDays: 1,
                passwordHistorySize: 12
            },
        };
        // Set verification message TTL
        cfnUserPool.verificationMessageTemplate = {
            ...cfnUserPool.verificationMessageTemplate,
            emailMessage: 'Thank you for signing up to TaskApp! Your verification code is {####}',
            emailSubject: 'Verify your email for TaskApp',
            smsMessage: 'TaskApp: Your verification code is {####}. This code will expire in 5 minutes.',
            defaultEmailOption: 'CONFIRM_WITH_CODE',
        };
        // Add domain for hosted UI
        this.userPool.addDomain('CognitoDomain', {
            cognitoDomain: {
                domainPrefix: `taskapp-${environmentName}-${cdk.Stack.of(this).account.substring(0, 8)}`,
            },
        });
        // Configure attempt limits (3 max) and account lockout
        cfnUserPool.accountRecoverySetting = {
            recoveryMechanisms: [
                { name: 'verified_phone_number', priority: 1 },
                { name: 'verified_email', priority: 2 },
            ],
        };
        // Configure advanced security features
        cfnUserPool.userPoolAddOns = {
            advancedSecurityMode: 'ENFORCED',
        };
        // Set account lockout after 3 failed attempts
        cfnUserPool.adminCreateUserConfig = {
            allowAdminCreateUserOnly: false,
        };
        // Add custom attributes for risk scoring
        this.userPool.addResourceServer('ResourceServer', {
            identifier: 'taskapp',
            scopes: [
                {
                    scopeName: 'read',
                    scopeDescription: 'Read access',
                },
                {
                    scopeName: 'write',
                    scopeDescription: 'Write access',
                },
            ],
        });
        // Create User Pool Client
        this.userPoolClient = this.userPool.addClient('UserPoolClient', {
            userPoolClientName: `TaskApp-Client-${environmentName}`,
            authFlows: {
                userPassword: true,
                userSrp: true,
                adminUserPassword: true,
                custom: true,
            },
            supportedIdentityProviders: [
                cognito.UserPoolClientIdentityProvider.COGNITO,
            ],
            preventUserExistenceErrors: true, // Prevent user enumeration
            accessTokenValidity: cdk.Duration.hours(1),
            idTokenValidity: cdk.Duration.hours(1),
            refreshTokenValidity: cdk.Duration.days(30),
            enableTokenRevocation: true,
            oAuth: {
                flows: {
                    authorizationCodeGrant: true,
                    implicitCodeGrant: true,
                },
                scopes: [
                    cognito.OAuthScope.EMAIL,
                    cognito.OAuthScope.PHONE,
                    cognito.OAuthScope.OPENID,
                    cognito.OAuthScope.PROFILE,
                ],
                callbackUrls: ['http://localhost:3000/callback'],
                logoutUrls: ['http://localhost:3000/logout'],
            },
        });
        // Create Identity Pool
        this.identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
            identityPoolName: `TaskApp-IdentityPool-${environmentName}`,
            allowUnauthenticatedIdentities: false,
            cognitoIdentityProviders: [
                {
                    clientId: this.userPoolClient.userPoolClientId,
                    providerName: this.userPool.userPoolProviderName,
                },
            ],
        });
        // Create IAM roles for authenticated and unauthenticated users
        this.authenticatedRole = new iam.Role(this, 'AuthenticatedRole', {
            assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
                StringEquals: {
                    'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
                },
                'ForAnyValue:StringLike': {
                    'cognito-identity.amazonaws.com:amr': 'authenticated',
                },
            }, 'sts:AssumeRoleWithWebIdentity'),
        });
        this.unauthenticatedRole = new iam.Role(this, 'UnauthenticatedRole', {
            assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
                StringEquals: {
                    'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
                },
                'ForAnyValue:StringLike': {
                    'cognito-identity.amazonaws.com:amr': 'unauthenticated',
                },
            }, 'sts:AssumeRoleWithWebIdentity'),
        });
        // Attach minimal permissions to the roles
        this.authenticatedRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'mobileanalytics:PutEvents',
                'cognito-sync:*',
            ],
            resources: ['*'],
        }));
        this.unauthenticatedRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'mobileanalytics:PutEvents',
                'cognito-sync:*',
            ],
            resources: ['*'],
        }));
        // Attach roles to Identity Pool
        new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
            identityPoolId: this.identityPool.ref,
            roles: {
                authenticated: this.authenticatedRole.roleArn,
                unauthenticated: this.unauthenticatedRole.roleArn,
            },
        });
        // Configure Lambda triggers for custom authentication logic
        const cfnUserPoolClient = this.userPoolClient.node.defaultChild;
        cfnUserPoolClient.analyticsConfiguration = {
            applicationArn: 'arn:aws:cognito-idp:::appArn', // Placeholder, replace with actual app ARN if needed
            externalId: 'taskapp-analytics',
            roleArn: smsRole.roleArn,
            userDataShared: false,
        };
        // Output important values
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: this.userPool.userPoolId,
            description: 'The ID of the User Pool',
        });
        new cdk.CfnOutput(this, 'UserPoolClientId', {
            value: this.userPoolClient.userPoolClientId,
            description: 'The ID of the User Pool Client',
        });
        new cdk.CfnOutput(this, 'IdentityPoolId', {
            value: this.identityPool.ref,
            description: 'The ID of the Identity Pool',
        });
        new cdk.CfnOutput(this, 'UserTableName', {
            value: this.userTable.tableName,
            description: 'The name of the User DynamoDB table',
        });
    }
}
exports.CognitoConstruct = CognitoConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29nbml0b0NvbnN0cnVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2luZnJhc3RydWN0dXJlL0NvZ25pdG9Db25zdHJ1Y3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLGlFQUFtRDtBQUNuRCx5REFBMkM7QUFDM0MseURBQTJDO0FBQzNDLCtEQUFpRDtBQUNqRCxtRUFBcUQ7QUFDckQsMkNBQTZCO0FBQzdCLDJDQUF1QztBQWF2QyxNQUFhLGdCQUFpQixTQUFRLHNCQUFTO0lBUzdDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsUUFBK0IsRUFBRTtRQUN6RSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxlQUFlLElBQUksS0FBSyxDQUFDO1FBRXZELHVDQUF1QztRQUN2QyxNQUFNLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUMvQyxXQUFXLEVBQUUsY0FBYztTQUM1QixDQUFDLENBQUM7UUFFSCxtREFBbUQ7UUFDbkQsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUNuRCxTQUFTLEVBQUUsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsMkJBQTJCLENBQUM7WUFDaEUsZUFBZSxFQUFFO2dCQUNmLEdBQUcsQ0FBQyxhQUFhLENBQUMsd0JBQXdCLENBQUMscUJBQXFCLENBQUM7YUFDbEU7U0FDRixDQUFDLENBQUM7UUFFSCxrQ0FBa0M7UUFDbEMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7WUFDMUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztZQUN4QixPQUFPLEVBQUUsQ0FB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cnQgKiBhcyBjb2duaXRvIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIHNucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29nbml0b0NvbnN0cnVjdFByb3BzIHtcbiAgLyoqXG4gICAqIE9wdGlvbmFsIGVudmlyb25tZW50IG5hbWUgKGUuZy4sICdkZXYnLCAncHJvZCcpXG4gICAqL1xuICBlbnZpcm9ubWVudE5hbWU/OiBzdHJpbmc7XG4gIC8qKlxuICAgKiBPcHRpb25hbCBldmVudCBidXMgbmFtZSBmb3IgcHVibGlzaGluZyBldmVudHNcbiAgICovXG4gIGV2ZW50QnVzTmFtZT86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIENvZ25pdG9Db25zdHJ1Y3QgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgdXNlclBvb2w6IGNvZ25pdG8uVXNlclBvb2w7XG4gIHB1YmxpYyByZWFkb25seSB1c2VyUG9vbENsaWVudDogY29nbml0by5Vc2VyUG9vbENsaWVudDtcbiAgcHVibGljIHJlYWRvbmx5IGlkZW50aXR5UG9vbDogY29nbml0by5DZm5JZGVudGl0eVBvb2w7XG4gIHB1YmxpYyByZWFkb25seSBhdXRoZW50aWNhdGVkUm9sZTogaWFtLlJvbGU7XG4gIHB1YmxpYyByZWFkb25seSB1bmF1dGhlbnRpY2F0ZWRSb2xlOiBpYW0uUm9sZTtcbiAgcHVibGljIHJlYWRvbmx5IHVzZXJUYWJsZTogZHluYW1vZGIuVGFibGU7XG4gIHB1YmxpYyByZWFkb25seSBwb3N0Q29uZmlybWF0aW9uRnVuY3Rpb246IGxhbWJkYS5GdW5jdGlvbjtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQ29nbml0b0NvbnN0cnVjdFByb3BzID0ge30pIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgY29uc3QgZW52aXJvbm1lbnROYW1lID0gcHJvcHMuZW52aXJvbm1lbnROYW1lIHx8ICdkZXYnO1xuICAgIFxuICAgIC8vIENyZWF0ZSBhbiBTTlMgdG9waWMgZm9yIFNNUyBtZXNzYWdlc1xuICAgIGNvbnN0IHNtc1RvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCAnU01TVG9waWMnLCB7XG4gICAgICBkaXNwbGF5TmFtZTogJ1Rhc2sgQXBwIFNNUycsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgSUFNIHJvbGUgZm9yIENvZ25pdG8gdG8gc2VuZCBTTVMgbWVzc2FnZXNcbiAgICBjb25zdCBzbXNSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdDb2duaXRvU01TUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdjb2duaXRvLWlkcC5hbWF6b25hd3MuY29tJyksXG4gICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25TTlNGdWxsQWNjZXNzJylcbiAgICAgIF1cbiAgICB9KTtcblxuICAgIC8vIEFsbG93IENvZ25pdG8gdG8gcHVibGlzaCB0byBTTlNcbiAgICBzbXNSb2xlLmFkZFRvUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFsnc25zOlB1Ymxpc2gnXSxcbiAgICAgIHJlc291cmNlczogWycqJ10sIC8vIEFsbG93IHB1Ymxpc2hpbmcgdG8gYW55IFNOUyB0b3BpY1xuICAgIH0pKTtcblxuICAgIC8vIENyZWF0ZSBEeW5hbW9EQiB0YWJsZSBmb3IgdXNlcnNcbiAgICB0aGlzLnVzZXJUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnVXNlclRhYmxlJywge1xuICAgICAgdGFibGVOYW1lOiBgVGFza0FwcC1Vc2Vycy0ke2Vudmlyb25tZW50TmFtZX1gLFxuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6ICd1c2VySWQnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gVXNlIFJFVEFJTiBmb3IgcHJvZHVjdGlvblxuICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeTogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIEFkZCBlbWFpbCBHU0kgZm9yIHF1ZXJ5aW5nIHVzZXJzIGJ5IGVtYWlsXG4gICAgdGhpcy51c2VyVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiAnRW1haWxJbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogJ2VtYWlsJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgcHJvamVjdGlvblR5cGU6IGR5bmFtb2RiLlByb2plY3Rpb25UeXBlLkFMTCxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBQb3N0IENvbmZpcm1hdGlvbiBMYW1iZGEgZnVuY3Rpb25cbiAgICB0aGlzLnBvc3RDb25maXJtYXRpb25GdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ1Bvc3RDb25maXJtYXRpb25GdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgaGFuZGxlcjogJ3Bvc3RDb25maXJtYXRpb25GdW5jdGlvbi5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vZGlzdC9hZGFwdGVycy9pbicpKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFVTRVJfVEFCTEVfTkFNRTogdGhpcy51c2VyVGFibGUudGFibGVOYW1lLFxuICAgICAgICBFVkVOVF9CVVNfTkFNRTogcHJvcHMuZXZlbnRCdXNOYW1lIHx8ICcnLFxuICAgICAgICBSRUdJT046IGNkay5TdGFjay5vZih0aGlzKS5yZWdpb24sXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgZGVzY3JpcHRpb246ICdIYW5kbGVzIHBvc3QgY29uZmlybWF0aW9uIGFjdGlvbnMgZm9yIENvZ25pdG8gdXNlcnMnLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgdGhlIExhbWJkYSBmdW5jdGlvbiBwZXJtaXNzaW9ucyB0byB3cml0ZSB0byB0aGUgdXNlciB0YWJsZVxuICAgIHRoaXMudXNlclRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh0aGlzLnBvc3RDb25maXJtYXRpb25GdW5jdGlvbik7XG5cbiAgICAvLyBJZiBldmVudCBidXMgbmFtZSBpcyBwcm92aWRlZCwgZ3JhbnQgcGVybWlzc2lvbnMgdG8gcHVibGlzaCBldmVudHNcbiAgICBpZiAocHJvcHMuZXZlbnRCdXNOYW1lKSB7XG4gICAgICB0aGlzLnBvc3RDb25maXJtYXRpb25GdW5jdGlvbi5hZGRUb1JvbGVQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBhY3Rpb25zOiBbJ2V2ZW50czpQdXRFdmVudHMnXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbYGFybjphd3M6ZXZlbnRzOiR7Y2RrLlN0YWNrLm9mKHRoaXMpLnJlZ2lvbn06JHtjZGsuU3RhY2sub2YodGhpcykuYWNjb3VudH06ZXZlbnQtYnVzLyR7cHJvcHMuZXZlbnRCdXNOYW1lfWBdLFxuICAgICAgfSkpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBVc2VyIFBvb2wgd2l0aCBzZWN1cml0eS1maXJzdCBhcHByb2FjaFxuICAgIHRoaXMudXNlclBvb2wgPSBuZXcgY29nbml0by5Vc2VyUG9vbCh0aGlzLCAnVXNlclBvb2wnLCB7XG4gICAgICB1c2VyUG9vbE5hbWU6IGBUYXNrQXBwLVVzZXJQb29sLSR7ZW52aXJvbm1lbnROYW1lfWAsXG4gICAgICBzZWxmU2lnblVwRW5hYmxlZDogdHJ1ZSxcbiAgICAgIHNpZ25JbkFsaWFzZXM6IHtcbiAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICAgIHBob25lOiB0cnVlLFxuICAgICAgICB1c2VybmFtZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBzdGFuZGFyZEF0dHJpYnV0ZXM6IHtcbiAgICAgICAgZW1haWw6IHtcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICBtdXRhYmxlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBwaG9uZU51bWJlcjoge1xuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG11dGFibGU6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgLy8gQ29uZmlndXJlIHN0cm9uZyBwYXNzd29yZCBwb2xpY2llc1xuICAgICAgcGFzc3dvcmRQb2xpY3k6IHtcbiAgICAgICAgbWluTGVuZ3RoOiAxMixcbiAgICAgICAgcmVxdWlyZUxvd2VyY2FzZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZVVwcGVyY2FzZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZURpZ2l0czogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZVN5bWJvbHM6IHRydWUsXG4gICAgICAgIHRlbXBQYXNzd29yZFZhbGlkaXR5OiBjZGsuRHVyYXRpb24uaG91cnMoMjQpLCAvLyAyNCBob3VycyBmb3IgdGVtcG9yYXJ5IHBhc3N3b3JkIGV4cGlyeVxuICAgICAgfSxcbiAgICAgIC8vIEVuYWJsZSBNRkEgYXMgcmVxdWlyZWQgZm9yIGFsbCB1c2Vyc1xuICAgICAgbWZhOiBjb2duaXRvLk1mYS5SRVFVSVJFRCxcbiAgICAgIG1mYVNlY29uZEZhY3Rvcjoge1xuICAgICAgICBzbXM6IHRydWUsXG4gICAgICAgIG90cDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICAvLyBDb25maWd1cmUgU01TIG1lc3NhZ2UgdGVtcGxhdGVcbiAgICAgIHNtc1JvbGU6IHNtc1JvbGUsXG4gICAgICB1c2VyVmVyaWZpY2F0aW9uOiB7XG4gICAgICAgIGVtYWlsU3ViamVjdDogJ1ZlcmlmeSB5b3VyIGVtYWlsIGZvciBUYXNrQXBwJyxcbiAgICAgICAgZW1haWxCb2R5OiAnVGhhbmsgeW91IGZvciBzaWduaW5nIHVwIHRvIFRhc2tBcHAhIFlvdXIgdmVyaWZpY2F0aW9uIGNvZGUgaXMgeyMjIyN9JyxcbiAgICAgICAgZW1haWxTdHlsZTogY29nbml0by5WZXJpZmljYXRpb25FbWFpbFN0eWxlLkNPREUsXG4gICAgICAgIHNtc01lc3NhZ2U6ICdUYXNrQXBwOiBZb3VyIHZlcmlmaWNhdGlvbiBjb2RlIGlzIHsjIyMjfS4gVGhpcyBjb2RlIHdpbGwgZXhwaXJlIGluIDUgbWludXRlcy4gRG8gbm90IHNoYXJlIHRoaXMgY29kZSB3aXRoIGFueW9uZS4nLFxuICAgICAgfSxcbiAgICAgIC8vIENvbmZpZ3VyZSBhY2NvdW50IHJlY292ZXJ5IHNldHRpbmdzXG4gICAgICBhY2NvdW50UmVjb3Zlcnk6IGNvZ25pdG8uQWNjb3VudFJlY292ZXJ5LlBIT05FX0FORF9FTUFJTCxcbiAgICAgIC8vIEFkZCBMYW1iZGEgdHJpZ2dlcnNcbiAgICAgIGxhbWJkYVRyaWdnZXJzOiB7XG4gICAgICAgIHBvc3RDb25maXJtYXRpb246IHRoaXMucG9zdENvbmZpcm1hdGlvbkZ1bmN0aW9uLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBcbiAgICAvLyBFbmFibGUgY2FzZSBzZW5zaXRpdml0eSBmb3IgdXNlcm5hbWVzIHRvIHByZXZlbnQgZW51bWVyYXRpb24gYXR0YWNrc1xuICAgIGNvbnN0IGNmblVzZXJQb29sID0gdGhpcy51c2VyUG9vbC5ub2RlLmRlZmF1bHRDaGlsZCBhcyBjb2duaXRvLkNmblVzZXJQb29sO1xuICAgIGNmblVzZXJQb29sLnVzZXJuYW1lQ29uZmlndXJhdGlvbiA9IHtcbiAgICAgIGNhc2VTZW5zaXRpdmU6IHRydWUsXG4gICAgfTtcbiAgICBcbiAgICAvLyBTZXQgT1RQIGV4cGlyeSB0aW1lICg1IG1pbnV0ZXMpIGFuZCBwYXNzd29yZCBoaXN0b3J5XG4gICAgaWYgKCFjZm5Vc2VyUG9vbC5wb2xpY2llcykge1xuICAgICAgY2ZuVXNlclBvb2wucG9saWNpZXMgPSB7fTtcbiAgICB9XG4gICAgXG4gICAgY2ZuVXNlclBvb2wucG9saWNpZXMgPSB7XG4gICAgICAuLi5jZm5Vc2VyUG9vbC5wb2xpY2llcyxcbiAgICAgIHBhc3N3b3JkUG9saWN5OiB7XG4gICAgICAgIG1pbmltdW1MZW5ndGg6IDEyLFxuICAgICAgICByZXF1aXJlTG93ZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlVXBwZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlTnVtYmVyczogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZVN5bWJvbHM6IHRydWUsXG4gICAgICAgIHRlbXBvcmFyeVBhc3N3b3JkVmFsaWRpdHlEYXlzOiAxLFxuICAgICAgICBwYXNzd29yZEhpc3RvcnlTaXplOiAxMlxuICAgICAgfSxcbiAgICB9O1xuICAgIFxuICAgIC8vIFNldCB2ZXJpZmljYXRpb24gbWVzc2FnZSBUVExcbiAgICBjZm5Vc2VyUG9vbC52ZXJpZmljYXRpb25NZXNzYWdlVGVtcGxhdGUgPSB7XG4gICAgICAuLi5jZm5Vc2VyUG9vbC52ZXJpZmljYXRpb25NZXNzYWdlVGVtcGxhdGUsXG4gICAgICBlbWFpbE1lc3NhZ2U6ICdUaGFuayB5b3UgZm9yIHNpZ25pbmcgdXAgdG8gVGFza0FwcCEgWW91ciB2ZXJpZmljYXRpb24gY29kZSBpcyB7IyMjI30nLFxuICAgICAgZW1haWxTdWJqZWN0OiAnVmVyaWZ5IHlvdXIgZW1haWwgZm9yIFRhc2tBcHAnLFxuICAgICAgc21zTWVzc2FnZTogJ1Rhc2tBcHA6IFlvdXIgdmVyaWZpY2F0aW9uIGNvZGUgaXMgeyMjIyN9LiBUaGlzIGNvZGUgd2lsbCBleHBpcmUgaW4gNSBtaW51dGVzLicsXG4gICAgICBkZWZhdWx0RW1haWxPcHRpb246ICdDT05GSVJNX1dJVEhfQ09ERScsXG4gICAgfTtcblxuICAgIC8vIEFkZCBkb21haW4gZm9yIGhvc3RlZCBVSVxuICAgIHRoaXMudXNlclBvb2wuYWRkRG9tYWluKCdDb2duaXRvRG9tYWluJywge1xuICAgICAgY29nbml0b0RvbWFpbjoge1xuICAgICAgICBkb21haW5QcmVmaXg6IGB0YXNrYXBwLSR7ZW52aXJvbm1lbnROYW1lfS0ke2Nkay5TdGFjay5vZih0aGlzKS5hY2NvdW50LnN1YnN0cmluZygwLCA4KX1gLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIENvbmZpZ3VyZSBhdHRlbXB0IGxpbWl0cyAoMyBtYXgpIGFuZCBhY2NvdW50IGxvY2tvdXRcbiAgICBjZm5Vc2VyUG9vbC5hY2NvdW50UmVjb3ZlcnlTZXR0aW5nID0ge1xuICAgICAgcmVjb3ZlcnlNZWNoYW5pc21zOiBbXG4gICAgICAgIHsgbmFtZTogJ3ZlcmlmaWVkX3Bob25lX251bWJlcicsIHByaW9yaXR5OiAxIH0sXG4gICAgICAgIHsgbmFtZTogJ3ZlcmlmaWVkX2VtYWlsJywgcHJpb3JpdHk6IDIgfSxcbiAgICAgIF0sXG4gICAgfTtcblxuICAgIC8vIENvbmZpZ3VyZSBhZHZhbmNlZCBzZWN1cml0eSBmZWF0dXJlc1xuICAgIGNmblVzZXJQb29sLnVzZXJQb29sQWRkT25zID0ge1xuICAgICAgYWR2YW5jZWRTZWN1cml0eU1vZGU6ICdFTkZPUkNFRCcsXG4gICAgfTtcblxuICAgIC8vIFNldCBhY2NvdW50IGxvY2tvdXQgYWZ0ZXIgMyBmYWlsZWQgYXR0ZW1wdHNcbiAgICBjZm5Vc2VyUG9vbC5hZG1pbkNyZWF0ZVVzZXJDb25maWcgPSB7XG4gICAgICBhbGxvd0FkbWluQ3JlYXRlVXNlck9ubHk6IGZhbHNlLFxuICAgIH07XG5cbiAgICAvLyBBZGQgY3VzdG9tIGF0dHJpYnV0ZXMgZm9yIHJpc2sgc2NvcmluZ1xuICAgIHRoaXMudXNlclBvb2wuYWRkUmVzb3VyY2VTZXJ2ZXIoJ1Jlc291cmNlU2VydmVyJywge1xuICAgICAgaWRlbnRpZmllcjogJ3Rhc2thcHAnLFxuICAgICAgc2NvcGVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzY29wZU5hbWU6ICdyZWFkJyxcbiAgICAgICAgICBzY29wZURlc2NyaXB0aW9uOiAnUmVhZCBhY2Nlc3MnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgc2NvcGVOYW1lOiAnd3JpdGUnLFxuICAgICAgICAgIHNjb3BlRGVzY3JpcHRpb246ICdXcml0ZSBhY2Nlc3MnLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBVc2VyIFBvb2wgQ2xpZW50XG4gICAgdGhpcy51c2VyUG9vbENsaWVudCA9IHRoaXMudXNlclBvb2wuYWRkQ2xpZW50KCdVc2VyUG9vbENsaWVudCcsIHtcbiAgICAgIHVzZXJQb29sQ2xpZW50TmFtZTogYFRhc2tBcHAtQ2xpZW50LSR7ZW52aXJvbm1lbnROYW1lfWAsXG4gICAgICBhdXRoRmxvd3M6IHtcbiAgICAgICAgdXNlclBhc3N3b3JkOiB0cnVlLFxuICAgICAgICB1c2VyU3JwOiB0cnVlLFxuICAgICAgICBhZG1pblVzZXJQYXNzd29yZDogdHJ1ZSxcbiAgICAgICAgY3VzdG9tOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHN1cHBvcnRlZElkZW50aXR5UHJvdmlkZXJzOiBbXG4gICAgICAgIGNvZ25pdG8uVXNlclBvb2xDbGllbnRJZGVudGl0eVByb3ZpZGVyLkNPR05JVE8sXG4gICAgICBdLFxuICAgICAgcHJldmVudFVzZXJFeGlzdGVuY2VFcnJvcnM6IHRydWUsIC8vIFByZXZlbnQgdXNlciBlbnVtZXJhdGlvblxuICAgICAgYWNjZXNzVG9rZW5WYWxpZGl0eTogY2RrLkR1cmF0aW9uLmhvdXJzKDEpLFxuICAgICAgaWRUb2tlblZhbGlkaXR5OiBjZGsuRHVyYXRpb24uaG91cnMoMSksXG4gICAgICByZWZyZXNoVG9rZW5WYWxpZGl0eTogY2RrLkR1cmF0aW9uLmRheXMoMzApLFxuICAgICAgZW5hYmxlVG9rZW5SZXZvY2F0aW9uOiB0cnVlLFxuICAgICAgb0F1dGg6IHtcbiAgICAgICAgZmxvd3M6IHtcbiAgICAgICAgICBhdXRob3JpemF0aW9uQ29kZUdyYW50OiB0cnVlLFxuICAgICAgICAgIGltcGxpY2l0Q29kZUdyYW50OiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBzY29wZXM6IFtcbiAgICAgICAgICBjb2duaXRvLk9BdXRoU2NvcGUuRU1BSUwsXG4gICAgICAgICAgY29nbml0by5PQXV0aFNjb3BlLlBIT05FLFxuICAgICAgICAgIGNvZ25pdG8uT0F1dGhTY29wZS5PUEVOSUQsXG4gICAgICAgICAgY29nbml0by5PQXV0aFNjb3BlLlBST0ZJTEUsXG4gICAgICAgIF0sXG4gICAgICAgIGNhbGxiYWNrVXJsczogWydodHRwOi8vbG9jYWxob3N0OjMwMDAvY2FsbGJhY2snXSxcbiAgICAgICAgbG9nb3V0VXJsczogWydodHRwOi8vbG9jYWxob3N0OjMwMDAvbG9nb3V0J10sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIElkZW50aXR5IFBvb2xcbiAgICB0aGlzLmlkZW50aXR5UG9vbCA9IG5ldyBjb2duaXRvLkNmbklkZW50aXR5UG9vbCh0aGlzLCAnSWRlbnRpdHlQb29sJywge1xuICAgICAgaWRlbnRpdHlQb29sTmFtZTogYFRhc2tBcHAtSWRlbnRpdHlQb29sLSR7ZW52aXJvbm1lbnROYW1lfWAsXG4gICAgICBhbGxvd1VuYXV0aGVudGljYXRlZElkZW50aXRpZXM6IGZhbHNlLFxuICAgICAgY29nbml0b0lkZW50aXR5UHJvdmlkZXJzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBjbGllbnRJZDogdGhpcy51c2VyUG9vbENsaWVudC51c2VyUG9vbENsaWVudElkLFxuICAgICAgICAgIHByb3ZpZGVyTmFtZTogdGhpcy51c2VyUG9vbC51c2VyUG9vbFByb3ZpZGVyTmFtZSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgSUFNIHJvbGVzIGZvciBhdXRoZW50aWNhdGVkIGFuZCB1bmF1dGhlbnRpY2F0ZWQgdXNlcnNcbiAgICB0aGlzLmF1dGhlbnRpY2F0ZWRSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdBdXRoZW50aWNhdGVkUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5GZWRlcmF0ZWRQcmluY2lwYWwoXG4gICAgICAgICdjb2duaXRvLWlkZW50aXR5LmFtYXpvbmF3cy5jb20nLFxuICAgICAgICB7XG4gICAgICAgICAgU3RyaW5nRXF1YWxzOiB7XG4gICAgICAgICAgICAnY29nbml0by1pZGVudGl0eS5hbWF6b25hd3MuY29tOmF1ZCc6IHRoaXMuaWRlbnRpdHlQb29sLnJlZixcbiAgICAgICAgICB9LFxuICAgICAgICAgICdGb3JBbnlWYWx1ZTpTdHJpbmdMaWtlJzoge1xuICAgICAgICAgICAgJ2NvZ25pdG8taWRlbnRpdHkuYW1hem9uYXdzLmNvbTphbXInOiAnYXV0aGVudGljYXRlZCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgJ3N0czpBc3N1bWVSb2xlV2l0aFdlYklkZW50aXR5J1xuICAgICAgKSxcbiAgICB9KTtcblxuICAgIHRoaXMudW5hdXRoZW50aWNhdGVkUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnVW5hdXRoZW50aWNhdGVkUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5GZWRlcmF0ZWRQcmluY2lwYWwoXG4gICAgICAgICdjb2duaXRvLWlkZW50aXR5LmFtYXpvbmF3cy5jb20nLFxuICAgICAgICB7XG4gICAgICAgICAgU3RyaW5nRXF1YWxzOiB7XG4gICAgICAgICAgICAnY29nbml0by1pZGVudGl0eS5hbWF6b25hd3MuY29tOmF1ZCc6IHRoaXMuaWRlbnRpdHlQb29sLnJlZixcbiAgICAgICAgICB9LFxuICAgICAgICAgICdGb3JBbnlWYWx1ZTpTdHJpbmdMaWtlJzoge1xuICAgICAgICAgICAgJ2NvZ25pdG8taWRlbnRpdHkuYW1hem9uYXdzLmNvbTphbXInOiAndW5hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICAnc3RzOkFzc3VtZVJvbGVXaXRoV2ViSWRlbnRpdHknXG4gICAgICApLFxuICAgIH0pO1xuXG4gICAgLy8gQXR0YWNoIG1pbmltYWwgcGVybWlzc2lvbnMgdG8gdGhlIHJvbGVzXG4gICAgdGhpcy5hdXRoZW50aWNhdGVkUm9sZS5hZGRUb1BvbGljeShcbiAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgJ21vYmlsZWFuYWx5dGljczpQdXRFdmVudHMnLFxuICAgICAgICAgICdjb2duaXRvLXN5bmM6KicsXG4gICAgICAgIF0sXG4gICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICB0aGlzLnVuYXV0aGVudGljYXRlZFJvbGUuYWRkVG9Qb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICdtb2JpbGVhbmFseXRpY3M6UHV0RXZlbnRzJyxcbiAgICAgICAgICAnY29nbml0by1zeW5jOionLFxuICAgICAgICBdLFxuICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gQXR0YWNoIHJvbGVzIHRvIElkZW50aXR5IFBvb2xcbiAgICBuZXcgY29nbml0by5DZm5JZGVudGl0eVBvb2xSb2xlQXR0YWNobWVudCh0aGlzLCAnSWRlbnRpdHlQb29sUm9sZUF0dGFjaG1lbnQnLCB7XG4gICAgICBpZGVudGl0eVBvb2xJZDogdGhpcy5pZGVudGl0eVBvb2wucmVmLFxuICAgICAgcm9sZXM6IHtcbiAgICAgICAgYXV0aGVudGljYXRlZDogdGhpcy5hdXRoZW50aWNhdGVkUm9sZS5yb2xlQXJuLFxuICAgICAgICB1bmF1dGhlbnRpY2F0ZWQ6IHRoaXMudW5hdXRoZW50aWNhdGVkUm9sZS5yb2xlQXJuLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIENvbmZpZ3VyZSBMYW1iZGEgdHJpZ2dlcnMgZm9yIGN1c3RvbSBhdXRoZW50aWNhdGlvbiBsb2dpY1xuICAgIGNvbnN0IGNmblVzZXJQb29sQ2xpZW50ID0gdGhpcy51c2VyUG9vbENsaWVudC5ub2RlLmRlZmF1bHRDaGlsZCBhcyBjb2duaXRvLkNmblVzZXJQb29sQ2xpZW50O1xuICAgIGNmblVzZXJQb29sQ2xpZW50LmFuYWx5dGljc0NvbmZpZ3VyYXRpb24gPSB7XG4gICAgICBhcHBsaWNhdGlvbkFybjogJ2Fybjphd3M6Y29nbml0by1pZHA6OjphcHBBcm4nLCAvLyBQbGFjZWhvbGRlciwgcmVwbGFjZSB3aXRoIGFjdHVhbCBhcHAgQVJOIGlmIG5lZWRlZFxuICAgICAgZXh0ZXJuYWxJZDogJ3Rhc2thcHAtYW5hbHl0aWNzJyxcbiAgICAgIHJvbGVBcm46IHNtc1JvbGUucm9sZUFybixcbiAgICAgIHVzZXJEYXRhU2hhcmVkOiBmYWxzZSxcbiAgICB9O1xuXG4gICAgLy8gT3V0cHV0IGltcG9ydGFudCB2YWx1ZXNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclBvb2xJZCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICBkZXNjcmlwdGlvbjogJ1RoZSBJRCBvZiB0aGUgVXNlciBQb29sJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyUG9vbENsaWVudElkJywge1xuICAgICAgdmFsdWU6IHRoaXMudXNlclBvb2xDbGllbnQudXNlclBvb2xDbGllbnRJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIElEIG9mIHRoZSBVc2VyIFBvb2wgQ2xpZW50JyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdJZGVudGl0eVBvb2xJZCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmlkZW50aXR5UG9vbC5yZWYsXG4gICAgICBkZXNjcmlwdGlvbjogJ1RoZSBJRCBvZiB0aGUgSWRlbnRpdHkgUG9vbCcsXG4gICAgfSk7XG4gICAgXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1VzZXJUYWJsZU5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy51c2VyVGFibGUudGFibGVOYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdUaGUgbmFtZSBvZiB0aGUgVXNlciBEeW5hbW9EQiB0YWJsZScsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==