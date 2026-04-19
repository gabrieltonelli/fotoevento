import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import {
    Plus, Calendar, Camera, Users, Settings, Trash2,
    QrCode, Monitor, BarChart3, Image as ImageIcon,
    LogOut, ChevronRight, Eye, EyeOff, CheckCircle, Crown,
    ArrowUpCircle, Power
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import toast from 'react-hot-toast';

export default function Dashboard() {
    const { user, signOut, getToken } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalEvents: 0, totalPhotos: 0, activeEvents: 0 });
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // Detectar retorno de pasarela de pago y activar plan automáticamente
    useEffect(() => {
        const paymentStatus = searchParams.get('payment');
        const plan = searchParams.get('plan');
        const eventId = searchParams.get('event');
        const processor = searchParams.get('processor');

        if (paymentStatus === 'success' && plan) {
            setPaymentSuccess(true);
            const token = getToken();
            if (token) {
                api.activateFromRedirect({
                    plan,
                    eventId: eventId || '',
                    processor: processor || '',
                }, token)
                    .then((res) => {
                        if (res.alreadyActive) {
                            toast.success('¡Tu plan ya estaba activo!');
                        } else {
                            toast.success(`¡Plan ${plan.toUpperCase()} activado exitosamente! 🎉`);
                        }
                        // Limpiar query params
                        setSearchParams({});
                        // Recargar eventos
                        loadEvents();
                    })
                    .catch(() => {
                        toast.success('¡Pago recibido! Tu plan se activará en breve.');
                        setSearchParams({});
                    });
            }

            // Auto-ocultar banner después de 8 seg
            setTimeout(() => setPaymentSuccess(false), 8000);
        }
    }, []);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const token = getToken();
            if (!token) return;
            const data = await api.getEvents(token);
            setEvents(data.events || []);
            setStats({
                totalEvents: data.events?.length || 0,
                totalPhotos: data.events?.reduce((sum, e) => sum + (e.photo_count || 0), 0) || 0,
                activeEvents: data.events?.filter(e => e.is_active)?.length || 0,
            });
        } catch (err) {
            console.error('Error loading events:', err);
            setEvents([]);
            setStats({ totalEvents: 0, totalPhotos: 0, activeEvents: 0 });
        } finally {
            setLoading(false);
        }
    };

    const toggleEventActive = async (e, eventId, currentStatus) => {
        e.stopPropagation(); // Evitar navegar al detalle
        try {
            const token = getToken();
            await api.updateEvent(eventId, { is_active: !currentStatus }, token);
            toast.success(`Evento ${!currentStatus ? 'activado' : 'desactivado'}`);
            loadEvents();
        } catch (err) {
            toast.error('Error al actualizar el estado');
        }
    };

    const hasPremium = events.some(e => e.plan === 'premium');

    const eventTypeEmoji = {
        wedding: '💍',
        birthday: '🎂',
        corporate: '🏢',
        conference: '🎤',
        graduation: '🎓',
        party: '🎉',
    };

    const eventTypeLabel = {
        wedding: 'Boda',
        birthday: 'Cumpleaños',
        corporate: 'Corporativo',
        conference: 'Conferencia',
        graduation: 'Graduación',
        party: 'Fiesta',
    };

    return (
        <div className="min-h-screen bg-dark-950">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                {/* Payment Success Banner */}
                {paymentSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-green-300">¡Pago exitoso!</p>
                            <p className="text-green-400/70 text-sm">Tu plan fue activado automáticamente. Ya podés disfrutar de todas las funcionalidades premium.</p>
                        </div>
                        <Crown className="w-8 h-8 text-green-400/30 ml-auto flex-shrink-0" />
                    </motion.div>
                )}

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-white">
                            Hola, {user?.user_metadata?.full_name || 'Usuario'} 👋
                        </h1>
                        <p className="text-white/50 mt-1">Gestioná tus eventos desde aquí.</p>
                    </div>
                    <Link to="/events/new" className="btn-primary flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Nuevo Evento
                    </Link>
                </div>

                {/* Upgrade Plan Banner */}
                {!hasPremium && events.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group shadow-[0_0_30px_rgba(251,191,36,0.05)]"
                    >
                        {/* Decorative background glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 p-0.5 shadow-lg">
                                <div className="w-full h-full rounded-2xl bg-dark-950 flex items-center justify-center">
                                    <Crown className="w-8 h-8 text-amber-400 animate-pulse" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    Experiencia Premium de Foto Eventos
                                </h3>
                                <p className="text-white/50 text-sm">Fotos ilimitadas, descarga completa de álbumes y personalización total.</p>
                            </div>
                        </div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full md:w-auto relative z-10">
                            <Link 
                                to="/pricing" 
                                className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black tracking-wider uppercase text-xs shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] transition-all"
                            >
                                <Crown className="w-4 h-4" />
                                Mejorar mi Plan
                            </Link>
                        </motion.div>
                    </motion.div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Eventos Totales', value: stats.totalEvents, icon: Calendar, color: 'from-primary-500 to-primary-600' },
                        { label: 'Fotos Totales', value: stats.totalPhotos, icon: ImageIcon, color: 'from-accent-500 to-accent-600' },
                        { label: 'Eventos Activos', value: stats.activeEvents, icon: Monitor, color: 'from-green-500 to-emerald-600' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <motion.div
                            key={label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/40 text-sm">{label}</p>
                                    <p className="font-display text-3xl font-bold text-white mt-1">{value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Events List */}
                <div className="space-y-4">
                    <h2 className="font-display text-xl font-bold text-white">Tus Eventos</h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : events.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass rounded-2xl p-12 text-center"
                        >
                            <Camera className="w-16 h-16 text-white/10 mx-auto mb-4" />
                            <h3 className="font-display text-xl font-bold text-white mb-2">Aún no tenés eventos</h3>
                            <p className="text-white/40 mb-6">Creá tu primer evento y empezá a recibir fotos en vivo.</p>
                            <Link to="/events/new" className="btn-primary inline-flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Crear Evento
                            </Link>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {events.map((event, i) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass rounded-2xl p-6 hover:bg-white/10 transition-all group cursor-pointer"
                                    onClick={() => navigate(`/events/${event.id}`)}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{eventTypeEmoji[event.type] || '📷'}</span>
                                            <div>
                                                <h3 className="font-display font-bold text-white group-hover:text-primary-300 transition-colors">{event.name}</h3>
                                                <p className="text-xs text-white/40">{eventTypeLabel[event.type] || event.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => toggleEventActive(e, event.id, event.is_active)}
                                                className={`p-2 rounded-xl transition-all ${
                                                    event.is_active 
                                                        ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' 
                                                        : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                                }`}
                                                title={event.is_active ? 'Desactivar Evento' : 'Activar Evento'}
                                            >
                                                <Power className="w-4 h-4" />
                                            </button>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.is_active ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/40'
                                                }`}>
                                                {event.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-white">{event.photo_count}</p>
                                            <p className="text-xs text-white/40">Fotos</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-white">{event.guest_count}</p>
                                            <p className="text-xs text-white/40">Invitados</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-white/70 uppercase">{event.plan || 'free'}</p>
                                            <p className="text-xs text-white/40">Plan</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white/40 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(event.date).toLocaleDateString('es-AR')}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-primary-400 transition-colors" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
