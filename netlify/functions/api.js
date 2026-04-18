import serverless from 'serverless-http';
import app from '../../server/src/index.js';

const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  try {
    return await serverlessHandler(event, context);
  } catch (error) {
    console.error('RUNTIME ERROR:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Runtime error',
        message: error.message,
        stack: error.stack
      })
    };
  }
};
