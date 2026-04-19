import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// ─── Modo Desarrollo ───
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

const DEV_USER = DEV_MODE ? {
    id: import.meta.env.VITE_DEV_USER_ID || 'dev-user-00000-00000-00000',
    email: import.meta.env.VITE_DEV_USER_EMAIL || 'dev@fotoevento.dev',
    user_metadata: {
        full_name: import.meta.env.VITE_DEV_USER_NAME || 'Dev User',
    },
    app_metadata: {},
    aud: 'authenticated',
    role: 'authenticated',
    created_at: new Date().toISOString(),
} : null;

const DEV_SESSION = DEV_MODE ? {
    access_token: 'dev-token-fotoevento',
    refresh_token: 'dev-refresh-token',
    user: DEV_USER,
} : null;

if (DEV_MODE) {
    console.log('🛠️ Modo Desarrollo activo — usuario mock:', DEV_USER.email);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(DEV_MODE ? DEV_USER : null);
    const [session, setSession] = useState(DEV_MODE ? DEV_SESSION : null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = useCallback(async (currentSession) => {
        const sess = currentSession || session;
        if (!sess?.access_token && !DEV_MODE) return;

        try {
            const { api } = await import('../services/api');
            const data = await api.getProfile(DEV_MODE ? 'dev-token-fotoevento' : sess.access_token);
            setProfile(data);
        } catch (err) {
            console.error('Error loading profile:', err);
        }
    }, [session]);

    useEffect(() => {
        if (DEV_MODE) {
            refreshProfile();
            setLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session) refreshProfile(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session) await refreshProfile(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email, password, fullName) => {
        if (DEV_MODE) {
            console.log('🛠️ [DevMode] signUp simulado:', email);
            return { data: { user: DEV_USER, session: DEV_SESSION }, error: null };
        }
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
            },
        });
        return { data, error };
    };

    const signIn = async (email, password) => {
        if (DEV_MODE) {
            console.log('🛠️ [DevMode] signIn simulado:', email);
            return { data: { user: DEV_USER, session: DEV_SESSION }, error: null };
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        return { data, error };
    };

    const signInWithGoogle = async () => {
        if (DEV_MODE) {
            console.log('🛠️ [DevMode] Google login simulado');
            return { data: { user: DEV_USER }, error: null };
        }
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/dashboard` },
        });
        return { data, error };
    };

    const signOut = async () => {
        if (DEV_MODE) {
            console.log('🛠️ [DevMode] signOut simulado');
            // En dev mode, no cerramos la sesión para no perder el acceso
            return { error: null };
        }
        const { error } = await supabase.auth.signOut();
        return { error };
    };

    const getToken = useCallback(() => {
        if (DEV_MODE) return 'dev-token-fotoevento';
        return session?.access_token;
    }, [session]);

    const isTrialExpired = useCallback(() => {
        if (!profile || profile.subscription_plan !== 'free') return false;
        if (!profile.trial_expires_at) return false;
        return new Date() > new Date(profile.trial_expires_at);
    }, [profile]);

    const value = {
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        getToken,
        refreshProfile,
        isTrialExpired,
        isDevMode: DEV_MODE,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
