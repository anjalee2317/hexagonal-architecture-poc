// Re-export the handler from the actual implementation
const { handler } = require('./src/adapters/in/taskFunction');

exports.handler = handler;
