import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import {
    Plus, Calendar, Camera, Users, Settings, Trash2,
    QrCode, Monitor, BarChart3, Image as ImageIcon,
    LogOut, ChevronRight, Eye, EyeOff
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import toast from 'react-hot-toast';

export default function Dashboard() {
    const { user, signOut, getToken } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalEvents: 0, totalPhotos: 0, activeEvents: 0 });

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
            // Mostrar datos demo si no hay API
            setEvents([
                {
                    id: 'demo-1',
                    name: 'Boda de María y Juan',
                    type: 'wedding',
                    date: '2026-05-15',
                    short_code: 'BODA2026',
                    is_active: true,
                    photo_count: 142,
                    guest_count: 85,
                },
                {
                    id: 'demo-2',
                    name: 'Cumpleaños de Ana',
                    type: 'birthday',
                    date: '2026-04-20',
                    short_code: 'ANA30',
                    is_active: true,
                    photo_count: 67,
                    guest_count: 35,
                },
                {
                    id: 'demo-3',
                    name: 'Meeting Anual Corp',
                    type: 'corporate',
                    date: '2026-06-10',
                    short_code: 'CORP26',
                    is_active: false,
                    photo_count: 0,
                    guest_count: 0,
                },
            ]);
            setStats({ totalEvents: 3, totalPhotos: 209, activeEvents: 2 });
        } finally {
            setLoading(false);
        }
    };

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
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.is_active ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/40'
                                            }`}>
                                            {event.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
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
                                            <p className="text-sm font-medium text-white/70">{event.short_code}</p>
                                            <p className="text-xs text-white/40">Código</p>
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
