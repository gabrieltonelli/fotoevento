import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// ─── Modo Desarrollo ───
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

const getDevUser = (email, fullName) => ({
    id: import.meta.env.VITE_DEV_USER_ID || 'dev-user-00000-00000-00000',
    email: email || import.meta.env.VITE_DEV_USER_EMAIL || 'dev@fotoevento.dev',
    user_metadata: {
        full_name: fullName || import.meta.env.VITE_DEV_USER_NAME || 'Dev User',
    },
    app_metadata: {},
    aud: 'authenticated',
    role: 'authenticated',
    created_at: new Date().toISOString(),
});

const getDevSession = (user) => ({
    access_token: 'dev-token-fotoevento',
    refresh_token: 'dev-refresh-token',
    user: user,
});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);

    const refreshProfile = useCallback(async (currentSession) => {
        const sess = currentSession || session;
        if (!sess?.access_token && !DEV_MODE) return;

        setProfileLoading(true);
        try {
            const { api } = await import('../services/api');
            const data = await api.getProfile(DEV_MODE ? 'dev-token-fotoevento' : sess.access_token);
            setProfile(data);
        } catch (err) {
            console.error('Error loading profile:', err);
        } finally {
            setProfileLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (DEV_MODE) {
            const savedUser = localStorage.getItem('fotoevento-dev-user');
            if (savedUser) {
                const u = JSON.parse(savedUser);
                const s = getDevSession(u);
                setUser(u);
                setSession(s);
                refreshProfile(s);
            }
            setLoading(false);
            return;
        }

        let lastSessionId = null;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                lastSessionId = session.user?.id + session.access_token?.substring(0, 10);
                setSession(session);
                setUser(session.user);
                refreshProfile(session);
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentSessionId = session ? (session.user?.id + session.access_token?.substring(0, 10)) : null;
            
            if (currentSessionId !== lastSessionId) {
                lastSessionId = currentSessionId;
                setSession(session);
                setUser(session?.user ?? null);
                if (session) await refreshProfile(session);
                setLoading(false);
            } else if (!session) {
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email, password, fullName) => {
        if (DEV_MODE) {
            console.log('🛠️ [DevMode] signUp simulado:', email);
            const mockUser = getDevUser(email, fullName);
            const mockSession = getDevSession(mockUser);
            // No auto-logeamos en el signup si queremos ver la pantalla de verificación
            // Pero el usuario ya existe en nuestro "mock"
            return { data: { user: mockUser, session: null }, error: null };
        }
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
                emailRedirectTo: `${window.location.origin}/dashboard`
            },
        });
        return { data, error };
    };

    const resendVerification = async (email) => {
        if (DEV_MODE) {
            console.log('🛠️ [DevMode] re-enviando email mock a:', email);
            return { error: null };
        }
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/dashboard`
            }
        });
        return { error };
    };

    const signIn = async (email, password) => {
        if (DEV_MODE) {
            console.log('🛠️ [DevMode] signIn simulado:', email);
            const mockUser = getDevUser(email);
            const mockSession = getDevSession(mockUser);
            setSession(mockSession);
            setUser(mockUser);
            localStorage.setItem('fotoevento-dev-user', JSON.stringify(mockUser));
            return { data: { user: mockUser, session: mockSession }, error: null };
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        return { data, error };
    };

    const signInWithGoogle = async () => {
        if (DEV_MODE) {
            console.log('🛠️ [DevMode] Google login simulado');
            const mockUser = getDevUser('google@example.com', 'Google User');
            const mockSession = getDevSession(mockUser);
            setSession(mockSession);
            setUser(mockUser);
            localStorage.setItem('fotoevento-dev-user', JSON.stringify(mockUser));
            return { data: { user: mockUser, session: mockSession }, error: null };
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
            setSession(null);
            setUser(null);
            setProfile(null);
            localStorage.removeItem('fotoevento-dev-user');
            return { error: null };
        }
        const { error } = await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        return { error };
    };

    const getToken = useCallback(() => {
        if (DEV_MODE) return 'dev-token-fotoevento';
        return session?.access_token;
    }, [session]);

    const isEventExpired = useCallback((event) => {
        if (!event || event.plan !== 'free') return false;
        const createdAt = new Date(event.created_at);
        const now = new Date();
        const diffInMinutes = (now - createdAt) / (1000 * 60);
        const trialMinutes = parseInt(import.meta.env.VITE_FREE_TRIAL_MINUTES || '30', 10);
        return diffInMinutes > trialMinutes;
    }, []);

    const value = {
        user,
        session,
        profile,
        loading,
        profileLoading,
        signUp,
        signIn,
        resendVerification,
        signInWithGoogle,
        signOut,
        getToken,
        refreshProfile,
        isEventExpired,
        isDevMode: DEV_MODE,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
