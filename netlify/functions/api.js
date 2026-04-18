import serverless from 'serverless-http';
import app from '../../server/src/index.js';

const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  try {
    return await serverlessHandler(event, context);
  } catch (error) {
    console.error('CRITICAL FUNCTION ERROR:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Critical Server Error',
        message: error.message,
        stack: error.stack
      })
    };
  }
};
