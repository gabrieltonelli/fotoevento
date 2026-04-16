import { supabase } from '../services/supabase.js';

export async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

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
