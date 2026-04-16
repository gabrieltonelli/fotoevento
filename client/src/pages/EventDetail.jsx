import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
    ArrowLeft, Monitor, QrCode, Copy, Download, Settings,
    Camera, Users, Calendar, MapPin, Share2, ExternalLink,
    Trash2, Power, PowerOff, Image as ImageIcon
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import toast from 'react-hot-toast';

export default function EventDetail() {
    const { id } = useParams();
    const { getToken } = useAuth();
    const navigate = useNavigate();

    // Demo data
    const [event, setEvent] = useState({
        id,
        name: 'Boda de María y Juan',
        type: 'wedding',
        date: '2026-05-15',
        location: 'Salón Los Olivos',
        short_code: 'BODA2026',
        is_active: true,
        photo_count: 142,
        guest_count: 85,
        skin: 'classic-dark',
        require_auth: false,
        show_qr_on_screen: true,
        dark_mode: true,
        max_photos: 500,
    });

    const [photos, setPhotos] = useState([]);

    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const uploadUrl = `${appUrl}/e/${event.short_code}`;
    const screenUrl = `${appUrl}/screen/${event.short_code}`;

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copiado al portapapeles`);
    };

    return (
        <div className="min-h-screen bg-dark-950">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-white/40 hover:text-white mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Dashboard
                </button>

                {/* Event Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8 mb-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="font-display text-3xl font-bold text-white">{event.name}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${event.is_active ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/40'
                                    }`}>
                                    {event.is_active ? '● Activo' : '○ Inactivo'}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-white/40">
                                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(event.date).toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                {event.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{event.location}</span>}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <a href={screenUrl} target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center gap-2 !text-sm">
                                <Monitor className="w-4 h-4" />
                                Abrir Pantalla
                            </a>
                            <button className="btn-secondary flex items-center gap-2 !text-sm">
                                <Settings className="w-4 h-4" />
                                Editar
                            </button>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Stats & QR */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Stats */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
                            <h3 className="font-display font-bold text-white mb-4">Estadísticas</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Fotos', value: event.photo_count, max: event.max_photos, icon: ImageIcon, color: 'bg-primary-500' },
                                    { label: 'Invitados', value: event.guest_count, icon: Users, color: 'bg-accent-500' },
                                ].map(({ label, value, max, icon: Icon, color }) => (
                                    <div key={label}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-white/50 flex items-center gap-2">
                                                <Icon className="w-4 h-4" /> {label}
                                            </span>
                                            <span className="text-sm font-bold text-white">{value}{max ? `/${max}` : ''}</span>
                                        </div>
                                        {max && (
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${(value / max) * 100}%` }} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* QR Code */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6 text-center">
                            <h3 className="font-display font-bold text-white mb-4 flex items-center justify-center gap-2">
                                <QrCode className="w-5 h-5 text-primary-400" />
                                QR para Invitados
                            </h3>

                            <div className="inline-block p-4 bg-white rounded-2xl mb-4">
                                <QRCodeSVG value={uploadUrl} size={180} level="H" />
                            </div>

                            <div className="space-y-2">
                                <div className="glass rounded-lg px-4 py-2 flex items-center justify-between">
                                    <span className="text-sm text-white/60 truncate">{uploadUrl}</span>
                                    <button onClick={() => copyToClipboard(uploadUrl, 'Link')} className="text-primary-400 hover:text-primary-300 ml-2">
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="glass rounded-lg px-4 py-2 flex items-center justify-between">
                                    <span className="text-xl font-mono font-bold text-white">{event.short_code}</span>
                                    <button onClick={() => copyToClipboard(event.short_code, 'Código')} className="text-primary-400 hover:text-primary-300 ml-2">
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>

                                <button className="w-full btn-secondary flex items-center justify-center gap-2 !text-sm mt-2">
                                    <Download className="w-4 h-4" />
                                    Descargar QR
                                </button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Photos Grid */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
                        <div className="glass rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-display font-bold text-white flex items-center gap-2">
                                    <Camera className="w-5 h-5 text-primary-400" />
                                    Fotos del Evento
                                </h3>
                                <button className="btn-secondary flex items-center gap-2 !text-sm">
                                    <Download className="w-4 h-4" />
                                    Descargar Todas
                                </button>
                            </div>

                            {event.photo_count === 0 ? (
                                <div className="text-center py-16">
                                    <Camera className="w-16 h-16 text-white/10 mx-auto mb-4" />
                                    <p className="text-white/40">Aún no hay fotos. Compartí el QR con tus invitados.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {/* Placeholder photo grid */}
                                    {Array.from({ length: 9 }).map((_, i) => (
                                        <div key={i} className="aspect-square rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] overflow-hidden group cursor-pointer">
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-8 h-8 text-white/10 group-hover:text-white/20 transition-colors" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
