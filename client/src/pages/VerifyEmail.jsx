import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');
    const returnTo = searchParams.get('returnTo') || '/pricing';
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [loading, setLoading] = useState(true);

    // Si el usuario ya está logueado, lo mandamos al destino original
    useEffect(() => {
        if (user) {
            navigate(returnTo);
        }
    }, [user, navigate, returnTo]);

    useEffect(() => {
        if (!email) {
            navigate('/register');
            return;
        }

        let interval;
        
        const checkStatus = async () => {
            try {
                const data = await api.checkVerification(email);
                if (data.confirmed) {
                    setIsConfirmed(true);
                    setLoading(false);
                    clearInterval(interval);
                    toast.success('¡Email verificado! Redirigiendo...');
                    // Damos un momento para que el usuario vea el check verde
                    setTimeout(() => {
                        navigate(`/login?verified=true&email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}`);
                    }, 2000);
                }
            } catch (err) {
                console.error('Error polling verification:', err);
            }
        };

        // Poll cada 3 segundos
        interval = setInterval(checkStatus, 3000);
        checkStatus(); // Primera ejecución inmediata

        return () => clearInterval(interval);
    }, [email, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass rounded-3xl p-8 text-center border border-white/10 shadow-2xl">
                    <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                        {isConfirmed ? (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                            >
                                <CheckCircle2 className="w-10 h-10 text-green-400" />
                            </motion.div>
                        ) : (
                            <>
                                <Mail className="w-10 h-10 text-primary-400" />
                                <div className="absolute inset-0 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin" />
                            </>
                        )}
                    </div>

                    <h1 className="font-display text-2xl font-bold text-white mb-4">
                        {isConfirmed ? '¡Cuenta Activada!' : 'Verificá tu Email'}
                    </h1>
                    
                    <p className="text-white/60 mb-8 leading-relaxed">
                        {isConfirmed ? (
                            'Tu cuenta ha sido validada con éxito. En instantes serás redirigido para continuar.'
                        ) : (
                            <>
                                Hemos enviado un enlace de confirmación a <br />
                                <span className="text-primary-400 font-semibold">{email}</span>.
                                <br /><br />
                                Por favor, revisá tu casilla y hacé clic en el enlace para activar tu cuenta.
                            </>
                        )}
                    </p>

                    {!isConfirmed && (
                        <div className="space-y-6">
                            <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl text-left border border-white/5">
                                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-white/50">
                                    <span className="text-white font-medium">¿No lo encontrás?</span> Revisá tu carpeta de 
                                    <span className="text-amber-400 font-medium"> Spam</span> o correo no deseado.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-center gap-3 text-white/40 text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin font-bold" />
                                    <span>Esperando validación...</span>
                                </div>
                                
                                <p className="text-xs text-white/20">
                                    Esta pantalla se actualizará automáticamente cuando valides tu cuenta.
                                </p>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <Link to="/login" className="text-sm text-primary-400 hover:text-primary-300 font-medium flex items-center justify-center gap-2 transition-colors">
                                    Volver al inicio de sesión
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
