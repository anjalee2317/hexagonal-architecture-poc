"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const NotificationService_1 = require("../../application/services/NotificationService");
/**
 * Lambda function handler for processing notification events from EventBridge
 * @param event EventBridge event
 */
const handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    try {
        // Extract event details
        const { source, 'detail-type': detailType, detail } = event;
        // Create notification service with default sender from environment variable
        const defaultSender = process.env.DEFAULT_SENDER || 'noreply@taskapp.com';
        const region = process.env.REGION || 'us-east-1';
        const notificationService = new NotificationService_1.NotificationService(defaultSender, region);
        // Process different event types
        switch (detailType) {
            case 'UserRegistration':
                await processUserRegistration(notificationService, detail);
                break;
            case 'TaskCreation':
                await processTaskCreation(notificationService, detail);
                break;
            case 'TaskCompletion':
                await processTaskCompletion(notificationService, detail);
                break;
            default:
                console.log(`Unhandled event type: ${detailType}`);
        }
    }
    catch (error) {
        console.error('Error processing notification event:', error);
        throw error;
    }
};
exports.handler = handler;
/**
 * Process user registration events
 * @param notificationService Notification service
 * @param detail Event detail
 */
async function processUserRegistration(notificationService, detail) {
    console.log('Processing user registration event:', detail);
    const { username, email } = detail;
    if (!email) {
        console.warn('No email address provided in user registration event');
        return;
    }
    // Create welcome email
    const subject = 'Welcome to TaskApp!';
    const body = createWelcomeEmailBody(username);
    // Send email
    await notificationService.sendEmail({
        to: email,
        subject,
        body,
        isHtml: true
    });
    console.log(`Welcome email sent to ${email}`);
}
/**
 * Process task creation events
 * @param notificationService Notification service
 * @param detail Event detail
 */
async function processTaskCreation(notificationService, detail) {
    console.log('Processing task creation event:', detail);
    const { taskId, title, description, userEmail } = detail;
    if (!userEmail) {
        console.warn('No email address provided in task creation event');
        return;
    }
    // Create task creation confirmation email
    const subject = 'New Task Created';
    const body = createTaskCreationEmailBody(title, description, taskId);
    // Send email
    await notificationService.sendEmail({
        to: userEmail,
        subject,
        body,
        isHtml: true
    });
    console.log(`Task creation confirmation email sent to ${userEmail}`);
}
/**
 * Process task completion events
 * @param notificationService Notification service
 * @param detail Event detail
 */
async function processTaskCompletion(notificationService, detail) {
    console.log('Processing task completion event:', detail);
    const { taskId, title, completedAt, userEmail } = detail;
    if (!userEmail) {
        console.warn('No email address provided in task completion event');
        return;
    }
    // Create task completion confirmation email
    const subject = 'Task Completed';
    const body = createTaskCompletionEmailBody(title, taskId, completedAt);
    // Send email
    await notificationService.sendEmail({
        to: userEmail,
        subject,
        body,
        isHtml: true
    });
    console.log(`Task completion confirmation email sent to ${userEmail}`);
}
/**
 * Create welcome email body
 * @param username Username
 * @returns HTML email body
 */
