import { EventBridgeEvent } from 'aws-lambda';
import { NotificationService } from '../../application/services/NotificationService';

/**
 * Lambda function handler for processing notification events from EventBridge
 * @param event EventBridge event
 */
export const handler = async (event: EventBridgeEvent<string, any>): Promise<void> => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Extract event details
    const { source, 'detail-type': detailType, detail } = event;
    
    // Create notification service with default sender from environment variable
    const defaultSender = process.env.DEFAULT_SENDER || 'noreply@taskapp.com';
    const region = process.env.REGION || 'us-east-1';
    const notificationService = new NotificationService(defaultSender, region);
    
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
  } catch (error) {
    console.error('Error processing notification event:', error);
    throw error;
  }
};

/**
 * Process user registration events
 * @param notificationService Notification service
 * @param detail Event detail
 */
async function processUserRegistration(notificationService: NotificationService, detail: any): Promise<void> {
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
async function processTaskCreation(notificationService: NotificationService, detail: any): Promise<void> {
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
async function processTaskCompletion(notificationService: NotificationService, detail: any): Promise<void> {
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
function createWelcomeEmailBody(username: string): string {
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
function createTaskCreationEmailBody(title: string, description: string, taskId: string): string {
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
function createTaskCompletionEmailBody(title: string, taskId: string, completedAt: string): string {
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
