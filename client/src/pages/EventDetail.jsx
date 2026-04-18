import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
    ArrowLeft, Monitor, QrCode, Copy, Download, Settings,
    Camera, Users, Calendar, MapPin, Share2, ExternalLink,
    Trash2, Power, PowerOff, Image as ImageIcon, Loader2
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import toast from 'react-hot-toast';

export default function EventDetail() {
    const { id } = useParams();
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const qrRef = useRef(null);

    const [event, setEvent] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch event data from API
    useEffect(() => {
        const loadEvent = async () => {
            try {
                const token = getToken();
                const data = await api.getEvent(id, token);
                setEvent(data.event);
            } catch (err) {
                console.error('Error loading event:', err);
                toast.error('No se pudo cargar el evento');
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        loadEvent();
    }, [id, getToken, navigate]);

    // Fetch photos
    useEffect(() => {
        if (!event) return;
        const loadPhotos = async () => {
            try {
                const data = await api.getPhotos(event.id);
                setPhotos(data.photos || []);
            } catch (err) {
                console.error('Error loading photos:', err);
            }
        };
        loadPhotos();
    }, [event]);

    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const uploadUrl = event ? `${appUrl}/e/${event.short_code}` : '';
    const screenUrl = event ? `${appUrl}/screen/${event.short_code}` : '';

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copiado al portapapeles`);
    };

    const downloadQR = () => {
        const svgElement = qrRef.current?.querySelector('svg');
        if (!svgElement) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();

        // QR size with padding
        const size = 400;
        const padding = 40;
        canvas.width = size + padding * 2;
        canvas.height = size + padding * 2 + 60; // Extra for text

        img.onload = () => {
            // White background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw QR
            ctx.drawImage(img, padding, padding, size, size);

            // Draw short code text below
            ctx.fillStyle = '#333333';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Código: ${event.short_code}`, canvas.width / 2, size + padding + 40);

            // Download
            const link = document.createElement('a');
            link.download = `QR-${event.name}-${event.short_code}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success('QR descargado');
        };

        img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
            </div>
        );
    }

    if (!event) return null;

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
                            <a href={uploadUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2 !text-sm">
                                <ExternalLink className="w-4 h-4" />
                                Ver Upload
                            </a>
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
                                    { label: 'Fotos', value: photos.length, max: event.max_photos, icon: ImageIcon, color: 'bg-primary-500' },
                                    { label: 'Plan', value: event.plan || 'free', icon: Users, color: 'bg-accent-500' },
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
                                                <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
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

                            <div ref={qrRef} className="inline-block p-4 bg-white rounded-2xl mb-4">
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

                                <button onClick={downloadQR} className="w-full btn-secondary flex items-center justify-center gap-2 !text-sm mt-2">
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
                                    Fotos del Evento ({photos.length})
                                </h3>
                            </div>

                            {photos.length === 0 ? (
                                <div className="text-center py-16">
                                    <Camera className="w-16 h-16 text-white/10 mx-auto mb-4" />
                                    <p className="text-white/40">Aún no hay fotos. Compartí el QR con tus invitados.</p>
                                    <p className="text-white/20 text-sm mt-2">Link: {uploadUrl}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {photos.map((photo) => (
                                        <div key={photo.id} className="aspect-square rounded-xl overflow-hidden group cursor-pointer relative">
                                            <img
                                                src={photo.url}
                                                alt={`Foto de ${photo.guest_name}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="absolute bottom-2 left-2 text-xs text-white/80">
                                                    {photo.guest_name}
                                                </div>
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
