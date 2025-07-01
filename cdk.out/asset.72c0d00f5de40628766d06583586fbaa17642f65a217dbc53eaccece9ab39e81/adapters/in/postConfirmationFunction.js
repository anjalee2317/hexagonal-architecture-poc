/**
 * Post Confirmation Lambda function for Cognito
 * This function is triggered after a user confirms their account
 */

exports.handler = async (event, context) => {
  console.log('Post confirmation event:', JSON.stringify(event, null, 2));
  
  try {
    // Extract user attributes from the event
    const { userName, request: { userAttributes } } = event;
    const { email, sub: userId, phone_number: phoneNumber } = userAttributes;
    
    console.log(`User ${userName} (${userId}) confirmed with email ${email} and phone ${phoneNumber}`);
    
    // Get environment variables
    const userTableName = process.env.USER_TABLE_NAME;
    const eventBusName = process.env.EVENT_BUS_NAME;
    const region = process.env.REGION || 'us-east-1';
    
    // If we have an event bus, publish a user confirmed event
    if (eventBusName) {
      const { EventBridge } = require('@aws-sdk/client-eventbridge');
      const eventBridge = new EventBridge({ region });
      
      await eventBridge.putEvents({
        Entries: [
          {
            Source: 'com.taskapp.auth',
            DetailType: 'UserConfirmed',
            Detail: JSON.stringify({
              userId,
              email,
              phoneNumber,
              userName,
              confirmedAt: new Date().toISOString()
            }),
            EventBusName: eventBusName
          }
        ]
      });
      
      console.log(`Published UserConfirmed event to ${eventBusName}`);
    }
    
    // If we have a user table, store user data
    if (userTableName) {
      const { DynamoDB } = require('@aws-sdk/client-dynamodb');
      const { marshall } = require('@aws-sdk/util-dynamodb');
      const dynamoDB = new DynamoDB({ region });
      
      await dynamoDB.putItem({
        TableName: userTableName,
        Item: marshall({
          userId,
          email,
          phoneNumber,
          userName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'ACTIVE'
        })
      });
      
      console.log(`Stored user data in ${userTableName}`);
    }
    
    // Return success to Cognito
    return event;
  } catch (error) {
    console.error('Error in post confirmation:', error);
    // Still return the event to allow the user to be confirmed
    return event;
  }
};
