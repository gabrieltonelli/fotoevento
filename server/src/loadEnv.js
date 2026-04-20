import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Only load dotenv if not in a serverless environment like Netlify
// or if specifically requested. Variables in Netlify are already in process.env.
if (!process.env.NETLIFY) {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        // 1. Try to load from project root (../../.env)
        const rootPath = path.resolve(__dirname, '../../');
        dotenv.config({ path: path.join(rootPath, '.env') });

        // 2. Try to load from current directory (./.env) if it exists
        dotenv.config();
    } catch (e) {
        // In some bundled environments, import.meta.url might be missing
        // We fallback to standard dotenv which looks at CWD
        dotenv.config();
    }
}

// Debug logs only in non-production
if (process.env.NODE_ENV !== 'production' && !process.env.SILENT_ENV_LOGS) {
    if (process.env.VITE_DEV_MODE === 'true') {
        // console.log('🛠️ Environment: DEV_MODE is active');
    }
}

export default process.env;
