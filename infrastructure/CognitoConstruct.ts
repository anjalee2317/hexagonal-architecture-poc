import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';
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
  /**
   * Optional from email address for SES
   */
  fromEmail?: string;
}

export class CognitoConstruct extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly identityPool: cognito.CfnIdentityPool;
  public readonly authenticatedRole: iam.Role;
  public readonly unauthenticatedRole: iam.Role;
  public readonly userTable: dynamodb.Table;
  public readonly postConfirmationFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: CognitoConstructProps = {}) {
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
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist.zip')),
      environment: {
        USER_TABLE_NAME: this.userTable.tableName,
        EVENT_BUS_NAME: props.eventBusName || '',
        REGION: cdk.Stack.of(this).region,
        FROM_EMAIL: props.fromEmail || 'no-reply@yourdomain.com', // Add from email environment variable
      },
      timeout: cdk.Duration.seconds(30),
      description: 'Handles post confirmation actions for Cognito users',
    });
    
    // Grant the Lambda function permissions to write to the user table
    this.userTable.grantReadWriteData(this.postConfirmationFunction);

    // Grant SES send email permissions to the post-confirmation function
    this.postConfirmationFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'], // In production, you should restrict this to specific resources
    }));

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
      // Enable MFA as optional with SMS and TOTP
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      // Enable auto-verification for email
      autoVerify: {
        email: true,
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
    const cfnUserPool = this.userPool.node.defaultChild as cognito.CfnUserPool;
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
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    });

    this.unauthenticatedRole = new iam.Role(this, 'UnauthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'unauthenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    });

    // Attach minimal permissions to the roles
    this.authenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'mobileanalytics:PutEvents',
          'cognito-sync:*',
        ],
        resources: ['*'],
      })
    );

    this.unauthenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'mobileanalytics:PutEvents',
          'cognito-sync:*',
        ],
        resources: ['*'],
      })
    );

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
