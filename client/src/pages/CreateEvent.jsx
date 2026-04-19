import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Calendar, Type, MapPin, Palette, Settings,
    Eye, EyeOff, QrCode, Lock, Users, Save
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import toast from 'react-hot-toast';

export default function CreateEvent() {
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
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
        { id: 'free', name: 'Gratuito', price: 0, photos: 50, desc: 'Ideal para probar' },
        { id: 'pro', name: 'Pro', price: 4990, photos: 500, desc: 'Para fiestas grandes' },
        { id: 'premium', name: 'Premium', price: 9990, photos: '∞', desc: 'Sin límites' },
    ];

    const handleChange = (key, value) => {
        setForm(prev => {
            const updates = { [key]: value };
            if (key === 'plan') {
                const planLimit = { free: 50, pro: 500, premium: 999999 };
                updates.max_photos = planLimit[value];
            }
            return { ...prev, ...updates };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
        } catch {
            toast.success('Evento creado (modo demo)');
            navigate('/dashboard');
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
                                        disabled={skin.premium && form.plan === 'free'}
                                        onClick={() => handleChange('skin', skin.value)}
                                        className={`relative rounded-xl border overflow-hidden transition-all ${form.skin === skin.value
                                                ? 'border-primary-500 ring-2 ring-primary-500/30'
                                                : 'border-white/5 hover:border-white/20'
                                            } ${skin.premium && form.plan === 'free' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className={`h-16 ${skin.preview}`} />
                                        <div className="p-2 bg-dark-900/50">
                                            <span className="text-xs font-medium text-white/70">{skin.label}</span>
                                        </div>
                                        {skin.premium && form.plan === 'free' && (
                                            <div className="absolute top-1 right-1">
                                                <Crown className="w-3 h-3 text-amber-400" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Plan Selection */}
                        <div className="glass rounded-2xl p-6">
                            <h3 className="font-display font-bold text-white flex items-center gap-2 mb-4">
                                <Crown className="w-5 h-5 text-amber-400" />
                                Seleccionar Plan
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {plans.map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => handleChange('plan', p.id)}
                                        className={`p-4 rounded-xl border text-left transition-all ${form.plan === p.id
                                                ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500'
                                                : 'border-white/5 bg-white/5 hover:border-white/20'
                                            }`}
                                    >
                                        <p className="text-xs font-bold text-primary-400 uppercase tracking-wider">{p.name}</p>
                                        <p className="text-xl font-bold text-white mt-1">
                                            {p.price === 0 ? 'Gratis' : `$${p.price.toLocaleString()}`}
                                        </p>
                                        <p className="text-xs text-white/40 mt-1 line-clamp-1">{p.desc}</p>
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <p className="text-xs text-white/60">Límite: <span className="text-white font-bold">{p.photos} fotos</span></p>
                                        </div>
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
                                            <div className={`w-11 h-6 rounded-full transition-colors ${form[key] ? 'bg-primary-500' : 'bg-white/10'}`}>
                                                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform mt-0.5 ${form[key] ? 'translate-x-5.5 ml-0.5' : 'translate-x-0.5'}`} />
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
        </div>
    );
}
