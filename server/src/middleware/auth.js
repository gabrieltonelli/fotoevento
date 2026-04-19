import { supabase } from '../services/supabase.js';
import dotenv from 'dotenv';
// Only load dotenv in non-production environments
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

// ─── Modo Desarrollo ───
const DEV_MODE = process.env.VITE_DEV_MODE === 'true';
let resolvedDevUser = null;

async function getDevUser() {
    if (resolvedDevUser) return resolvedDevUser;
    const email = process.env.VITE_DEV_USER_EMAIL || 'gabrieltonelli@gmail.com';
    const envId = process.env.VITE_DEV_USER_ID;

    // Si ya tenemos el ID en el .env, lo usamos directo
    if (envId && envId.length > 20) {
        resolvedDevUser = {
            id: envId,
            email,
            user_metadata: { full_name: process.env.VITE_DEV_USER_NAME || 'Gabriel Tonelli' },
            role: 'authenticated'
        };
        return resolvedDevUser;
    }

    try {
        console.log(`🛠️ [DevMode] Buscando UUID real para: ${email}...`);
        
        // Usar el API de Admin para buscar el usuario por email
        const { data: { users }, error } = await supabase.auth.admin.listUsers({
            filters: { email: email }
        });

        const realUser = users?.find(u => u.email === email);

        if (realUser) {
            resolvedDevUser = {
                id: realUser.id,
                email: realUser.email,
                user_metadata: realUser.user_metadata,
                role: 'authenticated'
            };
            console.log(`🛠️ [DevMode] UUID resuelto desde Supabase Auth: ${resolvedDevUser.id}`);
            return resolvedDevUser;
        } else {
            console.warn(`⚠️ [DevMode] No se encontró ningún usuario con el email ${email} en Supabase.`);
        }
    } catch (err) {
        console.warn('⚠️ [DevMode] Error al buscar ID real mediante Admin API:', err.message);
    }

    // Fallback si nada funciona
    resolvedDevUser = {
        id: 'dev-user-mock',
        email,
        user_metadata: { full_name: process.env.VITE_DEV_USER_NAME || 'Gabriel Tonelli' },
        role: 'authenticated'
    };
    return resolvedDevUser;
}


export async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    // Dev mode: aceptar token "dev-token-fotoevento"
    if (DEV_MODE) {
        const token = authHeader?.split(' ')[1];
        if (token === 'dev-token-fotoevento' || !authHeader) {
            req.user = await getDevUser();
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
        req.user = await getDevUser();
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
