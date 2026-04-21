import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Calendar, Type, MapPin, Palette, Settings,
    Eye, EyeOff, QrCode, Lock, Users, Save, Crown, Clock, X
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import toast from 'react-hot-toast';

export default function CreateEvent() {
    const { user, profile, getToken } = useAuth();
    const navigate = useNavigate();
    console.log('--- DBG: Render CreateEvent ---');
    const [loading, setLoading] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [form, setForm] = useState({
        name: '',
        type: 'wedding',
        date: '',
        location: '',
        skin: 'classic-dark',
        require_auth: false,
        show_qr_on_screen: true,
        dark_mode: true,
        plan: 'free',
        max_photos: 50,
    });

    const eventTypes = [
        { value: 'wedding', label: 'Boda', emoji: '💍' },
        { value: 'birthday', label: 'Cumpleaños', emoji: '🎂' },
        { value: 'corporate', label: 'Corporativo', emoji: '🏢' },
        { value: 'conference', label: 'Conferencia', emoji: '🎤' },
        { value: 'graduation', label: 'Graduación', emoji: '🎓' },
        { value: 'party', label: 'Fiesta', emoji: '🎉' },
    ];

    const skins = [
        { value: 'classic-dark', label: 'Clásico Oscuro', preview: 'bg-dark-900' },
        { value: 'classic-light', label: 'Clásico Claro', preview: 'bg-gray-100' },
        { value: 'elegant-gold', label: 'Elegante Dorado', preview: 'bg-gradient-to-br from-amber-900 to-yellow-800', premium: true },
        { value: 'neon', label: 'Neon', preview: 'bg-gradient-to-br from-purple-900 to-pink-900', premium: true },
        { value: 'minimal', label: 'Minimalista', preview: 'bg-white', premium: true },
        { value: 'fiesta', label: 'Fiesta', preview: 'bg-gradient-to-br from-rose-600 to-orange-500', premium: true },
    ];

    const plans = [
        { id: 'free', name: 'Gratuito', price: 0, photos: import.meta.env.VITE_PLAN_FREE_MAX_PHOTOS || '50', desc: `Prueba de ${import.meta.env.VITE_FREE_TRIAL_MINUTES || '30'} mins` },
        { id: 'pro', name: 'Pro', price: parseInt(import.meta.env.VITE_PLAN_PRO_PRICE || '4990'), photos: import.meta.env.VITE_PLAN_PRO_MAX_PHOTOS || '500', desc: 'Para fiestas grandes' },
        { id: 'premium', name: 'Premium', price: parseInt(import.meta.env.VITE_PLAN_PREMIUM_PRICE || '9990'), photos: '∞', desc: 'Sin límites' },
    ];

    const handleChange = (key, value) => {
        setForm(prev => {
            const updates = { [key]: value };
            if (key === 'plan') {
                const planLimit = { 
                    free: parseInt(import.meta.env.VITE_PLAN_FREE_MAX_PHOTOS || '50'), 
                    pro: parseInt(import.meta.env.VITE_PLAN_PRO_MAX_PHOTOS || '500'), 
                    premium: 999999 
                };
                updates.max_photos = planLimit[value];
            }
            return { ...prev, ...updates };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('--- DBG: Click en Crear Evento ---');
        console.log('Form State:', form);

        if (!form.name || !form.date) {
            toast.error('Completá nombre y fecha del evento');
            return;
        }
        setLoading(true);
        try {
            const token = getToken();
            const data = await api.createEvent(form, token);
            toast.success('¡Evento creado!');
            navigate(`/events/${data.event?.id || 'demo-1'}`);
        } catch (err) {
            console.log('--- DBG: Create Event Error ---');
            console.log('Error Object:', err);
            console.log('Limit Reached Flag:', err.limit_reached);
            
            if (err.limit_reached) {
                setShowLimitModal(true);
            } else {
                toast.error(err.message || 'Error al crear el evento');
                // Solo modo demo si no hay token o es un error de red
                if (!getToken()) {
                    toast.success('Simulando creación (modo demo)');
                    navigate('/dashboard');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-950">
            <Navbar />
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/40 hover:text-white mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                </button>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="font-display text-3xl font-bold text-white mb-2">Crear Nuevo Evento</h1>
                    <p className="text-white/50 mb-8">Configurá los detalles de tu evento.</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="glass rounded-2xl p-6 space-y-4">
                            <h3 className="font-display font-bold text-white flex items-center gap-2">
                                <Type className="w-5 h-5 text-primary-400" />
                                Información Básica
                            </h3>

                            <div>
                                <label className="block text-sm text-white/60 mb-1">Nombre del evento</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    placeholder="Ej: Boda de María y Juan"
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        value={form.date}
                                        onChange={(e) => handleChange('date', e.target.value)}
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-white/60 mb-1">Ubicación</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <input
                                            type="text"
                                            value={form.location}
                                            onChange={(e) => handleChange('location', e.target.value)}
                                            placeholder="Salón de fiestas..."
                                            className="input-field !pl-10"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Event Type */}
                        <div className="glass rounded-2xl p-6">
                            <h3 className="font-display font-bold text-white flex items-center gap-2 mb-4">
                                <Calendar className="w-5 h-5 text-primary-400" />
                                Tipo de Evento
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {eventTypes.map(type => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => handleChange('type', type.value)}
                                        className={`p-4 rounded-xl border text-center transition-all ${form.type === type.value
                                                ? 'border-primary-500 bg-primary-500/10 text-white'
                                                : 'border-white/5 bg-white/5 text-white/60 hover:border-white/20'
                                            }`}
                                    >
                                        <span className="text-2xl block mb-1">{type.emoji}</span>
                                        <span className="text-sm font-medium">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Skin Selection */}
                        <div className="glass rounded-2xl p-6">
                            <h3 className="font-display font-bold text-white flex items-center gap-2 mb-4">
                                <Palette className="w-5 h-5 text-primary-400" />
                                Skin de Pantalla
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {skins.map(skin => (
                                    <button
                                        key={skin.value}
                                        type="button"
                                        disabled={skin.premium && profile?.subscription_plan === 'free'}
                                        onClick={() => handleChange('skin', skin.value)}
                                        className={`relative rounded-xl border overflow-hidden transition-all ${form.skin === skin.value
                                                ? 'border-primary-500 ring-2 ring-primary-500/30'
                                                : 'border-white/5 hover:border-white/20'
                                            } ${skin.premium && profile?.subscription_plan === 'free' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className={`h-16 ${skin.preview}`} />
                                        <div className="p-2 bg-dark-900/50">
                                            <span className="text-xs font-medium text-white/70">{skin.label}</span>
                                        </div>
                                        {skin.premium && profile?.subscription_plan === 'free' && (
                                            <div className="absolute top-1 right-1">
                                                <Crown className="w-3 h-3 text-amber-400" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>


                        {/* Settings */}
                        <div className="glass rounded-2xl p-6 space-y-4">
                            <h3 className="font-display font-bold text-white flex items-center gap-2">
                                <Settings className="w-5 h-5 text-primary-400" />
                                Configuración
                            </h3>

                            <div className="space-y-3">
                                {[
                                    { key: 'require_auth', label: 'Requerir registro para subir fotos', desc: 'Los invitados deben registrarse antes de enviar fotos', icon: Lock },
                                    { key: 'show_qr_on_screen', label: 'Mostrar QR en pantalla', desc: 'Muestra el código QR en una esquina de la pantalla de proyección', icon: QrCode },
                                    { key: 'dark_mode', label: 'Modo oscuro en pantalla', desc: 'La pantalla de proyección usará fondo oscuro', icon: Eye },
                                ].map(({ key, label, desc, icon: Icon }) => (
                                    <label key={key} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-5 h-5 text-white/40" />
                                            <div>
                                                <p className="text-sm font-medium text-white">{label}</p>
                                                <p className="text-xs text-white/40">{desc}</p>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={form[key]}
                                                onChange={(e) => handleChange(key, e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${form[key] ? 'bg-primary-500' : 'bg-white/10'}`}>
                                                 <div className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${form[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>


                        </div>

                        <button type="submit" disabled={loading} className="w-full btn-primary flex items-center justify-center gap-2 text-lg disabled:opacity-50">
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Crear Evento
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </main>

            {/* Limit Reached Modal */}
            <AnimatePresence>
                {showLimitModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLimitModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md glass rounded-3xl p-8 text-center border border-white/10"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center mx-auto mb-6">
                                <Crown className="w-10 h-10 text-amber-400" />
                            </div>
                            
                            <h2 className="font-display text-2xl font-bold text-white mb-3">¡Límite de eventos alcanzado!</h2>
                            <p className="text-white/60 text-sm mb-8 leading-relaxed">
                                Has completado tus {import.meta.env.VITE_FREE_TRIAL_COUNT || '5'} eventos gratuitos. 
                                <br /><br />
                                Mejorando a un plan **Pro** o **Premium** podrás crear eventos ilimitados, subir más fotos y personalizar la experiencia al máximo.
                            </p>

                            <div className="flex flex-col gap-3">
                                <Link
                                    to="/pricing"
                                    className="w-full btn-primary !bg-gradient-to-r !from-amber-400 !to-orange-500 !border-none text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                                >
                                    Ver Planes y Precios
                                    <Crown className="w-4 h-4" />
                                </Link>
                                <button
                                    onClick={() => setShowLimitModal(false)}
                                    className="w-full py-3 text-white/40 hover:text-white transition-colors text-sm"
                                >
                                    Quizás más tarde
                                </button>
                            </div>

                            <button
                                onClick={() => setShowLimitModal(false)}
                                className="absolute top-4 right-4 p-2 text-white/20 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
