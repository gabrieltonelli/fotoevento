// Netlify Function handler - wraps the Express server for serverless execution
let serverlessHandler;

try {
  const serverless = (await import('serverless-http')).default;
  const { default: app } = await import('../../server/src/index.js');
  serverlessHandler = serverless(app);
} catch (initError) {
  console.error('INIT ERROR:', initError);
  // If import fails, create a handler that returns the error details
  serverlessHandler = async () => ({
    statusCode: 500,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: 'Function initialization failed',
      message: initError.message,
      stack: initError.stack
    })
  });
}

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
