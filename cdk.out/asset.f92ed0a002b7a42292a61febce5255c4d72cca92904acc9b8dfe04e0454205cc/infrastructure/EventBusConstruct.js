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
exports.EventBusConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const events = __importStar(require("aws-cdk-lib/aws-events"));
const targets = __importStar(require("aws-cdk-lib/aws-events-targets"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const path = __importStar(require("path"));
const constructs_1 = require("constructs");
/**
 * CDK construct for EventBridge event bus and notification Lambda
 */
class EventBusConstruct extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        const environmentName = props.environmentName;
        // Create custom event bus
        this.eventBus = new events.EventBus(this, 'TaskEventBus', {
            eventBusName: `task-event-bus-${environmentName}`
        });
        // Create notification Lambda function
        this.notificationLambda = new lambda.Function(this, 'NotificationFunction', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'notificationFunction.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dist', 'src', 'adapters', 'in')),
            environment: {
                ENVIRONMENT: environmentName,
                REGION: cdk.Stack.of(this).region,
                DEFAULT_SENDER: `noreply@taskapp-${environmentName}.com`
            },
            timeout: cdk.Duration.seconds(30),
            description: 'Lambda function to process notification events and send emails',
        });
        // Grant SES permissions to the notification Lambda
        this.notificationLambda.addToRolePolicy(new iam.PolicyStatement({
            actions: [
                'ses:SendEmail',
                'ses:SendRawEmail',
                'ses:SendTemplatedEmail'
            ],
            resources: ['*'], // For production, restrict to specific SES ARNs
            effect: iam.Effect.ALLOW
        }));
        // Create event rules for user registration events
        const userRegistrationRule = new events.Rule(this, 'UserRegistrationRule', {
            eventBus: this.eventBus,
            eventPattern: {
                source: ['com.taskapp.auth'],
                detailType: ['UserRegistration']
            },
            ruleName: `user-registration-rule-${environmentName}`,
            description: 'Rule to capture user registration events',
        });
        userRegistrationRule.addTarget(new targets.LambdaFunction(this.notificationLambda));
        // Create event rules for task creation events
        const taskCreationRule = new events.Rule(this, 'TaskCreationRule', {
            eventBus: this.eventBus,
            eventPattern: {
                source: ['com.taskapp.tasks'],
                detailType: ['TaskCreation']
            },
            ruleName: `task-creation-rule-${environmentName}`,
            description: 'Rule to capture task creation events',
        });
        taskCreationRule.addTarget(new targets.LambdaFunction(this.notificationLambda));
        // Create event rules for task completion events
        const taskCompletionRule = new events.Rule(this, 'TaskCompletionRule', {
            eventBus: this.eventBus,
            eventPattern: {
                source: ['com.taskapp.tasks'],
                detailType: ['TaskCompletion']
            },
            ruleName: `task-completion-rule-${environmentName}`,
            description: 'Rule to capture task completion events',
        });
        taskCompletionRule.addTarget(new targets.LambdaFunction(this.notificationLambda));
        // Grant the event bus permission to invoke the Lambda
        this.notificationLambda.addPermission('EventBusInvokePermission', {
            principal: new iam.ServicePrincipal('events.amazonaws.com'),
            sourceArn: this.eventBus.eventBusArn,
        });
        // Output the event bus ARN
        new cdk.CfnOutput(this, 'EventBusArn', {
            value: this.eventBus.eventBusArn,
            description: 'ARN of the Event Bus',
        });
        // Output the notification Lambda ARN
        new cdk.CfnOutput(this, 'NotificationLambdaArn', {
            value: this.notificationLambda.functionArn,
            description: 'ARN of the Notification Lambda',
        });
    }
}
exports.EventBusConstruct = EventBusConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXZlbnRCdXNDb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9pbmZyYXN0cnVjdHVyZS9FdmVudEJ1c0NvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsK0RBQWlEO0FBQ2pELHdFQUEwRDtBQUMxRCwrREFBaUQ7QUFDakQseURBQTJDO0FBQzNDLDJDQUE2QjtBQUM3QiwyQ0FBdUM7QUFZdkM7O0dBRUc7QUFDSCxNQUFhLGlCQUFrQixTQUFRLHNCQUFTO0lBVzlDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBb0I7UUFDNUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO1FBRTlDLDBCQUEwQjtRQUMxQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQ3hELFlBQVksRUFBRSxrQkFBa0IsZUFBZSxFQUFFO1NBQ2xELENBQUMsQ0FBQztRQUVILHNDQUFzQztRQUN0QyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRTtZQUMxRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSw4QkFBOEI7WUFDdkMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN4RixXQUFXLEVBQUU7Z0JBQ1gsV0FBVyxFQUFFLGVBQWU7Z0JBQzVCLE1BQU0sRUFBRSxHQUFHLENB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LENBQUM7UUFFSCxxQ0FBcUM7UUFDckMsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSx1QkFBdUIsRUFBRTtZQUMvQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFdBQVc7WUFDMUMsV0FBVyxFQUFFLGdDQUFnQztTQUM5QyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF6R0QsOENBeUdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGV2ZW50cyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZXZlbnRzJztcbmltcG9ydCAqIGFzIHRhcmdldHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cy10YXJnZXRzJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuLyoqXG4gKiBQcm9wZXJ0aWVzIGZvciB0aGUgRXZlbnRCdXNDb25zdHJ1Y3RcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBFdmVudEJ1c1Byb3BzIHtcbiAgLyoqXG4gICAqIEVudmlyb25tZW50IG5hbWUgKGUuZy4sIGRldiwgcHJvZClcbiAgICovXG4gIGVudmlyb25tZW50TmFtZTogc3RyaW5nO1xufVxuXG4vKipcbiAqIENESyBjb25zdHJ1Y3QgZm9yIEV2ZW50QnJpZGdlIGV2ZW50IGJ1cyBhbmQgbm90aWZpY2F0aW9uIExhbWJkYVxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRCdXNDb25zdHJ1Y3QgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICAvKipcbiAgICogVGhlIEV2ZW50QnJpZGdlIGV2ZW50IGJ1c1xuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGV2ZW50QnVzOiBldmVudHMuRXZlbnRCdXM7XG4gIFxuICAvKipcbiAgICogVGhlIG5vdGlmaWNhdGlvbiBMYW1iZGEgZnVuY3Rpb25cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBub3RpZmljYXRpb25MYW1iZGE6IGxhbWJkYS5GdW5jdGlvbjtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogRXZlbnRCdXNQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICBjb25zdCBlbnZpcm9ubWVudE5hbWUgPSBwcm9wcy5lbnZpcm9ubWVudE5hbWU7XG5cbiAgICAvLyBDcmVhdGUgY3VzdG9tIGV2ZW50IGJ1c1xuICAgIHRoaXMuZXZlbnRCdXMgPSBuZXcgZXZlbnRzLkV2ZW50QnVzKHRoaXMsICdUYXNrRXZlbnRCdXMnLCB7XG4gICAgICBldmVudEJ1c05hbWU6IGB0YXNrLWV2ZW50LWJ1cy0ke2Vudmlyb25tZW50TmFtZX1gXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgbm90aWZpY2F0aW9uIExhbWJkYSBmdW5jdGlvblxuICAgIHRoaXMubm90aWZpY2F0aW9uTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnTm90aWZpY2F0aW9uRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgIGhhbmRsZXI6ICdub3RpZmljYXRpb25GdW5jdGlvbi5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnZGlzdCcsICdzcmMnLCAnYWRhcHRlcnMnLCAnaW4nKSksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBFTlZJUk9OTUVOVDogZW52aXJvbm1lbnROYW1lLFxuICAgICAgICBSRUdJT046IGNkay5TdGFjay5vZih0aGlzKS5yZWdpb24sXG4gICAgICAgIERFRkFVTFRfU0VOREVSOiBgbm9yZXBseUB0YXNrYXBwLSR7ZW52aXJvbm1lbnROYW1lfS5jb21gXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgZGVzY3JpcHRpb246ICdMYW1iZGEgZnVuY3Rpb24gdG8gcHJvY2VzcyBub3RpZmljYXRpb24gZXZlbnRzIGFuZCBzZW5kIGVtYWlscycsXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCBTRVMgcGVybWlzc2lvbnMgdG8gdGhlIG5vdGlmaWNhdGlvbiBMYW1iZGFcbiAgICB0aGlzLm5vdGlmaWNhdGlvbkxhbWJkYS5hZGRUb1JvbGVQb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAnc2VzOlNlbmRFbWFpbCcsXG4gICAgICAgICAgJ3NlczpTZW5kUmF3RW1haWwnLFxuICAgICAgICAgICdzZXM6U2VuZFRlbXBsYXRlZEVtYWlsJ1xuICAgICAgICBdLFxuICAgICAgICByZXNvdXJjZXM6IFsnKiddLCAvLyBGb3IgcHJvZHVjdGlvbiwgcmVzdHJpY3QgdG8gc3BlY2lmaWMgU0VTIEFSTnNcbiAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgZXZlbnQgcnVsZXMgZm9yIHVzZXIgcmVnaXN0cmF0aW9uIGV2ZW50c1xuICAgIGNvbnN0IHVzZXJSZWdpc3RyYXRpb25SdWxlID0gbmV3IGV2ZW50cy5SdWxlKHRoaXMsICdVc2VyUmVnaXN0cmF0aW9uUnVsZScsIHtcbiAgICAgIGV2ZW50QnVzOiB0aGlzLmV2ZW50QnVzLFxuICAgICAgZXZlbnRQYXR0ZXJuOiB7XG4gICAgICAgIHNvdXJjZTogWydjb20udGFza2FwcC5hdXRoJ10sXG4gICAgICAgIGRldGFpbFR5cGU6IFsnVXNlclJlZ2lzdHJhdGlvbiddXG4gICAgICB9LFxuICAgICAgcnVsZU5hbWU6IGB1c2VyLXJlZ2lzdHJhdGlvbi1ydWxlLSR7ZW52aXJvbm1lbnROYW1lfWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ1J1bGUgdG8gY2FwdHVyZSB1c2VyIHJlZ2lzdHJhdGlvbiBldmVudHMnLFxuICAgIH0pO1xuICAgIFxuICAgIHVzZXJSZWdpc3RyYXRpb25SdWxlLmFkZFRhcmdldChuZXcgdGFyZ2V0cy5MYW1iZGFGdW5jdGlvbih0aGlzLm5vdGlmaWNhdGlvbkxhbWJkYSkpO1xuXG4gICAgLy8gQ3JlYXRlIGV2ZW50IHJ1bGVzIGZvciB0YXNrIGNyZWF0aW9uIGV2ZW50c1xuICAgIGNvbnN0IHRhc2tDcmVhdGlvblJ1bGUgPSBuZXcgZXZlbnRzLlJ1bGUodGhpcywgJ1Rhc2tDcmVhdGlvblJ1bGUnLCB7XG4gICAgICBldmVudEJ1czogdGhpcy5ldmVudEJ1cyxcbiAgICAgIGV2ZW50UGF0dGVybjoge1xuICAgICAgICBzb3VyY2U6IFsnY29tLnRhc2thcHAudGFza3MnXSxcbiAgICAgICAgZGV0YWlsVHlwZTogWydUYXNrQ3JlYXRpb24nXVxuICAgICAgfSxcbiAgICAgIHJ1bGVOYW1lOiBgdGFzay1jcmVhdGlvbi1ydWxlLSR7ZW52aXJvbm1lbnROYW1lfWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ1J1bGUgdG8gY2FwdHVyZSB0YXNrIGNyZWF0aW9uIGV2ZW50cycsXG4gICAgfSk7XG4gICAgXG4gICAgdGFza0NyZWF0aW9uUnVsZS5hZGRUYXJnZXQobmV3IHRhcmdldHMuTGFtYmRhRnVuY3Rpb24odGhpcy5ub3RpZmljYXRpb25MYW1iZGEpKTtcblxuICAgIC8vIENyZWF0ZSBldmVudCBydWxlcyBmb3IgdGFzayBjb21wbGV0aW9uIGV2ZW50c1xuICAgIGNvbnN0IHRhc2tDb21wbGV0aW9uUnVsZSA9IG5ldyBldmVudHMuUnVsZSh0aGlzLCAnVGFza0NvbXBsZXRpb25SdWxlJywge1xuICAgICAgZXZlbnRCdXM6IHRoaXMuZXZlbnRCdXMsXG4gICAgICBldmVudFBhdHRlcm46IHtcbiAgICAgICAgc291cmNlOiBbJ2NvbS50YXNrYXBwLnRhc2tzJ10sXG4gICAgICAgIGRldGFpbFR5cGU6IFsnVGFza0NvbXBsZXRpb24nXVxuICAgICAgfSxcbiAgICAgIHJ1bGVOYW1lOiBgdGFzay1jb21wbGV0aW9uLXJ1bGUtJHtlbnZpcm9ubWVudE5hbWV9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUnVsZSB0byBjYXB0dXJlIHRhc2sgY29tcGxldGlvbiBldmVudHMnLFxuICAgIH0pO1xuICAgIFxuICAgIHRhc2tDb21wbGV0aW9uUnVsZS5hZGRUYXJnZXQobmV3IHRhcmdldHMuTGFtYmRhRnVuY3Rpb24odGhpcy5ub3RpZmljYXRpb25MYW1iZGEpKTtcblxuICAgIC8vIEdyYW50IHRoZSBldmVudCBidXMgcGVybWlzc2lvbiB0byBpbnZva2UgdGhlIExhbWJkYVxuICAgIHRoaXMubm90aWZpY2F0aW9uTGFtYmRhLmFkZFBlcm1pc3Npb24oJ0V2ZW50QnVzSW52b2tlUGVybWlzc2lvbicsIHtcbiAgICAgIHByaW5jaXBhbDogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdldmVudHMuYW1hem9uYXdzLmNvbScpLFxuICAgICAgc291cmNlQXJuOiB0aGlzLmV2ZW50QnVzLmV2ZW50QnVzQXJuLFxuICAgIH0pO1xuXG4gICAgLy8gT3V0cHV0IHRoZSBldmVudCBidXMgQVJOXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0V2ZW50QnVzQXJuJywge1xuICAgICAgdmFsdWU6IHRoaXMuZXZlbnRCdXMuZXZlbnRCdXNBcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ0FSTiBvZiB0aGUgRXZlbnQgQnVzJyxcbiAgICB9KTtcblxuICAgIC8vIE91dHB1dCB0aGUgbm90aWZpY2F0aW9uIExhbWJkYSBBUk5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnTm90aWZpY2F0aW9uTGFtYmRhQXJuJywge1xuICAgICAgdmFsdWU6IHRoaXMubm90aWZpY2F0aW9uTGFtYmRhLmZ1bmN0aW9uQXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdBUk4gb2YgdGhlIE5vdGlmaWNhdGlvbiBMYW1iZGEnLFxuICAgIH0pO1xuICB9XG59XG4iXX0=