import serverless from 'serverless-http';

let cachedHandler;

async function getHandler() {
  if (cachedHandler) return cachedHandler;
  
  try {
    // Importación dinámica del servidor
    const appModule = await import('../../server/src/index.js');
    const app = appModule.default;
    cachedHandler = serverless(app);
    console.log('✅ Server loaded successfully in Netlify Function');
    return cachedHandler;
  } catch (err) {
    console.error('❌ FATAL: Failed to load server app:', err.message);
    throw err;
  }
}

export const handler = async (event, context) => {
  try {
    const serverlessHandler = await getHandler();
    return await serverlessHandler(event, context);
  } catch (error) {
    console.error('RUNTIME ERROR:', error);
    return {
      statusCode: 502,
      body: JSON.stringify({ 
        error: 'Backend Initialization Error', 
        message: error.message 
      })
    };
  }
};
