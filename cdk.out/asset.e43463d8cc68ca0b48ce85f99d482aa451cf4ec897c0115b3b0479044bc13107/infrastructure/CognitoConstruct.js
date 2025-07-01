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
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const path = __importStar(require("path"));
const constructs_1 = require("constructs");
class CognitoConstruct extends constructs_1.Construct {
    constructor(scope, id, props = {}) {
        super(scope, id);
        const environmentName = props.environmentName || 'dev';
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
            // Enable MFA as optional with TOTP only
            mfa: cognito.Mfa.OPTIONAL,
            mfaSecondFactor: {
                sms: false,
                otp: true,
            },
            // Configure message templates
            userVerification: {
                emailSubject: 'Verify your email for TaskApp',
                emailBody: 'Thank you for signing up to TaskApp! Your verification code is {####}',
                emailStyle: cognito.VerificationEmailStyle.CODE,
            },
            // Configure account recovery settings
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29nbml0b0NvbnN0cnVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2luZnJhc3RydWN0dXJlL0NvZ25pdG9Db25zdHJ1Y3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLGlFQUFtRDtBQUNuRCx5REFBMkM7QUFDM0MsK0RBQWlEO0FBQ2pELG1FQUFxRDtBQUNyRCwyQ0FBNkI7QUFDN0IsMkNBQXVDO0FBYXZDLE1BQWEsZ0JBQWlCLFNBQVEsc0JBQVM7SUFTN0MsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxRQUErQixFQUFFO1FBQ3pFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsTUFBTSxlQUFlLEdBQUcsS0FBSyxDQUFDLGVBQWUsSUFBSSxLQUFLLENBQUM7UUFFdkQsa0NBQWtDO1FBQ2xDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7WUFDckQsU0FBUyxFQUFFLGlCQUFpQixlQUFlLEVBQUU7WUFDN0MsWUFBWSxFQUFFO2dCQUNaLElBQUksRUFBRSxRQUFRO2dCQUNkLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU07YUFDcEM7WUFDRCxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBQ2pELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSw0QkFBNEI7WUFDdEUsbUJBQW1CLEVBQUUsSUFBSTtTQUMxQixDQUFDLENBQUM7UUFFSCw0Q0FBNEM7UUFDNUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQztZQUNyQyxTQUFTLEVBQUUsWUFBWTtZQUN2QixZQUFZLEVBQUU7Z0JBQ1osSUFBSSxFQUFFLE9BQU87Z0JBQ2IsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENB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cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGludGVyZmFjZSBDb2duaXRvQ29uc3RydWN0UHJvcHMge1xuICAvKipcbiAgICogT3B0aW9uYWwgZW52aXJvbm1lbnQgbmFtZSAoZS5nLiwgJ2RldicsICdwcm9kJylcbiAgICovXG4gIGVudmlyb25tZW50TmFtZT86IHN0cmluZztcbiAgLyoqXG4gICAqIE9wdGlvbmFsIGV2ZW50IGJ1cyBuYW1lIGZvciBwdWJsaXNoaW5nIGV2ZW50c1xuICAgKi9cbiAgZXZlbnRCdXNOYW1lPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQ29nbml0b0NvbnN0cnVjdCBleHRlbmRzIENvbnN0cnVjdCB7XG4gIHB1YmxpYyByZWFkb25seSB1c2VyUG9vbDogY29nbml0by5Vc2VyUG9vbDtcbiAgcHVibGljIHJlYWRvbmx5IHVzZXJQb29sQ2xpZW50OiBjb2duaXRvLlVzZXJQb29sQ2xpZW50O1xuICBwdWJsaWMgcmVhZG9ubHkgaWRlbnRpdHlQb29sOiBjb2duaXRvLkNmbklkZW50aXR5UG9vbDtcbiAgcHVibGljIHJlYWRvbmx5IGF1dGhlbnRpY2F0ZWRSb2xlOiBpYW0uUm9sZTtcbiAgcHVibGljIHJlYWRvbmx5IHVuYXV0aGVudGljYXRlZFJvbGU6IGlhbS5Sb2xlO1xuICBwdWJsaWMgcmVhZG9ubHkgdXNlclRhYmxlOiBkeW5hbW9kYi5UYWJsZTtcbiAgcHVibGljIHJlYWRvbmx5IHBvc3RDb25maXJtYXRpb25GdW5jdGlvbjogbGFtYmRhLkZ1bmN0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBDb2duaXRvQ29uc3RydWN0UHJvcHMgPSB7fSkge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICBjb25zdCBlbnZpcm9ubWVudE5hbWUgPSBwcm9wcy5lbnZpcm9ubWVudE5hbWUgfHwgJ2Rldic7XG4gICAgXG4gICAgLy8gQ3JlYXRlIER5bmFtb0RCIHRhYmxlIGZvciB1c2Vyc1xuICAgIHRoaXMudXNlclRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdVc2VyVGFibGUnLCB7XG4gICAgICB0YWJsZU5hbWU6IGBUYXNrQXBwLVVzZXJzLSR7ZW52aXJvbm1lbnROYW1lfWAsXG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogJ3VzZXJJZCcsXG4gICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfSxcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLCAvLyBVc2UgUkVUQUlOIGZvciBwcm9kdWN0aW9uXG4gICAgICBwb2ludEluVGltZVJlY292ZXJ5OiB0cnVlLFxuICAgIH0pO1xuXG4gICAgLy8gQWRkIGVtYWlsIEdTSSBmb3IgcXVlcnlpbmcgdXNlcnMgYnkgZW1haWxcbiAgICB0aGlzLnVzZXJUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdFbWFpbEluZGV4JyxcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiAnZW1haWwnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBwcm9qZWN0aW9uVHlwZTogZHluYW1vZGIuUHJvamVjdGlvblR5cGUuQUxMLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIFBvc3QgQ29uZmlybWF0aW9uIExhbWJkYSBmdW5jdGlvblxuICAgIHRoaXMucG9zdENvbmZpcm1hdGlvbkZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnUG9zdENvbmZpcm1hdGlvbkZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICBoYW5kbGVyOiAncG9zdENvbmZpcm1hdGlvbkZ1bmN0aW9uLmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9kaXN0L2FkYXB0ZXJzL2luJykpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVVNFUl9UQUJMRV9OQU1FOiB0aGlzLnVzZXJUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIEVWRU5UX0JVU19OQU1FOiBwcm9wcy5ldmVudEJ1c05hbWUgfHwgJycsXG4gICAgICAgIFJFR0lPTjogY2RrLlN0YWNrLm9mKHRoaXMpLnJlZ2lvbixcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICBkZXNjcmlwdGlvbjogJ0hhbmRsZXMgcG9zdCBjb25maXJtYXRpb24gYWN0aW9ucyBmb3IgQ29nbml0byB1c2VycycsXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCB0aGUgTGFtYmRhIGZ1bmN0aW9uIHBlcm1pc3Npb25zIHRvIHdyaXRlIHRvIHRoZSB1c2VyIHRhYmxlXG4gICAgdGhpcy51c2VyVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHRoaXMucG9zdENvbmZpcm1hdGlvbkZ1bmN0aW9uKTtcblxuICAgIC8vIElmIGV2ZW50IGJ1cyBuYW1lIGlzIHByb3ZpZGVkLCBncmFudCBwZXJtaXNzaW9ucyB0byBwdWJsaXNoIGV2ZW50c1xuICAgIGlmIChwcm9wcy5ldmVudEJ1c05hbWUpIHtcbiAgICAgIHRoaXMucG9zdENvbmZpcm1hdGlvbkZ1bmN0aW9uLmFkZFRvUm9sZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGFjdGlvbnM6IFsnZXZlbnRzOlB1dEV2ZW50cyddLFxuICAgICAgICByZXNvdXJjZXM6IFtgYXJuOmF3czpldmVudHM6JHtjZGsuU3RhY2sub2YodGhpcykucmVnaW9ufToke2Nkay5TdGFjay5vZih0aGlzKS5hY2NvdW50fTpldmVudC1idXMvJHtwcm9wcy5ldmVudEJ1c05hbWV9YF0sXG4gICAgICB9KSk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIFVzZXIgUG9vbCB3aXRoIHNlY3VyaXR5LWZpcnN0IGFwcHJvYWNoXG4gICAgdGhpcy51c2VyUG9vbCA9IG5ldyBjb2duaXRvLlVzZXJQb29sKHRoaXMsICdVc2VyUG9vbCcsIHtcbiAgICAgIHVzZXJQb29sTmFtZTogYFRhc2tBcHAtVXNlclBvb2wtJHtlbnZpcm9ubWVudE5hbWV9YCxcbiAgICAgIHNlbGZTaWduVXBFbmFibGVkOiB0cnVlLFxuICAgICAgc2lnbkluQWxpYXNlczoge1xuICAgICAgICBlbWFpbDogdHJ1ZSxcbiAgICAgICAgcGhvbmU6IHRydWUsXG4gICAgICAgIHVzZXJuYW1lOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHN0YW5kYXJkQXR0cmlidXRlczoge1xuICAgICAgICBlbWFpbDoge1xuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG11dGFibGU6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHBob25lTnVtYmVyOiB7XG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgbXV0YWJsZTogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICAvLyBDb25maWd1cmUgc3Ryb25nIHBhc3N3b3JkIHBvbGljaWVzXG4gICAgICBwYXNzd29yZFBvbGljeToge1xuICAgICAgICBtaW5MZW5ndGg6IDEyLFxuICAgICAgICByZXF1aXJlTG93ZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlVXBwZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlRGlnaXRzOiB0cnVlLFxuICAgICAgICByZXF1aXJlU3ltYm9sczogdHJ1ZSxcbiAgICAgICAgdGVtcFBhc3N3b3JkVmFsaWRpdHk6IGNkay5EdXJhdGlvbi5ob3VycygyNCksIC8vIDI0IGhvdXJzIGZvciB0ZW1wb3JhcnkgcGFzc3dvcmQgZXhwaXJ5XG4gICAgICB9LFxuICAgICAgLy8gRW5hYmxlIE1GQSBhcyBvcHRpb25hbCB3aXRoIFRPVFAgb25seVxuICAgICAgbWZhOiBjb2duaXRvLk1mYS5PUFRJT05BTCxcbiAgICAgIG1mYVNlY29uZEZhY3Rvcjoge1xuICAgICAgICBzbXM6IGZhbHNlLFxuICAgICAgICBvdHA6IHRydWUsXG4gICAgICB9LFxuICAgICAgLy8gQ29uZmlndXJlIG1lc3NhZ2UgdGVtcGxhdGVzXG4gICAgICB1c2VyVmVyaWZpY2F0aW9uOiB7XG4gICAgICAgIGVtYWlsU3ViamVjdDogJ1ZlcmlmeSB5b3VyIGVtYWlsIGZvciBUYXNrQXBwJyxcbiAgICAgICAgZW1haWxCb2R5OiAnVGhhbmsgeW91IGZvciBzaWduaW5nIHVwIHRvIFRhc2tBcHAhIFlvdXIgdmVyaWZpY2F0aW9uIGNvZGUgaXMgeyMjIyN9JyxcbiAgICAgICAgZW1haWxTdHlsZTogY29nbml0by5WZXJpZmljYXRpb25FbWFpbFN0eWxlLkNPREUsXG4gICAgICB9LFxuICAgICAgLy8gQ29uZmlndXJlIGFjY291bnQgcmVjb3Zlcnkgc2V0dGluZ3NcbiAgICAgIGFjY291bnRSZWNvdmVyeTogY29nbml0by5BY2NvdW50UmVjb3ZlcnkuRU1BSUxfT05MWSxcbiAgICAgIC8vIEFkZCBMYW1iZGEgdHJpZ2dlcnNcbiAgICAgIGxhbWJkYVRyaWdnZXJzOiB7XG4gICAgICAgIHBvc3RDb25maXJtYXRpb246IHRoaXMucG9zdENvbmZpcm1hdGlvbkZ1bmN0aW9uLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBcbiAgICAvLyBFbmFibGUgY2FzZSBzZW5zaXRpdml0eSBmb3IgdXNlcm5hbWVzIHRvIHByZXZlbnQgZW51bWVyYXRpb24gYXR0YWNrc1xuICAgIGNvbnN0IGNmblVzZXJQb29sID0gdGhpcy51c2VyUG9vbC5ub2RlLmRlZmF1bHRDaGlsZCBhcyBjb2duaXRvLkNmblVzZXJQb29sO1xuICAgIGNmblVzZXJQb29sLnVzZXJuYW1lQ29uZmlndXJhdGlvbiA9IHtcbiAgICAgIGNhc2VTZW5zaXRpdmU6IHRydWUsXG4gICAgfTtcbiAgICBcbiAgICAvLyBTZXQgT1RQIGV4cGlyeSB0aW1lICg1IG1pbnV0ZXMpIGFuZCBwYXNzd29yZCBoaXN0b3J5XG4gICAgaWYgKCFjZm5Vc2VyUG9vbC5wb2xpY2llcykge1xuICAgICAgY2ZuVXNlclBvb2wucG9saWNpZXMgPSB7fTtcbiAgICB9XG4gICAgXG4gICAgY2ZuVXNlclBvb2wucG9saWNpZXMgPSB7XG4gICAgICAuLi5jZm5Vc2VyUG9vbC5wb2xpY2llcyxcbiAgICAgIHBhc3N3b3JkUG9saWN5OiB7XG4gICAgICAgIG1pbmltdW1MZW5ndGg6IDEyLFxuICAgICAgICByZXF1aXJlTG93ZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlVXBwZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlTnVtYmVyczogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZVN5bWJvbHM6IHRydWUsXG4gICAgICAgIHRlbXBvcmFyeVBhc3N3b3JkVmFsaWRpdHlEYXlzOiAxLFxuICAgICAgICBwYXNzd29yZEhpc3RvcnlTaXplOiAxMlxuICAgICAgfSxcbiAgICB9O1xuICAgIFxuICAgIC8vIFNldCB2ZXJpZmljYXRpb24gbWVzc2FnZSBUVExcbiAgICBjZm5Vc2VyUG9vbC52ZXJpZmljYXRpb25NZXNzYWdlVGVtcGxhdGUgPSB7XG4gICAgICAuLi5jZm5Vc2VyUG9vbC52ZXJpZmljYXRpb25NZXNzYWdlVGVtcGxhdGUsXG4gICAgICBlbWFpbE1lc3NhZ2U6ICdUaGFuayB5b3UgZm9yIHNpZ25pbmcgdXAgdG8gVGFza0FwcCEgWW91ciB2ZXJpZmljYXRpb24gY29kZSBpcyB7IyMjI30nLFxuICAgICAgZW1haWxTdWJqZWN0OiAnVmVyaWZ5IHlvdXIgZW1haWwgZm9yIFRhc2tBcHAnLFxuICAgICAgZGVmYXVsdEVtYWlsT3B0aW9uOiAnQ09ORklSTV9XSVRIX0NPREUnLFxuICAgIH07XG5cbiAgICAvLyBBZGQgZG9tYWluIGZvciBob3N0ZWQgVUlcbiAgICB0aGlzLnVzZXJQb29sLmFkZERvbWFpbignQ29nbml0b0RvbWFpbicsIHtcbiAgICAgIGNvZ25pdG9Eb21haW46IHtcbiAgICAgICAgZG9tYWluUHJlZml4OiBgdGFza2FwcC0ke2Vudmlyb25tZW50TmFtZX0tJHtjZGsuU3RhY2sub2YodGhpcykuYWNjb3VudC5zdWJzdHJpbmcoMCwgOCl9YCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBDb25maWd1cmUgYXR0ZW1wdCBsaW1pdHMgKDMgbWF4KSBhbmQgYWNjb3VudCBsb2Nrb3V0XG4gICAgY2ZuVXNlclBvb2wuYWNjb3VudFJlY292ZXJ5U2V0dGluZyA9IHtcbiAgICAgIHJlY292ZXJ5TWVjaGFuaXNtczogW1xuICAgICAgICB7IG5hbWU6ICd2ZXJpZmllZF9waG9uZV9udW1iZXInLCBwcmlvcml0eTogMSB9LFxuICAgICAgICB7IG5hbWU6ICd2ZXJpZmllZF9lbWFpbCcsIHByaW9yaXR5OiAyIH0sXG4gICAgICBdLFxuICAgIH07XG5cbiAgICAvLyBDb25maWd1cmUgYWR2YW5jZWQgc2VjdXJpdHkgZmVhdHVyZXNcbiAgICBjZm5Vc2VyUG9vbC51c2VyUG9vbEFkZE9ucyA9IHtcbiAgICAgIGFkdmFuY2VkU2VjdXJpdHlNb2RlOiAnRU5GT1JDRUQnLFxuICAgIH07XG5cbiAgICAvLyBTZXQgYWNjb3VudCBsb2Nrb3V0IGFmdGVyIDMgZmFpbGVkIGF0dGVtcHRzXG4gICAgY2ZuVXNlclBvb2wuYWRtaW5DcmVhdGVVc2VyQ29uZmlnID0ge1xuICAgICAgYWxsb3dBZG1pbkNyZWF0ZVVzZXJPbmx5OiBmYWxzZSxcbiAgICB9O1xuXG4gICAgLy8gQWRkIGN1c3RvbSBhdHRyaWJ1dGVzIGZvciByaXNrIHNjb3JpbmdcbiAgICB0aGlzLnVzZXJQb29sLmFkZFJlc291cmNlU2VydmVyKCdSZXNvdXJjZVNlcnZlcicsIHtcbiAgICAgIGlkZW50aWZpZXI6ICd0YXNrYXBwJyxcbiAgICAgIHNjb3BlczogW1xuICAgICAgICB7XG4gICAgICAgICAgc2NvcGVOYW1lOiAncmVhZCcsXG4gICAgICAgICAgc2NvcGVEZXNjcmlwdGlvbjogJ1JlYWQgYWNjZXNzJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHNjb3BlTmFtZTogJ3dyaXRlJyxcbiAgICAgICAgICBzY29wZURlc2NyaXB0aW9uOiAnV3JpdGUgYWNjZXNzJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgVXNlciBQb29sIENsaWVudFxuICAgIHRoaXMudXNlclBvb2xDbGllbnQgPSB0aGlzLnVzZXJQb29sLmFkZENsaWVudCgnVXNlclBvb2xDbGllbnQnLCB7XG4gICAgICB1c2VyUG9vbENsaWVudE5hbWU6IGBUYXNrQXBwLUNsaWVudC0ke2Vudmlyb25tZW50TmFtZX1gLFxuICAgICAgYXV0aEZsb3dzOiB7XG4gICAgICAgIHVzZXJQYXNzd29yZDogdHJ1ZSxcbiAgICAgICAgdXNlclNycDogdHJ1ZSxcbiAgICAgICAgYWRtaW5Vc2VyUGFzc3dvcmQ6IHRydWUsXG4gICAgICAgIGN1c3RvbTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBzdXBwb3J0ZWRJZGVudGl0eVByb3ZpZGVyczogW1xuICAgICAgICBjb2duaXRvLlVzZXJQb29sQ2xpZW50SWRlbnRpdHlQcm92aWRlci5DT0dOSVRPLFxuICAgICAgXSxcbiAgICAgIHByZXZlbnRVc2VyRXhpc3RlbmNlRXJyb3JzOiB0cnVlLCAvLyBQcmV2ZW50IHVzZXIgZW51bWVyYXRpb25cbiAgICAgIGFjY2Vzc1Rva2VuVmFsaWRpdHk6IGNkay5EdXJhdGlvbi5ob3VycygxKSxcbiAgICAgIGlkVG9rZW5WYWxpZGl0eTogY2RrLkR1cmF0aW9uLmhvdXJzKDEpLFxuICAgICAgcmVmcmVzaFRva2VuVmFsaWRpdHk6IGNkay5EdXJhdGlvbi5kYXlzKDMwKSxcbiAgICAgIGVuYWJsZVRva2VuUmV2b2NhdGlvbjogdHJ1ZSxcbiAgICAgIG9BdXRoOiB7XG4gICAgICAgIGZsb3dzOiB7XG4gICAgICAgICAgYXV0aG9yaXphdGlvbkNvZGVHcmFudDogdHJ1ZSxcbiAgICAgICAgICBpbXBsaWNpdENvZGVHcmFudDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgc2NvcGVzOiBbXG4gICAgICAgICAgY29nbml0by5PQXV0aFNjb3BlLkVNQUlMLFxuICAgICAgICAgIGNvZ25pdG8uT0F1dGhTY29wZS5QSE9ORSxcbiAgICAgICAgICBjb2duaXRvLk9BdXRoU2NvcGUuT1BFTklELFxuICAgICAgICAgIGNvZ25pdG8uT0F1dGhTY29wZS5QUk9GSUxFLFxuICAgICAgICBdLFxuICAgICAgICBjYWxsYmFja1VybHM6IFsnaHR0cDovL2xvY2FsaG9zdDozMDAwL2NhbGxiYWNrJ10sXG4gICAgICAgIGxvZ291dFVybHM6IFsnaHR0cDovL2xvY2FsaG9zdDozMDAwL2xvZ291dCddLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBJZGVudGl0eSBQb29sXG4gICAgdGhpcy5pZGVudGl0eVBvb2wgPSBuZXcgY29nbml0by5DZm5JZGVudGl0eVBvb2wodGhpcywgJ0lkZW50aXR5UG9vbCcsIHtcbiAgICAgIGlkZW50aXR5UG9vbE5hbWU6IGBUYXNrQXBwLUlkZW50aXR5UG9vbC0ke2Vudmlyb25tZW50TmFtZX1gLFxuICAgICAgYWxsb3dVbmF1dGhlbnRpY2F0ZWRJZGVudGl0aWVzOiBmYWxzZSxcbiAgICAgIGNvZ25pdG9JZGVudGl0eVByb3ZpZGVyczogW1xuICAgICAgICB7XG4gICAgICAgICAgY2xpZW50SWQ6IHRoaXMudXNlclBvb2xDbGllbnQudXNlclBvb2xDbGllbnRJZCxcbiAgICAgICAgICBwcm92aWRlck5hbWU6IHRoaXMudXNlclBvb2wudXNlclBvb2xQcm92aWRlck5hbWUsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIElBTSByb2xlcyBmb3IgYXV0aGVudGljYXRlZCBhbmQgdW5hdXRoZW50aWNhdGVkIHVzZXJzXG4gICAgdGhpcy5hdXRoZW50aWNhdGVkUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnQXV0aGVudGljYXRlZFJvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uRmVkZXJhdGVkUHJpbmNpcGFsKFxuICAgICAgICAnY29nbml0by1pZGVudGl0eS5hbWF6b25hd3MuY29tJyxcbiAgICAgICAge1xuICAgICAgICAgIFN0cmluZ0VxdWFsczoge1xuICAgICAgICAgICAgJ2NvZ25pdG8taWRlbnRpdHkuYW1hem9uYXdzLmNvbTphdWQnOiB0aGlzLmlkZW50aXR5UG9vbC5yZWYsXG4gICAgICAgICAgfSxcbiAgICAgICAgICAnRm9yQW55VmFsdWU6U3RyaW5nTGlrZSc6IHtcbiAgICAgICAgICAgICdjb2duaXRvLWlkZW50aXR5LmFtYXpvbmF3cy5jb206YW1yJzogJ2F1dGhlbnRpY2F0ZWQnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgICdzdHM6QXNzdW1lUm9sZVdpdGhXZWJJZGVudGl0eSdcbiAgICAgICksXG4gICAgfSk7XG5cbiAgICB0aGlzLnVuYXV0aGVudGljYXRlZFJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ1VuYXV0aGVudGljYXRlZFJvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uRmVkZXJhdGVkUHJpbmNpcGFsKFxuICAgICAgICAnY29nbml0by1pZGVudGl0eS5hbWF6b25hd3MuY29tJyxcbiAgICAgICAge1xuICAgICAgICAgIFN0cmluZ0VxdWFsczoge1xuICAgICAgICAgICAgJ2NvZ25pdG8taWRlbnRpdHkuYW1hem9uYXdzLmNvbTphdWQnOiB0aGlzLmlkZW50aXR5UG9vbC5yZWYsXG4gICAgICAgICAgfSxcbiAgICAgICAgICAnRm9yQW55VmFsdWU6U3RyaW5nTGlrZSc6IHtcbiAgICAgICAgICAgICdjb2duaXRvLWlkZW50aXR5LmFtYXpvbmF3cy5jb206YW1yJzogJ3VuYXV0aGVudGljYXRlZCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgJ3N0czpBc3N1bWVSb2xlV2l0aFdlYklkZW50aXR5J1xuICAgICAgKSxcbiAgICB9KTtcblxuICAgIC8vIEF0dGFjaCBtaW5pbWFsIHBlcm1pc3Npb25zIHRvIHRoZSByb2xlc1xuICAgIHRoaXMuYXV0aGVudGljYXRlZFJvbGUuYWRkVG9Qb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICdtb2JpbGVhbmFseXRpY3M6UHV0RXZlbnRzJyxcbiAgICAgICAgICAnY29nbml0by1zeW5jOionLFxuICAgICAgICBdLFxuICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgdGhpcy51bmF1dGhlbnRpY2F0ZWRSb2xlLmFkZFRvUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAnbW9iaWxlYW5hbHl0aWNzOlB1dEV2ZW50cycsXG4gICAgICAgICAgJ2NvZ25pdG8tc3luYzoqJyxcbiAgICAgICAgXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIC8vIEF0dGFjaCByb2xlcyB0byBJZGVudGl0eSBQb29sXG4gICAgbmV3IGNvZ25pdG8uQ2ZuSWRlbnRpdHlQb29sUm9sZUF0dGFjaG1lbnQodGhpcywgJ0lkZW50aXR5UG9vbFJvbGVBdHRhY2htZW50Jywge1xuICAgICAgaWRlbnRpdHlQb29sSWQ6IHRoaXMuaWRlbnRpdHlQb29sLnJlZixcbiAgICAgIHJvbGVzOiB7XG4gICAgICAgIGF1dGhlbnRpY2F0ZWQ6IHRoaXMuYXV0aGVudGljYXRlZFJvbGUucm9sZUFybixcbiAgICAgICAgdW5hdXRoZW50aWNhdGVkOiB0aGlzLnVuYXV0aGVudGljYXRlZFJvbGUucm9sZUFybixcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBPdXRwdXQgaW1wb3J0YW50IHZhbHVlc1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyUG9vbElkJywge1xuICAgICAgdmFsdWU6IHRoaXMudXNlclBvb2wudXNlclBvb2xJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIElEIG9mIHRoZSBVc2VyIFBvb2wnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1VzZXJQb29sQ2xpZW50SWQnLCB7XG4gICAgICB2YWx1ZTogdGhpcy51c2VyUG9vbENsaWVudC51c2VyUG9vbENsaWVudElkLFxuICAgICAgZGVzY3JpcHRpb246ICdUaGUgSUQgb2YgdGhlIFVzZXIgUG9vbCBDbGllbnQnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0lkZW50aXR5UG9vbElkJywge1xuICAgICAgdmFsdWU6IHRoaXMuaWRlbnRpdHlQb29sLnJlZixcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIElEIG9mIHRoZSBJZGVudGl0eSBQb29sJyxcbiAgICB9KTtcbiAgICBcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclRhYmxlTmFtZScsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnVzZXJUYWJsZS50YWJsZU5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1RoZSBuYW1lIG9mIHRoZSBVc2VyIER5bmFtb0RCIHRhYmxlJyxcbiAgICB9KTtcbiAgfVxufVxuIl19