function createWelcomeEmailBody(username) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .header {
          background-color: #4CAF50;
          color: white;
          padding: 10px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
        }
        .footer {
          background-color: #f1f1f1;
          padding: 10px;
          text-align: center;
          font-size: 12px;
          border-radius: 0 0 5px 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to TaskApp!</h1>
        </div>
        <div class="content">
          <h2>Hello ${username},</h2>
          <p>Thank you for registering with TaskApp. We're excited to have you on board!</p>
          <p>With TaskApp, you can:</p>
          <ul>
            <li>Create and manage tasks</li>
            <li>Track your progress</li>
            <li>Set priorities and deadlines</li>
            <li>Collaborate with team members</li>
          </ul>
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p>Best regards,</p>
          <p>The TaskApp Team</p>
        </div>
        <div class="footer">
          <p>This email was sent to you as part of your TaskApp registration. If you did not register for TaskApp, please contact support immediately.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
/**
 * Create task creation email body
 * @param title Task title
 * @param description Task description
 * @param taskId Task ID
 * @returns HTML email body
 */
function createTaskCreationEmailBody(title, description, taskId) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .header {
          background-color: #2196F3;
          color: white;
          padding: 10px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
        }
        .task-details {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
        }
        .footer {
          background-color: #f1f1f1;
          padding: 10px;
          text-align: center;
          font-size: 12px;
          border-radius: 0 0 5px 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Task Created</h1>
        </div>
        <div class="content">
          <p>A new task has been created in your TaskApp account:</p>
          <div class="task-details">
            <h2>${title}</h2>
            <p><strong>Description:</strong> ${description || 'No description provided'}</p>
            <p><strong>Task ID:</strong> ${taskId}</p>
          </div>
          <p>You can view and manage this task in your TaskApp dashboard.</p>
          <p>Best regards,</p>
          <p>The TaskApp Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message from TaskApp. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
/**
 * Create task completion email body
 * @param title Task title
 * @param taskId Task ID
 * @param completedAt Completion timestamp
 * @returns HTML email body
 */
function createTaskCompletionEmailBody(title, taskId, completedAt) {
    // Format the completion date
    const completionDate = new Date(completedAt).toLocaleString();
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .header {
          background-color: #673AB7;
          color: white;
          padding: 10px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
        }
        .task-details {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
        }
        .completion-badge {
          background-color: #4CAF50;
          color: white;
          padding: 5px 10px;
          border-radius: 3px;
          display: inline-block;
          margin-bottom: 10px;
        }
        .footer {
          background-color: #f1f1f1;
          padding: 10px;
          text-align: center;
          font-size: 12px;
          border-radius: 0 0 5px 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Task Completed</h1>
        </div>
        <div class="content">
          <div class="completion-badge">Completed</div>
          <p>Congratulations! You have completed the following task:</p>
          <div class="task-details">
            <h2>${title}</h2>
            <p><strong>Task ID:</strong> ${taskId}</p>
            <p><strong>Completed at:</strong> ${completionDate}</p>
          </div>
          <p>Keep up the good work!</p>
          <p>Best regards,</p>
          <p>The TaskApp Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message from TaskApp. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uRnVuY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYWRhcHRlcnMvaW4vbm90aWZpY2F0aW9uRnVuY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0Esd0ZBQXFGO0FBRXJGOzs7R0FHRztBQUNJLE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUFvQyxFQUFpQixFQUFFO0lBQ25GLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFL0QsSUFBSSxDQUFDO1FBQ0gsd0JBQXdCO1FBQ3hCLE1BQU0sRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFNUQsNEVBQTRFO1FBQzVFLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxJQUFJLHFCQUFxQixDQUFDO1FBQzFFLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxJQUFJLFdBQVcsQ0FBQztRQUNqRCxNQUFNLG1CQUFtQixHQUFHLElBQUkseUNBQW1CLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRTNFLGdDQUFnQztRQUNoQyxRQUFRLFVBQVUsRUFBRSxDQUFDO1lBQ25CLEtBQUssa0JBQWtCO2dCQUNyQixNQUFNLHVCQUF1QixDQUFDLG1CQUFtQixFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUMzRCxNQUFNO1lBQ1IsS0FBSyxjQUFjO2dCQUNqQixNQUFNLG1CQUFtQixDQUFDLG1CQUFtQixFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUN2RCxNQUFNO1lBQ1IsS0FBSyxnQkFBZ0I7Z0JBQ25CLE1BQU0scUJBQXFCLENBQUMsbUJBQW1CLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3pELE1B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UUFDSixNQUFNLEVBQUUsSUFBSTtLQUNiLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsOENBQThDLFNBQVMsRUFBRSxDQUFDLENBQUM7QUFDekUsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLHNCQUFzQixDQUFDLFFBQWdCO0lBQzlDLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztzQkEwQ2EsUUFBUTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1CM0IsQ0FBQztBQUNKLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFTLDJCQUEyQixDQUFDLEtBQWEsRUFBRSxXQUFtQixFQUFFLE1BQWM7SUFDckYsT0FBTzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7a0JBa0RTLEtBQUs7K0NBQ3dCLFdBQVcsSUFBSSx5QkFBeUI7MkNBQzVDLE1BQU07Ozs7Ozs7Ozs7OztHQVk5QyxDQUFDO0FBQ0osQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQVMsNkJBQTZCLENBQUMsS0FBYSxFQUFFLE1BQWMsRUFBRSxXQUFtQjtJQUN2Riw2QkFBNkI7SUFDN0IsTUFBTSxjQUFjLEdBQUcsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7SUFFOUQsT0FBTzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7a0JBMkRTLEtBQUs7MkNBQ29CLE1BQU07Z0RBQ0QsY0FBYzs7Ozs7Ozs7Ozs7O0dBWTNELENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnRCcmlkZ2VFdmVudCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgTm90aWZpY2F0aW9uU2VydmljZSB9IGZyb20gJy4uLy4uL2FwcGxpY2F0aW9uL3NlcnZpY2VzL05vdGlmaWNhdGlvblNlcnZpY2UnO1xuXG4vKipcbiAqIExhbWJkYSBmdW5jdGlvbiBoYW5kbGVyIGZvciBwcm9jZXNzaW5nIG5vdGlmaWNhdGlvbiBldmVudHMgZnJvbSBFdmVudEJyaWRnZVxuICogQHBhcmFtIGV2ZW50IEV2ZW50QnJpZGdlIGV2ZW50XG4gKi9cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBFdmVudEJyaWRnZUV2ZW50PHN0cmluZywgYW55Pik6IFByb21pc2U8dm9pZD4gPT4ge1xuICBjb25zb2xlLmxvZygnUmVjZWl2ZWQgZXZlbnQ6JywgSlNPTi5zdHJpbmdpZnkoZXZlbnQsIG51bGwsIDIpKTtcblxuICB0cnkge1xuICAgIC8vIEV4dHJhY3QgZXZlbnQgZGV0YWlsc1xuICAgIGNvbnN0IHsgc291cmNlLCAnZGV0YWlsLXR5cGUnOiBkZXRhaWxUeXBlLCBkZXRhaWwgfSA9IGV2ZW50O1xuICAgIFxuICAgIC8vIENyZWF0ZSBub3RpZmljYXRpb24gc2VydmljZSB3aXRoIGRlZmF1bHQgc2VuZGVyIGZyb20gZW52aXJvbm1lbnQgdmFyaWFibGVcbiAgICBjb25zdCBkZWZhdWx0U2VuZGVyID0gcHJvY2Vzcy5lbnYuREVGQVVMVF9TRU5ERVIgfHwgJ25vcmVwbHlAdGFza2FwcC5jb20nO1xuICAgIGNvbnN0IHJlZ2lvbiA9IHByb2Nlc3MuZW52LlJFR0lPTiB8fCAndXMtZWFzdC0xJztcbiAgICBjb25zdCBub3RpZmljYXRpb25TZXJ2aWNlID0gbmV3IE5vdGlmaWNhdGlvblNlcnZpY2UoZGVmYXVsdFNlbmRlciwgcmVnaW9uKTtcbiAgICBcbiAgICAvLyBQcm9jZXNzIGRpZmZlcmVudCBldmVudCB0eXBlc1xuICAgIHN3aXRjaCAoZGV0YWlsVHlwZSkge1xuICAgICAgY2FzZSAnVXNlclJlZ2lzdHJhdGlvbic6XG4gICAgICAgIGF3YWl0IHByb2Nlc3NVc2VyUmVnaXN0cmF0aW9uKG5vdGlmaWNhdGlvblNlcnZpY2UsIGRldGFpbCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnVGFza0NyZWF0aW9uJzpcbiAgICAgICAgYXdhaXQgcHJvY2Vzc1Rhc2tDcmVhdGlvbihub3RpZmljYXRpb25TZXJ2aWNlLCBkZXRhaWwpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ1Rhc2tDb21wbGV0aW9uJzpcbiAgICAgICAgYXdhaXQgcHJvY2Vzc1Rhc2tDb21wbGV0aW9uKG5vdGlmaWNhdGlvblNlcnZpY2UsIGRldGFpbCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS5sb2coYFVuaGFuZGxlZCBldmVudCB0eXBlOiAke2RldGFpbFR5cGV9YCk7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHByb2Nlc3Npbmcgbm90aWZpY2F0aW9uIGV2ZW50OicsIGVycm9yKTtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufTtcblxuLyoqXG4gKiBQcm9jZXNzIHVzZXIgcmVnaXN0cmF0aW9uIGV2ZW50c1xuICogQHBhcmFtIG5vdGlmaWNhdGlvblNlcnZpY2UgTm90aWZpY2F0aW9uIHNlcnZpY2VcbiAqIEBwYXJhbSBkZXRhaWwgRXZlbnQgZGV0YWlsXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NVc2VyUmVnaXN0cmF0aW9uKG5vdGlmaWNhdGlvblNlcnZpY2U6IE5vdGlmaWNhdGlvblNlcnZpY2UsIGRldGFpbDogYW55KTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnNvbGUubG9nKCdQcm9jZXNzaW5nIHVzZXIgcmVnaXN0cmF0aW9uIGV2ZW50OicsIGRldGFpbCk7XG4gIFxuICBjb25zdCB7IHVzZXJuYW1lLCBlbWFpbCB9ID0gZGV0YWlsO1xuICBcbiAgaWYgKCFlbWFpbCkge1xuICAgIGNvbnNvbGUud2FybignTm8gZW1haWwgYWRkcmVzcyBwcm92aWRlZCBpbiB1c2VyIHJlZ2lzdHJhdGlvbiBldmVudCcpO1xuICAgIHJldHVybjtcbiAgfVxuICBcbiAgLy8gQ3JlYXRlIHdlbGNvbWUgZW1haWxcbiAgY29uc3Qgc3ViamVjdCA9ICdXZWxjb21lIHRvIFRhc2tBcHAhJztcbiAgY29uc3QgYm9keSA9IGNyZWF0ZVdlbGNvbWVFbWFpbEJvZHkodXNlcm5hbWUpO1xuICBcbiAgLy8gU2VuZCBlbWFpbFxuICBhd2FpdCBub3RpZmljYXRpb25TZXJ2aWNlLnNlbmRFbWFpbCh7XG4gICAgdG86IGVtYWlsLFxuICAgIHN1YmplY3QsXG4gICAgYm9keSxcbiAgICBpc0h0bWw6IHRydWVcbiAgfSk7XG4gIFxuICBjb25zb2xlLmxvZyhgV2VsY29tZSBlbWFpbCBzZW50IHRvICR7ZW1haWx9YCk7XG59XG5cbi8qKlxuICogUHJvY2VzcyB0YXNrIGNyZWF0aW9uIGV2ZW50c1xuICogQHBhcmFtIG5vdGlmaWNhdGlvblNlcnZpY2UgTm90aWZpY2F0aW9uIHNlcnZpY2VcbiAqIEBwYXJhbSBkZXRhaWwgRXZlbnQgZGV0YWlsXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NUYXNrQ3JlYXRpb24obm90aWZpY2F0aW9uU2VydmljZTogTm90aWZpY2F0aW9uU2VydmljZSwgZGV0YWlsOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc29sZS5sb2coJ1Byb2Nlc3NpbmcgdGFzayBjcmVhdGlvbiBldmVudDonLCBkZXRhaWwpO1xuICBcbiAgY29uc3QgeyB0YXNrSWQsIHRpdGxlLCBkZXNjcmlwdGlvbiwgdXNlckVtYWlsIH0gPSBkZXRhaWw7XG4gIFxuICBpZiAoIXVzZXJFbWFpbCkge1xuICAgIGNvbnNvbGUud2FybignTm8gZW1haWwgYWRkcmVzcyBwcm92aWRlZCBpbiB0YXNrIGNyZWF0aW9uIGV2ZW50Jyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIFxuICAvLyBDcmVhdGUgdGFzayBjcmVhdGlvbiBjb25maXJtYXRpb24gZW1haWxcbiAgY29uc3Qgc3ViamVjdCA9ICdOZXcgVGFzayBDcmVhdGVkJztcbiAgY29uc3QgYm9keSA9IGNyZWF0ZVRhc2tDcmVhdGlvbkVtYWlsQm9keSh0aXRsZSwgZGVzY3JpcHRpb24sIHRhc2tJZCk7XG4gIFxuICAvLyBTZW5kIGVtYWlsXG4gIGF3YWl0IG5vdGlmaWNhdGlvblNlcnZpY2Uuc2VuZEVtYWlsKHtcbiAgICB0bzogdXNlckVtYWlsLFxuICAgIHN1YmplY3QsXG4gICAgYm9keSxcbiAgICBpc0h0bWw6IHRydWVcbiAgfSk7XG4gIFxuICBjb25zb2xlLmxvZyhgVGFzayBjcmVhdGlvbiBjb25maXJtYXRpb24gZW1haWwgc2VudCB0byAke3VzZXJFbWFpbH1gKTtcbn1cblxuLyoqXG4gKiBQcm9jZXNzIHRhc2sgY29tcGxldGlvbiBldmVudHNcbiAqIEBwYXJhbSBub3RpZmljYXRpb25TZXJ2aWNlIE5vdGlmaWNhdGlvbiBzZXJ2aWNlXG4gKiBAcGFyYW0gZGV0YWlsIEV2ZW50IGRldGFpbFxuICovXG5hc3luYyBmdW5jdGlvbiBwcm9jZXNzVGFza0NvbXBsZXRpb24obm90aWZpY2F0aW9uU2VydmljZTogTm90aWZpY2F0aW9uU2VydmljZSwgZGV0YWlsOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc29sZS5sb2coJ1Byb2Nlc3NpbmcgdGFzayBjb21wbGV0aW9uIGV2ZW50OicsIGRldGFpbCk7XG4gIFxuICBjb25zdCB7IHRhc2tJZCwgdGl0bGUsIGNvbXBsZXRlZEF0LCB1c2VyRW1haWwgfSA9IGRldGFpbDtcbiAgXG4gIGlmICghdXNlckVtYWlsKSB7XG4gICAgY29uc29sZS53YXJuKCdObyBlbWFpbCBhZGRyZXNzIHByb3ZpZGVkIGluIHRhc2sgY29tcGxldGlvbiBldmVudCcpO1xuICAgIHJldHVybjtcbiAgfVxuICBcbiAgLy8gQ3JlYXRlIHRhc2sgY29tcGxldGlvbiBjb25maXJtYXRpb24gZW1haWxcbiAgY29uc3Qgc3ViamVjdCA9ICdUYXNrIENvbXBsZXRlZCc7XG4gIGNvbnN0IGJvZHkgPSBjcmVhdGVUYXNrQ29tcGxldGlvbkVtYWlsQm9keSh0aXRsZSwgdGFza0lkLCBjb21wbGV0ZWRBdCk7XG4gIFxuICAvLyBTZW5kIGVtYWlsXG4gIGF3YWl0IG5vdGlmaWNhdGlvblNlcnZpY2Uuc2VuZEVtYWlsKHtcbiAgICB0bzogdXNlckVtYWlsLFxuICAgIHN1YmplY3QsXG4gICAgYm9keSxcbiAgICBpc0h0bWw6IHRydWVcbiAgfSk7XG4gIFxuICBjb25zb2xlLmxvZyhgVGFzayBjb21wbGV0aW9uIGNvbmZpcm1hdGlvbiBlbWFpbCBzZW50IHRvICR7dXNlckVtYWlsfWApO1xufVxuXG4vKipcbiAqIENyZWF0ZSB3ZWxjb21lIGVtYWlsIGJvZHlcbiAqIEBwYXJhbSB1c2VybmFtZSBVc2VybmFtZVxuICogQHJldHVybnMgSFRNTCBlbWFpbCBib2R5XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVdlbGNvbWVFbWFpbEJvZHkodXNlcm5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgXG4gICAgPCFET0NUWVBFIGh0bWw+XG4gICAgPGh0bWw+XG4gICAgPGhlYWQ+XG4gICAgICA8c3R5bGU+XG4gICAgICAgIGJvZHkge1xuICAgICAgICAgIGZvbnQtZmFtaWx5OiBBcmlhbCwgc2Fucy1zZXJpZjtcbiAgICAgICAgICBsaW5lLWhlaWdodDogMS42O1xuICAgICAgICAgIGNvbG9yOiAjMzMzO1xuICAgICAgICB9XG4gICAgICAgIC5jb250YWluZXIge1xuICAgICAgICAgIG1heC13aWR0aDogNjAwcHg7XG4gICAgICAgICAgbWFyZ2luOiAwIGF1dG87XG4gICAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjZGRkO1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICAgICAgfVxuICAgICAgICAuaGVhZGVyIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjNENBRjUwO1xuICAgICAgICAgIGNvbG9yOiB3aGl0ZTtcbiAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHggNXB4IDAgMDtcbiAgICAgICAgfVxuICAgICAgICAuY29udGVudCB7XG4gICAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICAgICAgfVxuICAgICAgICAuZm9vdGVyIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjFmMWYxO1xuICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiAwIDAgNXB4IDVweDtcbiAgICAgICAgfVxuICAgICAgPC9zdHlsZT5cbiAgICA8L2hlYWQ+XG4gICAgPGJvZHk+XG4gICAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cbiAgICAgICAgICA8aDE+V2VsY29tZSB0byBUYXNrQXBwITwvaDE+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGVudFwiPlxuICAgICAgICAgIDxoMj5IZWxsbyAke3VzZXJuYW1lfSw8L2gyPlxuICAgICAgICAgIDxwPlRoYW5rIHlvdSBmb3IgcmVnaXN0ZXJpbmcgd2l0aCBUYXNrQXBwLiBXZSdyZSBleGNpdGVkIHRvIGhhdmUgeW91IG9uIGJvYXJkITwvcD5cbiAgICAgICAgICA8cD5XaXRoIFRhc2tBcHAsIHlvdSBjYW46PC9wPlxuICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgIDxsaT5DcmVhdGUgYW5kIG1hbmFnZSB0YXNrczwvbGk+XG4gICAgICAgICAgICA8bGk+VHJhY2sgeW91ciBwcm9ncmVzczwvbGk+XG4gICAgICAgICAgICA8bGk+U2V0IHByaW9yaXRpZXMgYW5kIGRlYWRsaW5lczwvbGk+XG4gICAgICAgICAgICA8bGk+Q29sbGFib3JhdGUgd2l0aCB0ZWFtIG1lbWJlcnM8L2xpPlxuICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgPHA+SWYgeW91IGhhdmUgYW55IHF1ZXN0aW9ucyBvciBuZWVkIGFzc2lzdGFuY2UsIHBsZWFzZSBkb24ndCBoZXNpdGF0ZSB0byBjb250YWN0IG91ciBzdXBwb3J0IHRlYW0uPC9wPlxuICAgICAgICAgIDxwPkJlc3QgcmVnYXJkcyw8L3A+XG4gICAgICAgICAgPHA+VGhlIFRhc2tBcHAgVGVhbTwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cbiAgICAgICAgICA8cD5UaGlzIGVtYWlsIHdhcyBzZW50IHRvIHlvdSBhcyBwYXJ0IG9mIHlvdXIgVGFza0FwcCByZWdpc3RyYXRpb24uIElmIHlvdSBkaWQgbm90IHJlZ2lzdGVyIGZvciBUYXNrQXBwLCBwbGVhc2UgY29udGFjdCBzdXBwb3J0IGltbWVkaWF0ZWx5LjwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2JvZHk+XG4gICAgPC9odG1sPlxuICBgO1xufVxuXG4vKipcbiAqIENyZWF0ZSB0YXNrIGNyZWF0aW9uIGVtYWlsIGJvZHlcbiAqIEBwYXJhbSB0aXRsZSBUYXNrIHRpdGxlXG4gKiBAcGFyYW0gZGVzY3JpcHRpb24gVGFzayBkZXNjcmlwdGlvblxuICogQHBhcmFtIHRhc2tJZCBUYXNrIElEXG4gKiBAcmV0dXJucyBIVE1MIGVtYWlsIGJvZHlcbiAqL1xuZnVuY3Rpb24gY3JlYXRlVGFza0NyZWF0aW9uRW1haWxCb2R5KHRpdGxlOiBzdHJpbmcsIGRlc2NyaXB0aW9uOiBzdHJpbmcsIHRhc2tJZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGBcbiAgICA8IURPQ1RZUEUgaHRtbD5cbiAgICA8aHRtbD5cbiAgICA8aGVhZD5cbiAgICAgIDxzdHlsZT5cbiAgICAgICAgYm9keSB7XG4gICAgICAgICAgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmO1xuICAgICAgICAgIGxpbmUtaGVpZ2h0OiAxLjY7XG4gICAgICAgICAgY29sb3I6ICMzMzM7XG4gICAgICAgIH1cbiAgICAgICAgLmNvbnRhaW5lciB7XG4gICAgICAgICAgbWF4LXdpZHRoOiA2MDBweDtcbiAgICAgICAgICBtYXJnaW46IDAgYXV0bztcbiAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICNkZGQ7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xuICAgICAgICB9XG4gICAgICAgIC5oZWFkZXIge1xuICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMyMTk2RjM7XG4gICAgICAgICAgY29sb3I6IHdoaXRlO1xuICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweCA1cHggMCAwO1xuICAgICAgICB9XG4gICAgICAgIC5jb250ZW50IHtcbiAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgICAgICB9XG4gICAgICAgIC50YXNrLWRldGFpbHMge1xuICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmOWY5Zjk7XG4gICAgICAgICAgcGFkZGluZzogMTVweDtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHg7XG4gICAgICAgICAgbWFyZ2luOiAxNXB4IDA7XG4gICAgICAgIH1cbiAgICAgICAgLmZvb3RlciB7XG4gICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2YxZjFmMTtcbiAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xuICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogMCAwIDVweCA1cHg7XG4gICAgICAgIH1cbiAgICAgIDwvc3R5bGU+XG4gICAgPC9oZWFkPlxuICAgIDxib2R5PlxuICAgICAgPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+XG4gICAgICAgICAgPGgxPk5ldyBUYXNrIENyZWF0ZWQ8L2gxPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5cbiAgICAgICAgICA8cD5BIG5ldyB0YXNrIGhhcyBiZWVuIGNyZWF0ZWQgaW4geW91ciBUYXNrQXBwIGFjY291bnQ6PC9wPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0YXNrLWRldGFpbHNcIj5cbiAgICAgICAgICAgIDxoMj4ke3RpdGxlfTwvaDI+XG4gICAgICAgICAgICA8cD48c3Ryb25nPkRlc2NyaXB0aW9uOjwvc3Ryb25nPiAke2Rlc2NyaXB0aW9uIHx8ICdObyBkZXNjcmlwdGlvbiBwcm92aWRlZCd9PC9wPlxuICAgICAgICAgICAgPHA+PHN0cm9uZz5UYXNrIElEOjwvc3Ryb25nPiAke3Rhc2tJZH08L3A+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPHA+WW91IGNhbiB2aWV3IGFuZCBtYW5hZ2UgdGhpcyB0YXNrIGluIHlvdXIgVGFza0FwcCBkYXNoYm9hcmQuPC9wPlxuICAgICAgICAgIDxwPkJlc3QgcmVnYXJkcyw8L3A+XG4gICAgICAgICAgPHA+VGhlIFRhc2tBcHAgVGVhbTwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cbiAgICAgICAgICA8cD5UaGlzIGlzIGFuIGF1dG9tYXRlZCBtZXNzYWdlIGZyb20gVGFza0FwcC4gUGxlYXNlIGRvIG5vdCByZXBseSB0byB0aGlzIGVtYWlsLjwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2JvZHk+XG4gICAgPC9odG1sPlxuICBgO1xufVxuXG4vKipcbiAqIENyZWF0ZSB0YXNrIGNvbXBsZXRpb24gZW1haWwgYm9keVxuICogQHBhcmFtIHRpdGxlIFRhc2sgdGl0bGVcbiAqIEBwYXJhbSB0YXNrSWQgVGFzayBJRFxuICogQHBhcmFtIGNvbXBsZXRlZEF0IENvbXBsZXRpb24gdGltZXN0YW1wXG4gKiBAcmV0dXJucyBIVE1MIGVtYWlsIGJvZHlcbiAqL1xuZnVuY3Rpb24gY3JlYXRlVGFza0NvbXBsZXRpb25FbWFpbEJvZHkodGl0bGU6IHN0cmluZywgdGFza0lkOiBzdHJpbmcsIGNvbXBsZXRlZEF0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAvLyBGb3JtYXQgdGhlIGNvbXBsZXRpb24gZGF0ZVxuICBjb25zdCBjb21wbGV0aW9uRGF0ZSA9IG5ldyBEYXRlKGNvbXBsZXRlZEF0KS50b0xvY2FsZVN0cmluZygpO1xuICBcbiAgcmV0dXJuIGBcbiAgICA8IURPQ1RZUEUgaHRtbD5cbiAgICA8aHRtbD5cbiAgICA8aGVhZD5cbiAgICAgIDxzdHlsZT5cbiAgICAgICAgYm9keSB7XG4gICAgICAgICAgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmO1xuICAgICAgICAgIGxpbmUtaGVpZ2h0OiAxLjY7XG4gICAgICAgICAgY29sb3I6ICMzMzM7XG4gICAgICAgIH1cbiAgICAgICAgLmNvbnRhaW5lciB7XG4gICAgICAgICAgbWF4LXdpZHRoOiA2MDBweDtcbiAgICAgICAgICBtYXJnaW46IDAgYXV0bztcbiAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICNkZGQ7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xuICAgICAgICB9XG4gICAgICAgIC5oZWFkZXIge1xuICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICM2NzNBQjc7XG4gICAgICAgICAgY29sb3I6IHdoaXRlO1xuICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweCA1cHggMCAwO1xuICAgICAgICB9XG4gICAgICAgIC5jb250ZW50IHtcbiAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgICAgICB9XG4gICAgICAgIC50YXNrLWRldGFpbHMge1xuICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmOWY5Zjk7XG4gICAgICAgICAgcGFkZGluZzogMTVweDtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiA1cHg7XG4gICAgICAgICAgbWFyZ2luOiAxNXB4IDA7XG4gICAgICAgIH1cbiAgICAgICAgLmNvbXBsZXRpb24tYmFkZ2Uge1xuICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICM0Q0FGNTA7XG4gICAgICAgICAgY29sb3I6IHdoaXRlO1xuICAgICAgICAgIHBhZGRpbmc6IDVweCAxMHB4O1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDNweDtcbiAgICAgICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgICAgICAgbWFyZ2luLWJvdHRvbTogMTBweDtcbiAgICAgICAgfVxuICAgICAgICAuZm9vdGVyIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjFmMWYxO1xuICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiAwIDAgNXB4IDVweDtcbiAgICAgICAgfVxuICAgICAgPC9zdHlsZT5cbiAgICA8L2hlYWQ+XG4gICAgPGJvZHk+XG4gICAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cbiAgICAgICAgICA8aDE+VGFzayBDb21wbGV0ZWQ8L2gxPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29tcGxldGlvbi1iYWRnZVwiPkNvbXBsZXRlZDwvZGl2PlxuICAgICAgICAgIDxwPkNvbmdyYXR1bGF0aW9ucyEgWW91IGhhdmUgY29tcGxldGVkIHRoZSBmb2xsb3dpbmcgdGFzazo8L3A+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInRhc2stZGV0YWlsc1wiPlxuICAgICAgICAgICAgPGgyPiR7dGl0bGV9PC9oMj5cbiAgICAgICAgICAgIDxwPjxzdHJvbmc+VGFzayBJRDo8L3N0cm9uZz4gJHt0YXNrSWR9PC9wPlxuICAgICAgICAgICAgPHA+PHN0cm9uZz5Db21wbGV0ZWQgYXQ6PC9zdHJvbmc+ICR7Y29tcGxldGlvbkRhdGV9PC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxwPktlZXAgdXAgdGhlIGdvb2Qgd29yayE8L3A+XG4gICAgICAgICAgPHA+QmVzdCByZWdhcmRzLDwvcD5cbiAgICAgICAgICA8cD5UaGUgVGFza0FwcCBUZWFtPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlclwiPlxuICAgICAgICAgIDxwPlRoaXMgaXMgYW4gYXV0b21hdGVkIG1lc3NhZ2UgZnJvbSBUYXNrQXBwLiBQbGVhc2UgZG8gbm90IHJlcGx5IHRvIHRoaXMgZW1haWwuPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvYm9keT5cbiAgICA8L2h0bWw+XG4gIGA7XG59XG4iXX0=