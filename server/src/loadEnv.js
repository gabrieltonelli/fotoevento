import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Robustly loads environment variables from the project root and server directory.
 * This is designed to be imported at the very top of the entry point and 
 * any module that depends on process.env during module initialization.
 */

// 1. Try to load from project root (../../.env)
const rootPath = path.resolve(__dirname, '../../');
dotenv.config({ path: path.join(rootPath, '.env') });

// 2. Try to load from current directory (./.env) if it exists
dotenv.config();

// Debug logs only in non-production
if (process.env.NODE_ENV !== 'production' && !process.env.SILENT_ENV_LOGS) {
    if (process.env.VITE_DEV_MODE === 'true') {
        // console.log('🛠️ Environment: DEV_MODE is active');
    }
}

export default process.env;
