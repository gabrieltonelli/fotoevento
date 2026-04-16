import { supabase } from '../services/supabase.js';

// ─── Modo Desarrollo ───
const DEV_MODE = process.env.DEV_MODE === 'true';
const DEV_USER = DEV_MODE ? {
    id: process.env.DEV_USER_ID || 'dev-user-00000-00000-00000',
    email: process.env.DEV_USER_EMAIL || 'dev@fotoevento.dev',
    user_metadata: {
        full_name: process.env.DEV_USER_NAME || 'Dev User',
    },
    app_metadata: {},
    aud: 'authenticated',
    role: 'authenticated',
} : null;

if (DEV_MODE) {
    console.log('🛠️ Auth Middleware en Modo Desarrollo — usuario mock:', DEV_USER.email);
}

export async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    // Dev mode: aceptar token "dev-token-fotoevento"
    if (DEV_MODE) {
        const token = authHeader?.split(' ')[1];
        if (token === 'dev-token-fotoevento' || !authHeader) {
            req.user = DEV_USER;
            req.token = 'dev-token-fotoevento';
            return next();
        }
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token de autenticación requerido' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ message: 'Token inválido o expirado' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Error de autenticación' });
    }
}

// Optional auth - doesn't require token but attaches user if present
export async function optionalAuth(req, res, next) {
    // Dev mode: siempre adjuntar usuario mock
    if (DEV_MODE) {
        req.user = DEV_USER;
        req.token = 'dev-token-fotoevento';
        return next();
    }

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const { data: { user } } = await supabase.auth.getUser(token);
            req.user = user;
            req.token = token;
        } catch {
            // Ignore auth errors for optional auth
        }
    }

    next();
}
