import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Camera, Mail, Lock, User, Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
    const { signUp, signInWithGoogle, resendVerification } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const returnTo = searchParams.get('returnTo') || '/dashboard';
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    const validatePassword = (pw) => {
        // Al menos 8 caracteres, una mayúscula, una minúscula y un número
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return regex.test(pw);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (!validatePassword(password)) {
            toast.error('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número');
            return;
        }

        setLoading(true);
        const { error, data } = await signUp(email, password, fullName);
        
        if (error) {
            setLoading(false);
            if (error.message?.includes('already registered')) {
                // El usuario ya existe. Si no está confirmado, intentamos reenviar email.
                toast('Ya registraste esta cuenta. Re-enviando email de confirmación...', { icon: '📧' });
                const { error: resendError } = await resendVerification(email);
                if (resendError) {
                    toast.error('Error al reenviar email: ' + resendError.message);
                } else {
                    navigate(`/verify-email?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}`);
                }
            } else {
                toast.error(error.message);
            }
        } else {
            setLoading(false);
            toast.success('¡Registro exitoso! Por favor, verifica tu email.');
            navigate(`/verify-email?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}`);
        }
    };

    const handleGoogle = async () => {
        const { error } = await signInWithGoogle();
        if (error) toast.error(error.message);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4 relative overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <Link to="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-display text-2xl font-bold gradient-text">Foto Eventos</span>
                </Link>

                <div className="glass rounded-2xl p-8">
                    <h1 className="font-display text-2xl font-bold text-white text-center mb-2">Crear Cuenta</h1>
                    <p className="text-white/40 text-center text-sm mb-6">Registrate gratis y creá tu primer evento</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <input
                                type="text"
                                placeholder="Nombre completo"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="input-field !pl-11"
                                required
                                maxLength={100}
                            />
                        </div>

                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field !pl-11"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <input
                                type={showPw ? 'text' : 'password'}
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field !pl-11 !pr-11"
                                required
                                minLength={8}
                                maxLength={72}
                            />
                            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <input
                                type={showPw ? 'text' : 'password'}
                                placeholder="Repetir Contraseña"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input-field !pl-11 !pr-11"
                                required
                                minLength={8}
                                maxLength={72}
                            />
                        </div>

                        <button type="submit" disabled={loading} className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Crear Cuenta
                                </>
                            )}
                        </button>
                    </form>

                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-white/30 text-xs">O continuar con</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <button onClick={handleGoogle} className="w-full btn-secondary flex items-center justify-center gap-3">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                    </button>

                    <p className="text-center text-white/40 text-sm mt-6">
                        ¿Ya tenés cuenta?{' '}
                        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                            Iniciá sesión
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
