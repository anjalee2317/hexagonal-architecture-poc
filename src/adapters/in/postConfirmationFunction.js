const AWS = require('aws-sdk');
const { loadTemplate, renderTemplate } = require('../../utils/templateUtils');

/**
 * Handler for Cognito post-confirmation event
 * @param {Object} event - The Cognito event
 * @param {Object} context - The Lambda context
 * @returns {Object} - The event object
 */
exports.handler = async (event, context) => {
  console.log('Post confirmation event received:', JSON.stringify(event));
  
  try {
    // Extract user attributes from the event
    const userId = event.userName;
    const userAttributes = event.request.userAttributes;
    
    // Set up DynamoDB client
    const dynamoDB = new AWS.DynamoDB.DocumentClient({
      region: process.env.REGION || 'us-east-1'
    });
    
    // Get the user table name from environment variables
    const userTableName = process.env.USER_TABLE_NAME;
    
    if (!userTableName) {
      console.error('USER_TABLE_NAME environment variable is not set');
      return event;
    }
    
    // Create user record in DynamoDB
    const userItem = {
      userId: userId,
      email: userAttributes.email,
      phoneNumber: userAttributes.phone_number,
      createdAt: new Date().toISOString(),
      preferences: {
        notifications: true,
        theme: 'light'
      }
    };
    
    // Publish event to EventBridge if configured
    const eventBusName = process.env.EVENT_BUS_NAME;
    if (eventBusName) {
      const eventBridge = new AWS.EventBridge({ region: process.env.REGION || 'us-east-1' });
      const eventParams = {
        Entries: [
          {
            Source: 'user-service',
            DetailType: 'UserCreated',
            Detail: JSON.stringify({
              userId: userId,
              email: userAttributes.email,
              createdAt: new Date().toISOString()
            }),
            EventBusName: eventBusName
          }
        ]
      };
      
      console.log(`Publishing event to ${eventBusName}:`, JSON.stringify(eventParams.Entries[0], null, 2));
      await eventBridge.putEvents(eventParams).promise();
      console.log(`Event published successfully to ${eventBusName}`);
    }
    
    await dynamoDB.put({
      TableName: userTableName,
      Item: userItem
    }).promise();
    
    console.log(`User profile created for ${userId}`);
    
    // Send welcome email using SES
    await sendWelcomeEmail(userId, userAttributes.email);
    
  } catch (error) {
    console.error('Error in post confirmation handler:', error);
    // Important: We still return the event to allow the user to be confirmed
    // even if our additional processing fails
  }
  
  // Return the event to continue the flow
  return event;
};

/**
 * Sends a welcome email to the newly confirmed user
 * @param {string} username - The username of the user
 * @param {string} email - The email address of the user
 */
async function sendWelcomeEmail(username, email) {
  try {
    console.log('Preparing to send welcome email...');
    const ses = new AWS.SES({ region: process.env.REGION || 'us-east-1' });
    
    // Get the sender email address from environment variables
    const senderEmail = process.env.FROM_EMAIL || 'no-reply@yourdomain.com';
    console.log(`Using sender email: ${senderEmail}`);
    
    // Load email templates
    const htmlTemplate = loadTemplate('welcome-email', 'html');
    const textTemplate = loadTemplate('welcome-email', 'txt');
    
    // Prepare template data
    const templateData = {
      username: username,
      currentYear: new Date().getFullYear().toString()
    };
    
    // Render templates with data
    const htmlBody = renderTemplate(htmlTemplate, templateData);
    const textBody = renderTemplate(textTemplate, templateData);
    
    const emailParams = {
      Source: senderEmail,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: 'Welcome to Our Platform!',
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8'
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8'
          }
        }
      }
    };
    
    console.log(`Sending welcome email to ${email}`);
    const result = await ses.sendEmail(emailParams).promise();
    console.log(`Welcome email sent successfully. MessageId: ${result.MessageId}`);
    return true;
  } catch (emailError) {
    // Log the error but don't fail the function
    console.error('Error sending welcome email:', JSON.stringify(emailError));
    // If it's a SES verification error, log a helpful message
    if (emailError.code === 'MessageRejected') {
      console.log('SES email rejected. Make sure your sender email is verified in SES.');
    }
    return false;
  }
}
