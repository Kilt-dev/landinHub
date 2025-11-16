const serverless = require('serverless-http');
const app = require('./src/app');

// Wrap Express app for AWS Lambda
module.exports.handler = serverless(app);
