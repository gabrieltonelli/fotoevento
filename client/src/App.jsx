import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import toast from 'react-hot-toast';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EventDetail from './pages/EventDetail';
import CreateEvent from './pages/CreateEvent';
import PhotoUpload from './pages/PhotoUpload';
import EventScreen from './pages/EventScreen';
import Pricing from './pages/Pricing';
import Billing from './pages/Billing';
import VerifyEmail from './pages/VerifyEmail';
import Support from './pages/Support';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowRight } from 'lucide-react';

function ProtectedRoute({ children }) {
    const { user, profile, loading, profileLoading } = useAuth();
    
    // Solo mostramos el spinner si no tenemos usuario o si tenemos usuario pero el perfil aún no cargó la primera vez
    if (loading || (user && profileLoading && !profile)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-950">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return <Navigate to="/login" />;

    // Si el usuario está logueado pero no tiene un plan seleccionado, lo mandamos a pricing
    if (profile && profile.subscription_plan === 'none') {
        return <Navigate to="/pricing" />;
    }

    return children;
}

export default function App() {
    const location = useLocation();
    const navigate = useNavigate();
    const [expiredModal, setExpiredModal] = useState(false);

    useEffect(() => {
        // Manejar errores de autenticación que vienen en el hash (ej. links expirados)
        const hash = window.location.hash;
        if (hash.includes('error=')) {
            const params = new URLSearchParams(hash.substring(1));
            const errorCode = params.get('error_code');
            const errorDesc = params.get('error_description');

            if (errorCode === 'otp_expired' || errorDesc?.includes('expired')) {
                setExpiredModal(true);
            } else {
                toast.error(errorDesc || 'Error de autenticación');
            }
            
            // Limpiar el hash de la URL sin recargar
            window.history.replaceState(null, '', window.location.pathname);
        }
    }, [location]);

    return (
        <>
            <AnimatePresence>
                {expiredModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md glass-dark rounded-3xl p-8 border border-white/10 shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h2 className="font-display text-2xl font-bold text-white mb-3">Enlace Expirado</h2>
                            <p className="text-white/60 text-sm mb-8 leading-relaxed">
                                El enlace de confirmación ha caducado por seguridad. <br /><br />
                                No te preocupes, podés volver a registrarte o re-enviar el correo de validación ingresando tus datos nuevamente.
                            </p>
                            <button
                                onClick={() => {
                                    setExpiredModal(false);
                                    navigate('/register');
                                }}
                                className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                            >
                                Volver a Registrarse
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/support" element={<Support />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/events/new" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
            <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
            <Route path="/e/:shortCode" element={<PhotoUpload />} />
            <Route path="/screen/:shortCode" element={<EventScreen />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </>
    );
}
