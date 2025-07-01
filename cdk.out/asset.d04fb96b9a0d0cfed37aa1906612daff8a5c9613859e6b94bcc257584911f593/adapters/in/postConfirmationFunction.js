exports.handler = async (event, context) => {
  console.log('Post confirmation event:', JSON.stringify(event, null, 2));
  
  // Extract user attributes from the event
  const userId = event.userName;
  const userAttributes = event.request.userAttributes;
  
  // Here you would typically save the user to your DynamoDB table
  // For now, we'll just log the information and return success
  console.log(`User ${userId} confirmed with attributes:`, userAttributes);
  
  // Return the event to continue the flow
  return event;
};
