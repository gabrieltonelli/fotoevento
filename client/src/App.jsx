import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

function ProtectedRoute({ children }) {
    const { user, profile, loading, isDevMode } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-950">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return <Navigate to="/login" />;

    // Eliminamos la redirección automática a pricing para evitar bloqueos.
    // El Dashboard y las otras páginas ya manejan sus propios avisos de suscripción.

    return children;
}

export default function App() {
    const location = useLocation();

    useEffect(() => {
        // Manejar errores de autenticación que vienen en el hash (ej. links expirados)
        const hash = window.location.hash;
        if (hash.includes('error=')) {
            const params = new URLSearchParams(hash.substring(1));
            const errorCode = params.get('error_code');
            const errorDesc = params.get('error_description');

            if (errorCode === 'otp_expired' || errorDesc?.includes('expired')) {
                toast.error('El enlace de confirmación ha expirado. Por favor, registrate de nuevo o solicitá un nuevo enlace.', { duration: 6000 });
            } else {
                toast.error(errorDesc || 'Error de autenticación');
            }
            
            // Limpiar el hash de la URL sin recargar
            window.history.replaceState(null, '', window.location.pathname);
        }
    }, [location]);

    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/events/new" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
            <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
            <Route path="/e/:shortCode" element={<PhotoUpload />} />
            <Route path="/screen/:shortCode" element={<EventScreen />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}
