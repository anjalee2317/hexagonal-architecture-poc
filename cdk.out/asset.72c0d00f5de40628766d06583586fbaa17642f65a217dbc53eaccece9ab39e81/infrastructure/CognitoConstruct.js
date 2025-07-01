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
        });
        // Allow Cognito to publish to SNS
        smsRole.addToPolicy(new iam.PolicyStatement({
            actions: ['sns:Publish'],
            resources: [smsTopic.topicArn],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29nbml0b0NvbnN0cnVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2luZnJhc3RydWN0dXJlL0NvZ25pdG9Db25zdHJ1Y3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLGlFQUFtRDtBQUNuRCx5REFBMkM7QUFDM0MseURBQTJDO0FBQzNDLCtEQUFpRDtBQUNqRCxtRUFBcUQ7QUFDckQsMkNBQTZCO0FBQzdCLDJDQUF1QztBQWF2QyxNQUFhLGdCQUFpQixTQUFRLHNCQUFTO0lBUzdDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsUUFBK0IsRUFBRTtRQUN6RSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxlQUFlLElBQUksS0FBSyxDQUFDO1FBRXZELHVDQUF1QztRQUN2QyxNQUFNLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUMvQyxXQUFXLEVBQUUsY0FBYztTQUM1QixDQUFDLENBQUM7UUFFSCxtREFBbUQ7UUFDbkQsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUNuRCxTQUFTLEVBQUUsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsMkJBQTJCLENBQUM7U0FDakUsQ0FBQyxDQUFDO1FBRUgsa0NBQWtDO1FBQ2xDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQzFDLE9BQU8sRUFBRSxDQUFDLGFBQWEsQ0FBQztZQUN4QixTQUFTLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1NBQy9CLENBQUMsQ0FBQyxDQUFDO1FBRUosa0NBQWtDO1FBQ2xDLElBQUksQ0FBQyxTQUFTLEdBQUcs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QyxDQUFDO1FBQzdGLGlCQUFpQixDQUFDLHNCQUFzQixHQUFHO1lBQ3pDLGNBQWMsRUFBRSw4QkFBOEIsRUFBRSxxREFBcUQ7WUFDckcsVUFBVSxFQUFFLG1CQUFtQjtZQUMvQixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU87WUFDeEIsY0FBYyxFQUFFLEtBQUs7U0FDdEIsQ0FBQztRQUVGLDBCQUEwQjtRQUMxQixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUNwQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVO1lBQy9CLFdBQVcsRUFBRSx5QkFBeUI7U0FDdkMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUMxQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0I7WUFDM0MsV0FBVyxFQUFFLGdDQUFnQztTQUM5QyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQ3hDLEtBQUssRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUc7WUFDNUIsV0FBVyxFQUFFLDZCQUE2QjtTQUMzQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUN2QyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTO1lBQy9CLFdBQVcsRUFBRSxxQ0FBcUM7U0FDbkQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBbFZELDRDQWtWQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIHNucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29nbml0b0NvbnN0cnVjdFByb3BzIHtcbiAgLyoqXG4gICAqIE9wdGlvbmFsIGVudmlyb25tZW50IG5hbWUgKGUuZy4sICdkZXYnLCAncHJvZCcpXG4gICAqL1xuICBlbnZpcm9ubWVudE5hbWU/OiBzdHJpbmc7XG4gIC8qKlxuICAgKiBPcHRpb25hbCBldmVudCBidXMgbmFtZSBmb3IgcHVibGlzaGluZyBldmVudHNcbiAgICovXG4gIGV2ZW50QnVzTmFtZT86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIENvZ25pdG9Db25zdHJ1Y3QgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgdXNlclBvb2w6IGNvZ25pdG8uVXNlclBvb2w7XG4gIHB1YmxpYyByZWFkb25seSB1c2VyUG9vbENsaWVudDogY29nbml0by5Vc2VyUG9vbENsaWVudDtcbiAgcHVibGljIHJlYWRvbmx5IGlkZW50aXR5UG9vbDogY29nbml0by5DZm5JZGVudGl0eVBvb2w7XG4gIHB1YmxpYyByZWFkb25seSBhdXRoZW50aWNhdGVkUm9sZTogaWFtLlJvbGU7XG4gIHB1YmxpYyByZWFkb25seSB1bmF1dGhlbnRpY2F0ZWRSb2xlOiBpYW0uUm9sZTtcbiAgcHVibGljIHJlYWRvbmx5IHVzZXJUYWJsZTogZHluYW1vZGIuVGFibGU7XG4gIHB1YmxpYyByZWFkb25seSBwb3N0Q29uZmlybWF0aW9uRnVuY3Rpb246IGxhbWJkYS5GdW5jdGlvbjtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQ29nbml0b0NvbnN0cnVjdFByb3BzID0ge30pIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgY29uc3QgZW52aXJvbm1lbnROYW1lID0gcHJvcHMuZW52aXJvbm1lbnROYW1lIHx8ICdkZXYnO1xuICAgIFxuICAgIC8vIENyZWF0ZSBhbiBTTlMgdG9waWMgZm9yIFNNUyBtZXNzYWdlc1xuICAgIGNvbnN0IHNtc1RvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCAnU01TVG9waWMnLCB7XG4gICAgICBkaXNwbGF5TmFtZTogJ1Rhc2sgQXBwIFNNUycsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgSUFNIHJvbGUgZm9yIENvZ25pdG8gdG8gc2VuZCBTTVMgbWVzc2FnZXNcbiAgICBjb25zdCBzbXNSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdDb2duaXRvU01TUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdjb2duaXRvLWlkcC5hbWF6b25hd3MuY29tJyksXG4gICAgfSk7XG5cbiAgICAvLyBBbGxvdyBDb2duaXRvIHRvIHB1Ymxpc2ggdG8gU05TXG4gICAgc21zUm9sZS5hZGRUb1BvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBhY3Rpb25zOiBbJ3NuczpQdWJsaXNoJ10sXG4gICAgICByZXNvdXJjZXM6IFtzbXNUb3BpYy50b3BpY0Fybl0sXG4gICAgfSkpO1xuXG4gICAgLy8gQ3JlYXRlIER5bmFtb0RCIHRhYmxlIGZvciB1c2Vyc1xuICAgIHRoaXMudXNlclRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdVc2VyVGFibGUnLCB7XG4gICAgICB0YWJsZU5hbWU6IGBUYXNrQXBwLVVzZXJzLSR7ZW52aXJvbm1lbnROYW1lfWAsXG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogJ3VzZXJJZCcsXG4gICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfSxcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLCAvLyBVc2UgUkVUQUlOIGZvciBwcm9kdWN0aW9uXG4gICAgICBwb2ludEluVGltZVJlY292ZXJ5OiB0cnVlLFxuICAgIH0pO1xuXG4gICAgLy8gQWRkIGVtYWlsIEdTSSBmb3IgcXVlcnlpbmcgdXNlcnMgYnkgZW1haWxcbiAgICB0aGlzLnVzZXJUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdFbWFpbEluZGV4JyxcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiAnZW1haWwnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBwcm9qZWN0aW9uVHlwZTogZHluYW1vZGIuUHJvamVjdGlvblR5cGUuQUxMLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIFBvc3QgQ29uZmlybWF0aW9uIExhbWJkYSBmdW5jdGlvblxuICAgIHRoaXMucG9zdENvbmZpcm1hdGlvbkZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnUG9zdENvbmZpcm1hdGlvbkZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICBoYW5kbGVyOiAncG9zdENvbmZpcm1hdGlvbkZ1bmN0aW9uLmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9kaXN0L2FkYXB0ZXJzL2luJykpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVVNFUl9UQUJMRV9OQU1FOiB0aGlzLnVzZXJUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIEVWRU5UX0JVU19OQU1FOiBwcm9wcy5ldmVudEJ1c05hbWUgfHwgJycsXG4gICAgICAgIFJFR0lPTjogY2RrLlN0YWNrLm9mKHRoaXMpLnJlZ2lvbixcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICBkZXNjcmlwdGlvbjogJ0hhbmRsZXMgcG9zdCBjb25maXJtYXRpb24gYWN0aW9ucyBmb3IgQ29nbml0byB1c2VycycsXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCB0aGUgTGFtYmRhIGZ1bmN0aW9uIHBlcm1pc3Npb25zIHRvIHdyaXRlIHRvIHRoZSB1c2VyIHRhYmxlXG4gICAgdGhpcy51c2VyVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHRoaXMucG9zdENvbmZpcm1hdGlvbkZ1bmN0aW9uKTtcblxuICAgIC8vIElmIGV2ZW50IGJ1cyBuYW1lIGlzIHByb3ZpZGVkLCBncmFudCBwZXJtaXNzaW9ucyB0byBwdWJsaXNoIGV2ZW50c1xuICAgIGlmIChwcm9wcy5ldmVudEJ1c05hbWUpIHtcbiAgICAgIHRoaXMucG9zdENvbmZpcm1hdGlvbkZ1bmN0aW9uLmFkZFRvUm9sZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGFjdGlvbnM6IFsnZXZlbnRzOlB1dEV2ZW50cyddLFxuICAgICAgICByZXNvdXJjZXM6IFtgYXJuOmF3czpldmVudHM6JHtjZGsuU3RhY2sub2YodGhpcykucmVnaW9ufToke2Nkay5TdGFjay5vZih0aGlzKS5hY2NvdW50fTpldmVudC1idXMvJHtwcm9wcy5ldmVudEJ1c05hbWV9YF0sXG4gICAgICB9KSk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIFVzZXIgUG9vbCB3aXRoIHNlY3VyaXR5LWZpcnN0IGFwcHJvYWNoXG4gICAgdGhpcy51c2VyUG9vbCA9IG5ldyBjb2duaXRvLlVzZXJQb29sKHRoaXMsICdVc2VyUG9vbCcsIHtcbiAgICAgIHVzZXJQb29sTmFtZTogYFRhc2tBcHAtVXNlclBvb2wtJHtlbnZpcm9ubWVudE5hbWV9YCxcbiAgICAgIHNlbGZTaWduVXBFbmFibGVkOiB0cnVlLFxuICAgICAgc2lnbkluQWxpYXNlczoge1xuICAgICAgICBlbWFpbDogdHJ1ZSxcbiAgICAgICAgcGhvbmU6IHRydWUsXG4gICAgICAgIHVzZXJuYW1lOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHN0YW5kYXJkQXR0cmlidXRlczoge1xuICAgICAgICBlbWFpbDoge1xuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG11dGFibGU6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHBob25lTnVtYmVyOiB7XG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgbXV0YWJsZTogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICAvLyBDb25maWd1cmUgc3Ryb25nIHBhc3N3b3JkIHBvbGljaWVzXG4gICAgICBwYXNzd29yZFBvbGljeToge1xuICAgICAgICBtaW5MZW5ndGg6IDEyLFxuICAgICAgICByZXF1aXJlTG93ZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlVXBwZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlRGlnaXRzOiB0cnVlLFxuICAgICAgICByZXF1aXJlU3ltYm9sczogdHJ1ZSxcbiAgICAgICAgdGVtcFBhc3N3b3JkVmFsaWRpdHk6IGNkay5EdXJhdGlvbi5ob3VycygyNCksIC8vIDI0IGhvdXJzIGZvciB0ZW1wb3JhcnkgcGFzc3dvcmQgZXhwaXJ5XG4gICAgICB9LFxuICAgICAgLy8gRW5hYmxlIE1GQSBhcyByZXF1aXJlZCBmb3IgYWxsIHVzZXJzXG4gICAgICBtZmE6IGNvZ25pdG8uTWZhLlJFUVVJUkVELFxuICAgICAgbWZhU2Vjb25kRmFjdG9yOiB7XG4gICAgICAgIHNtczogdHJ1ZSxcbiAgICAgICAgb3RwOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIC8vIENvbmZpZ3VyZSBTTVMgbWVzc2FnZSB0ZW1wbGF0ZVxuICAgICAgc21zUm9sZTogc21zUm9sZSxcbiAgICAgIHVzZXJWZXJpZmljYXRpb246IHtcbiAgICAgICAgZW1haWxTdWJqZWN0OiAnVmVyaWZ5IHlvdXIgZW1haWwgZm9yIFRhc2tBcHAnLFxuICAgICAgICBlbWFpbEJvZHk6ICdUaGFuayB5b3UgZm9yIHNpZ25pbmcgdXAgdG8gVGFza0FwcCEgWW91ciB2ZXJpZmljYXRpb24gY29kZSBpcyB7IyMjI30nLFxuICAgICAgICBlbWFpbFN0eWxlOiBjb2duaXRvLlZlcmlmaWNhdGlvbkVtYWlsU3R5bGUuQ09ERSxcbiAgICAgICAgc21zTWVzc2FnZTogJ1Rhc2tBcHA6IFlvdXIgdmVyaWZpY2F0aW9uIGNvZGUgaXMgeyMjIyN9LiBUaGlzIGNvZGUgd2lsbCBleHBpcmUgaW4gNSBtaW51dGVzLiBEbyBub3Qgc2hhcmUgdGhpcyBjb2RlIHdpdGggYW55b25lLicsXG4gICAgICB9LFxuICAgICAgLy8gQ29uZmlndXJlIGFjY291bnQgcmVjb3Zlcnkgc2V0dGluZ3NcbiAgICAgIGFjY291bnRSZWNvdmVyeTogY29nbml0by5BY2NvdW50UmVjb3ZlcnkuUEhPTkVfQU5EX0VNQUlMLFxuICAgICAgLy8gQWRkIExhbWJkYSB0cmlnZ2Vyc1xuICAgICAgbGFtYmRhVHJpZ2dlcnM6IHtcbiAgICAgICAgcG9zdENvbmZpcm1hdGlvbjogdGhpcy5wb3N0Q29uZmlybWF0aW9uRnVuY3Rpb24sXG4gICAgICB9LFxuICAgIH0pO1xuICAgIFxuICAgIC8vIEVuYWJsZSBjYXNlIHNlbnNpdGl2aXR5IGZvciB1c2VybmFtZXMgdG8gcHJldmVudCBlbnVtZXJhdGlvbiBhdHRhY2tzXG4gICAgY29uc3QgY2ZuVXNlclBvb2wgPSB0aGlzLnVzZXJQb29sLm5vZGUuZGVmYXVsdENoaWxkIGFzIGNvZ25pdG8uQ2ZuVXNlclBvb2w7XG4gICAgY2ZuVXNlclBvb2wudXNlcm5hbWVDb25maWd1cmF0aW9uID0ge1xuICAgICAgY2FzZVNlbnNpdGl2ZTogdHJ1ZSxcbiAgICB9O1xuICAgIFxuICAgIC8vIFNldCBPVFAgZXhwaXJ5IHRpbWUgKDUgbWludXRlcykgYW5kIHBhc3N3b3JkIGhpc3RvcnlcbiAgICBpZiAoIWNmblVzZXJQb29sLnBvbGljaWVzKSB7XG4gICAgICBjZm5Vc2VyUG9vbC5wb2xpY2llcyA9IHt9O1xuICAgIH1cbiAgICBcbiAgICBjZm5Vc2VyUG9vbC5wb2xpY2llcyA9IHtcbiAgICAgIC4uLmNmblVzZXJQb29sLnBvbGljaWVzLFxuICAgICAgcGFzc3dvcmRQb2xpY3k6IHtcbiAgICAgICAgbWluaW11bUxlbmd0aDogMTIsXG4gICAgICAgIHJlcXVpcmVMb3dlcmNhc2U6IHRydWUsXG4gICAgICAgIHJlcXVpcmVVcHBlcmNhc2U6IHRydWUsXG4gICAgICAgIHJlcXVpcmVOdW1iZXJzOiB0cnVlLFxuICAgICAgICByZXF1aXJlU3ltYm9sczogdHJ1ZSxcbiAgICAgICAgdGVtcG9yYXJ5UGFzc3dvcmRWYWxpZGl0eURheXM6IDEsXG4gICAgICAgIHBhc3N3b3JkSGlzdG9yeVNpemU6IDEyXG4gICAgICB9LFxuICAgIH07XG4gICAgXG4gICAgLy8gU2V0IHZlcmlmaWNhdGlvbiBtZXNzYWdlIFRUTFxuICAgIGNmblVzZXJQb29sLnZlcmlmaWNhdGlvbk1lc3NhZ2VUZW1wbGF0ZSA9IHtcbiAgICAgIC4uLmNmblVzZXJQb29sLnZlcmlmaWNhdGlvbk1lc3NhZ2VUZW1wbGF0ZSxcbiAgICAgIGVtYWlsTWVzc2FnZTogJ1RoYW5rIHlvdSBmb3Igc2lnbmluZyB1cCB0byBUYXNrQXBwISBZb3VyIHZlcmlmaWNhdGlvbiBjb2RlIGlzIHsjIyMjfScsXG4gICAgICBlbWFpbFN1YmplY3Q6ICdWZXJpZnkgeW91ciBlbWFpbCBmb3IgVGFza0FwcCcsXG4gICAgICBzbXNNZXNzYWdlOiAnVGFza0FwcDogWW91ciB2ZXJpZmljYXRpb24gY29kZSBpcyB7IyMjI30uIFRoaXMgY29kZSB3aWxsIGV4cGlyZSBpbiA1IG1pbnV0ZXMuJyxcbiAgICAgIGRlZmF1bHRFbWFpbE9wdGlvbjogJ0NPTkZJUk1fV0lUSF9DT0RFJyxcbiAgICB9O1xuXG4gICAgLy8gQWRkIGRvbWFpbiBmb3IgaG9zdGVkIFVJXG4gICAgdGhpcy51c2VyUG9vbC5hZGREb21haW4oJ0NvZ25pdG9Eb21haW4nLCB7XG4gICAgICBjb2duaXRvRG9tYWluOiB7XG4gICAgICAgIGRvbWFpblByZWZpeDogYHRhc2thcHAtJHtlbnZpcm9ubWVudE5hbWV9LSR7Y2RrLlN0YWNrLm9mKHRoaXMpLmFjY291bnQuc3Vic3RyaW5nKDAsIDgpfWAsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQ29uZmlndXJlIGF0dGVtcHQgbGltaXRzICgzIG1heCkgYW5kIGFjY291bnQgbG9ja291dFxuICAgIGNmblVzZXJQb29sLmFjY291bnRSZWNvdmVyeVNldHRpbmcgPSB7XG4gICAgICByZWNvdmVyeU1lY2hhbmlzbXM6IFtcbiAgICAgICAgeyBuYW1lOiAndmVyaWZpZWRfcGhvbmVfbnVtYmVyJywgcHJpb3JpdHk6IDEgfSxcbiAgICAgICAgeyBuYW1lOiAndmVyaWZpZWRfZW1haWwnLCBwcmlvcml0eTogMiB9LFxuICAgICAgXSxcbiAgICB9O1xuXG4gICAgLy8gQ29uZmlndXJlIGFkdmFuY2VkIHNlY3VyaXR5IGZlYXR1cmVzXG4gICAgY2ZuVXNlclBvb2wudXNlclBvb2xBZGRPbnMgPSB7XG4gICAgICBhZHZhbmNlZFNlY3VyaXR5TW9kZTogJ0VORk9SQ0VEJyxcbiAgICB9O1xuXG4gICAgLy8gU2V0IGFjY291bnQgbG9ja291dCBhZnRlciAzIGZhaWxlZCBhdHRlbXB0c1xuICAgIGNmblVzZXJQb29sLmFkbWluQ3JlYXRlVXNlckNvbmZpZyA9IHtcbiAgICAgIGFsbG93QWRtaW5DcmVhdGVVc2VyT25seTogZmFsc2UsXG4gICAgfTtcblxuICAgIC8vIEFkZCBjdXN0b20gYXR0cmlidXRlcyBmb3IgcmlzayBzY29yaW5nXG4gICAgdGhpcy51c2VyUG9vbC5hZGRSZXNvdXJjZVNlcnZlcignUmVzb3VyY2VTZXJ2ZXInLCB7XG4gICAgICBpZGVudGlmaWVyOiAndGFza2FwcCcsXG4gICAgICBzY29wZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHNjb3BlTmFtZTogJ3JlYWQnLFxuICAgICAgICAgIHNjb3BlRGVzY3JpcHRpb246ICdSZWFkIGFjY2VzcycsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzY29wZU5hbWU6ICd3cml0ZScsXG4gICAgICAgICAgc2NvcGVEZXNjcmlwdGlvbjogJ1dyaXRlIGFjY2VzcycsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIFVzZXIgUG9vbCBDbGllbnRcbiAgICB0aGlzLnVzZXJQb29sQ2xpZW50ID0gdGhpcy51c2VyUG9vbC5hZGRDbGllbnQoJ1VzZXJQb29sQ2xpZW50Jywge1xuICAgICAgdXNlclBvb2xDbGllbnROYW1lOiBgVGFza0FwcC1DbGllbnQtJHtlbnZpcm9ubWVudE5hbWV9YCxcbiAgICAgIGF1dGhGbG93czoge1xuICAgICAgICB1c2VyUGFzc3dvcmQ6IHRydWUsXG4gICAgICAgIHVzZXJTcnA6IHRydWUsXG4gICAgICAgIGFkbWluVXNlclBhc3N3b3JkOiB0cnVlLFxuICAgICAgICBjdXN0b206IHRydWUsXG4gICAgICB9LFxuICAgICAgc3VwcG9ydGVkSWRlbnRpdHlQcm92aWRlcnM6IFtcbiAgICAgICAgY29nbml0by5Vc2VyUG9vbENsaWVudElkZW50aXR5UHJvdmlkZXIuQ09HTklUTyxcbiAgICAgIF0sXG4gICAgICBwcmV2ZW50VXNlckV4aXN0ZW5jZUVycm9yczogdHJ1ZSwgLy8gUHJldmVudCB1c2VyIGVudW1lcmF0aW9uXG4gICAgICBhY2Nlc3NUb2tlblZhbGlkaXR5OiBjZGsuRHVyYXRpb24uaG91cnMoMSksXG4gICAgICBpZFRva2VuVmFsaWRpdHk6IGNkay5EdXJhdGlvbi5ob3VycygxKSxcbiAgICAgIHJlZnJlc2hUb2tlblZhbGlkaXR5OiBjZGsuRHVyYXRpb24uZGF5cygzMCksXG4gICAgICBlbmFibGVUb2tlblJldm9jYXRpb246IHRydWUsXG4gICAgICBvQXV0aDoge1xuICAgICAgICBmbG93czoge1xuICAgICAgICAgIGF1dGhvcml6YXRpb25Db2RlR3JhbnQ6IHRydWUsXG4gICAgICAgICAgaW1wbGljaXRDb2RlR3JhbnQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHNjb3BlczogW1xuICAgICAgICAgIGNvZ25pdG8uT0F1dGhTY29wZS5FTUFJTCxcbiAgICAgICAgICBjb2duaXRvLk9BdXRoU2NvcGUuUEhPTkUsXG4gICAgICAgICAgY29nbml0by5PQXV0aFNjb3BlLk9QRU5JRCxcbiAgICAgICAgICBjb2duaXRvLk9BdXRoU2NvcGUuUFJPRklMRSxcbiAgICAgICAgXSxcbiAgICAgICAgY2FsbGJhY2tVcmxzOiBbJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMC9jYWxsYmFjayddLFxuICAgICAgICBsb2dvdXRVcmxzOiBbJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMC9sb2dvdXQnXSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgSWRlbnRpdHkgUG9vbFxuICAgIHRoaXMuaWRlbnRpdHlQb29sID0gbmV3IGNvZ25pdG8uQ2ZuSWRlbnRpdHlQb29sKHRoaXMsICdJZGVudGl0eVBvb2wnLCB7XG4gICAgICBpZGVudGl0eVBvb2xOYW1lOiBgVGFza0FwcC1JZGVudGl0eVBvb2wtJHtlbnZpcm9ubWVudE5hbWV9YCxcbiAgICAgIGFsbG93VW5hdXRoZW50aWNhdGVkSWRlbnRpdGllczogZmFsc2UsXG4gICAgICBjb2duaXRvSWRlbnRpdHlQcm92aWRlcnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGNsaWVudElkOiB0aGlzLnVzZXJQb29sQ2xpZW50LnVzZXJQb29sQ2xpZW50SWQsXG4gICAgICAgICAgcHJvdmlkZXJOYW1lOiB0aGlzLnVzZXJQb29sLnVzZXJQb29sUHJvdmlkZXJOYW1lLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBJQU0gcm9sZXMgZm9yIGF1dGhlbnRpY2F0ZWQgYW5kIHVuYXV0aGVudGljYXRlZCB1c2Vyc1xuICAgIHRoaXMuYXV0aGVudGljYXRlZFJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ0F1dGhlbnRpY2F0ZWRSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLkZlZGVyYXRlZFByaW5jaXBhbChcbiAgICAgICAgJ2NvZ25pdG8taWRlbnRpdHkuYW1hem9uYXdzLmNvbScsXG4gICAgICAgIHtcbiAgICAgICAgICBTdHJpbmdFcXVhbHM6IHtcbiAgICAgICAgICAgICdjb2duaXRvLWlkZW50aXR5LmFtYXpvbmF3cy5jb206YXVkJzogdGhpcy5pZGVudGl0eVBvb2wucmVmLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgJ0ZvckFueVZhbHVlOlN0cmluZ0xpa2UnOiB7XG4gICAgICAgICAgICAnY29nbml0by1pZGVudGl0eS5hbWF6b25hd3MuY29tOmFtcic6ICdhdXRoZW50aWNhdGVkJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICAnc3RzOkFzc3VtZVJvbGVXaXRoV2ViSWRlbnRpdHknXG4gICAgICApLFxuICAgIH0pO1xuXG4gICAgdGhpcy51bmF1dGhlbnRpY2F0ZWRSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdVbmF1dGhlbnRpY2F0ZWRSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLkZlZGVyYXRlZFByaW5jaXBhbChcbiAgICAgICAgJ2NvZ25pdG8taWRlbnRpdHkuYW1hem9uYXdzLmNvbScsXG4gICAgICAgIHtcbiAgICAgICAgICBTdHJpbmdFcXVhbHM6IHtcbiAgICAgICAgICAgICdjb2duaXRvLWlkZW50aXR5LmFtYXpvbmF3cy5jb206YXVkJzogdGhpcy5pZGVudGl0eVBvb2wucmVmLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgJ0ZvckFueVZhbHVlOlN0cmluZ0xpa2UnOiB7XG4gICAgICAgICAgICAnY29nbml0by1pZGVudGl0eS5hbWF6b25hd3MuY29tOmFtcic6ICd1bmF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgICdzdHM6QXNzdW1lUm9sZVdpdGhXZWJJZGVudGl0eSdcbiAgICAgICksXG4gICAgfSk7XG5cbiAgICAvLyBBdHRhY2ggbWluaW1hbCBwZXJtaXNzaW9ucyB0byB0aGUgcm9sZXNcbiAgICB0aGlzLmF1dGhlbnRpY2F0ZWRSb2xlLmFkZFRvUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAnbW9iaWxlYW5hbHl0aWNzOlB1dEV2ZW50cycsXG4gICAgICAgICAgJ2NvZ25pdG8tc3luYzoqJyxcbiAgICAgICAgXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIHRoaXMudW5hdXRoZW50aWNhdGVkUm9sZS5hZGRUb1BvbGljeShcbiAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgJ21vYmlsZWFuYWx5dGljczpQdXRFdmVudHMnLFxuICAgICAgICAgICdjb2duaXRvLXN5bmM6KicsXG4gICAgICAgIF0sXG4gICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBBdHRhY2ggcm9sZXMgdG8gSWRlbnRpdHkgUG9vbFxuICAgIG5ldyBjb2duaXRvLkNmbklkZW50aXR5UG9vbFJvbGVBdHRhY2htZW50KHRoaXMsICdJZGVudGl0eVBvb2xSb2xlQXR0YWNobWVudCcsIHtcbiAgICAgIGlkZW50aXR5UG9vbElkOiB0aGlzLmlkZW50aXR5UG9vbC5yZWYsXG4gICAgICByb2xlczoge1xuICAgICAgICBhdXRoZW50aWNhdGVkOiB0aGlzLmF1dGhlbnRpY2F0ZWRSb2xlLnJvbGVBcm4sXG4gICAgICAgIHVuYXV0aGVudGljYXRlZDogdGhpcy51bmF1dGhlbnRpY2F0ZWRSb2xlLnJvbGVBcm4sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQ29uZmlndXJlIExhbWJkYSB0cmlnZ2VycyBmb3IgY3VzdG9tIGF1dGhlbnRpY2F0aW9uIGxvZ2ljXG4gICAgY29uc3QgY2ZuVXNlclBvb2xDbGllbnQgPSB0aGlzLnVzZXJQb29sQ2xpZW50Lm5vZGUuZGVmYXVsdENoaWxkIGFzIGNvZ25pdG8uQ2ZuVXNlclBvb2xDbGllbnQ7XG4gICAgY2ZuVXNlclBvb2xDbGllbnQuYW5hbHl0aWNzQ29uZmlndXJhdGlvbiA9IHtcbiAgICAgIGFwcGxpY2F0aW9uQXJuOiAnYXJuOmF3czpjb2duaXRvLWlkcDo6OmFwcEFybicsIC8vIFBsYWNlaG9sZGVyLCByZXBsYWNlIHdpdGggYWN0dWFsIGFwcCBBUk4gaWYgbmVlZGVkXG4gICAgICBleHRlcm5hbElkOiAndGFza2FwcC1hbmFseXRpY3MnLFxuICAgICAgcm9sZUFybjogc21zUm9sZS5yb2xlQXJuLFxuICAgICAgdXNlckRhdGFTaGFyZWQ6IGZhbHNlLFxuICAgIH07XG5cbiAgICAvLyBPdXRwdXQgaW1wb3J0YW50IHZhbHVlc1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyUG9vbElkJywge1xuICAgICAgdmFsdWU6IHRoaXMudXNlclBvb2wudXNlclBvb2xJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIElEIG9mIHRoZSBVc2VyIFBvb2wnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1VzZXJQb29sQ2xpZW50SWQnLCB7XG4gICAgICB2YWx1ZTogdGhpcy51c2VyUG9vbENsaWVudC51c2VyUG9vbENsaWVudElkLFxuICAgICAgZGVzY3JpcHRpb246ICdUaGUgSUQgb2YgdGhlIFVzZXIgUG9vbCBDbGllbnQnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0lkZW50aXR5UG9vbElkJywge1xuICAgICAgdmFsdWU6IHRoaXMuaWRlbnRpdHlQb29sLnJlZixcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIElEIG9mIHRoZSBJZGVudGl0eSBQb29sJyxcbiAgICB9KTtcbiAgICBcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclRhYmxlTmFtZScsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnVzZXJUYWJsZS50YWJsZU5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1RoZSBuYW1lIG9mIHRoZSBVc2VyIER5bmFtb0RCIHRhYmxlJyxcbiAgICB9KTtcbiAgfVxufVxuIl19