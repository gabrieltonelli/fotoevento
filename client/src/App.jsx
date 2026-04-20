import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
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
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
