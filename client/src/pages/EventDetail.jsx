import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
    ArrowLeft, Monitor, QrCode, Copy, Download, Settings,
    Camera, Users, Calendar, MapPin, Share2, ExternalLink,
    Trash2, Power, PowerOff, Image as ImageIcon, Loader2, X, Crown,
    Pencil, Check
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function EventDetail() {
    const { id } = useParams();
    const { getToken, isTrialExpired, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const qrRef = useRef(null);

    const [event, setEvent] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', date: '', location: '' });
    const [isUpdating, setIsUpdating] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);

    const pageSize = parseInt(import.meta.env.VITE_DASHBOARD_PAGE_SIZE || '24', 10);

    const loadEvent = useCallback(async () => {
        try {
            await refreshProfile();
            const token = getToken();
            const data = await api.getEvent(id, token);
            setEvent(data.event);
            setEditForm({
                name: data.event.name,
                date: data.event.date.split('T')[0],
                location: data.event.location || ''
            });
        } catch (err) {
            console.error('Error loading event:', err);
            toast.error('No se pudo cargar el evento');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    }, [id, getToken, navigate, refreshProfile]);

    // Fetch event data from API
    useEffect(() => {
        loadEvent();
    }, [id, getToken, navigate]);

    const handleUpdateEvent = async () => {
        if (!editForm.name || !editForm.date) {
            toast.error('Nombre y fecha son requeridos');
            return;
        }

        setIsUpdating(true);
        try {
            const token = getToken();
            await api.updateEvent(event.id, editForm, token);
            toast.success('Evento actualizado');
            setIsEditing(false);
            loadEvent(); // Recargar datos
        } catch (err) {
            toast.error('Error al actualizar el evento');
        } finally {
            setIsUpdating(false);
        }
    };

    // Fetch photos with pagination
    useEffect(() => {
        if (!event) return;
        const loadPhotos = async () => {
            try {
                const data = await api.getPhotos(event.id, pagination.page, pageSize);
                setPhotos(data.photos || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.total,
                    totalPages: data.totalPages
                }));
            } catch (err) {
                console.error('Error loading photos:', err);
            }
        };
        loadPhotos();
    }, [event, pagination.page, pageSize]);

    const handleDownloadAll = useCallback(async () => {
        if (isTrialExpired()) {
            toast.error('Tu tiempo de prueba gratuito ha expirado. Mejorá tu plan para descargar todas las fotos.', {
                duration: 5000,
                icon: '⏳'
            });
            navigate('/pricing');
            return;
        }

        setIsDownloadingAll(true);
        const zip = new JSZip();

        try {
            toast.loading('Obteniendo lista completa de fotos...', { id: 'zip-toast' });

            const allPhotosData = await api.getPhotos(event.id, 1, 10000);
            const allPhotos = allPhotosData.photos || [];

            if (allPhotos.length === 0) {
                toast.error('No hay fotos para descargar', { id: 'zip-toast' });
                return;
            }

            toast.loading(`Descargando ${allPhotos.length} fotos...`, { id: 'zip-toast' });

            const promises = allPhotos.map(async (photo, index) => {
                try {
                    const response = await fetch(photo.url);
                    const blob = await response.blob();
                    const extension = photo.url.split('.').pop().split('?')[0] || 'jpg';
                    const filename = `${photo.guest_name}-${index + 1}.${extension}`;
                    zip.file(filename, blob);
                } catch (err) {
                    console.error(`Error descargando foto ${index}:`, err);
                }
            });

            await Promise.all(promises);

            toast.loading('Generando archivo ZIP final...', { id: 'zip-toast' });
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `fotos-${event.name}-${event.short_code}-completo.zip`);

            toast.success('¡Respaldo completo descargado!', { id: 'zip-toast' });
        } catch (err) {
            console.error('Error in handleDownloadAll:', err);
            toast.error('Error al procesar la descarga masiva', { id: 'zip-toast' });
        } finally {
            setIsDownloadingAll(false);
        }
    }, [event, isTrialExpired, navigate]);

    const downloadSingle = useCallback(async (e, photo) => {
        e.stopPropagation();

        if (isTrialExpired()) {
            toast.error('Sesión expirada. Mejorá tu plan para descargar fotos.', { icon: '⏳' });
            navigate('/pricing');
            return;
        }

        try {
            const response = await fetch(photo.url);
            const blob = await response.blob();
            saveAs(blob, `foto-${photo.guest_name}-${Date.now()}.jpg`);
        } catch (err) {
            toast.error('Error al descargar la foto');
        }
    }, [isTrialExpired, navigate]);

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

            /* Quitamos el texto del código para simplificar el QR */
            // ctx.fillStyle = '#333333';
            // ctx.font = 'bold 24px sans-serif';
            // ctx.textAlign = 'center';
            // ctx.fillText(`Código: ${event.short_code}`, canvas.width / 2, size + padding + 40);

            // Download
            const link = document.createElement('a');
            link.download = `QR-${event.name}-${event.short_code}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success('QR descargado');
        };

        img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
    };

    const skins = [
        { value: 'classic-dark', label: 'Clásico Oscuro', preview: 'bg-dark-900' },
        { value: 'classic-light', label: 'Clásico Claro', preview: 'bg-gray-100' },
        { value: 'elegant-gold', label: 'Elegante Dorado', preview: 'bg-gradient-to-br from-amber-900 to-yellow-800', premium: true },
        { value: 'neon', label: 'Neon', preview: 'bg-gradient-to-br from-purple-900 to-pink-900', premium: true },
        { value: 'minimal', label: 'Minimalista', preview: 'bg-white', premium: true },
        { value: 'fiesta', label: 'Fiesta', preview: 'bg-gradient-to-br from-rose-600 to-orange-500', premium: true },
    ];

    const handleUpdateSkin = async (skinValue) => {
        if (event.plan === 'free' && skins.find(s => s.value === skinValue)?.premium) {
            toast.error('Este skin requiere un plan Pro o Premium');
            navigate(`/pricing?event=${event.id}`);
            return;
        }

        try {
            const token = getToken();
            await api.updateEvent(event.id, { skin: skinValue }, token);
            setEvent(prev => ({ ...prev, skin: skinValue }));
            toast.success('Skin actualizado');
        } catch (err) {
            toast.error('Error al actualizar el skin');
        }
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
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex-1 w-full">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-2xl font-bold text-white focus:outline-none focus:border-primary-500/50 transition-colors"
                                        placeholder="Nombre del evento"
                                    />
                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 min-w-[200px]">
                                            <Calendar className="w-4 h-4 text-white/40" />
                                            <input
                                                type="date"
                                                value={editForm.date}
                                                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                                className="bg-transparent text-sm text-white focus:outline-none w-full"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 flex-1">
                                            <MapPin className="w-4 h-4 text-white/40" />
                                            <input
                                                type="text"
                                                value={editForm.location}
                                                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                                className="bg-transparent text-sm text-white focus:outline-none w-full"
                                                placeholder="Ubicación"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                        <button
                                            onClick={handleUpdateEvent}
                                            disabled={isUpdating}
                                            className="btn-primary !py-2 !text-xs flex items-center gap-2"
                                        >
                                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            Guardar Cambios
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="btn-ghost !py-2 !text-xs flex items-center gap-2"
                                        >
                                            <X className="w-4 h-4" />
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="font-display text-3xl font-bold text-white">{event.name}</h1>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${event.is_active ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/40'
                                            }`}>
                                            {event.is_active ? '● Activo' : '○ Inactivo'}
                                        </span>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all ml-2"
                                            title="Editar datos del evento"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-white/40">
                                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(event.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        {event.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{event.location}</span>}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
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
                                    { label: 'Fotos', value: pagination.total, max: event.max_photos, icon: ImageIcon, color: 'bg-primary-500' },
                                    { label: 'Plan', value: event.plan || 'free', icon: Users, color: 'bg-accent-500' },
                                ].map(({ label, value, max, icon: Icon, color }) => (
                                    <div key={label} className="relative group">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-white/50 flex items-center gap-2">
                                                <Icon className={`w-4 h-4 ${label === 'Fotos' && value / max > 0.8 ? 'text-orange-400 animate-pulse' : ''}`} />
                                                {label}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                {label === 'Plan' && value !== 'premium' && (
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => navigate(`/pricing?event=${event.id}`)}
                                                        className="flex items-center gap-1 text-[10px] uppercase font-black tracking-wider text-white bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-all"
                                                    >
                                                        <Crown className="w-3 h-3" />
                                                        Upgrade
                                                    </motion.button>
                                                )}
                                                <span className={`text-sm font-bold uppercase ${label === 'Fotos' && value / max > 0.8 ? 'text-orange-400' : 'text-white'}`}>
                                                    {value}{max ? `/${max}` : ''}
                                                </span>
                                            </div>
                                        </div>
                                        {max && (
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden relative">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                                                    className={`h-full rounded-full transition-all duration-1000 ${value / max > 0.8
                                                        ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'
                                                        : 'bg-primary-500'
                                                        }`}
                                                />
                                            </div>
                                        )}
                                        {label === 'Fotos' && value / max > 0.8 && (
                                            <p className="text-[10px] text-orange-400/80 mt-1 leading-tight font-medium">
                                                ⚠️ Estás cerca del límite. Tus fotos podrían dejar de aparecer pronto.
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Skin Selector */}
                            <div className="mt-8 pt-6 border-t border-white/5">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-primary-400" />
                                    Skin de Pantalla
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {skins.map(skin => (
                                        <button
                                            key={skin.value}
                                            onClick={() => handleUpdateSkin(skin.value)}
                                            className={`relative rounded-xl border overflow-hidden transition-all group ${event.skin === skin.value
                                                ? 'border-primary-500 ring-2 ring-primary-500/30'
                                                : 'border-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            <div className={`h-10 ${skin.preview}`} />
                                            <div className="p-2 bg-dark-900/50 flex items-center justify-between">
                                                <span className="text-[10px] font-medium text-white/70 truncate mr-1">{skin.label}</span>
                                                {skin.premium && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
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
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                                <h3 className="font-display font-bold text-white flex items-center gap-2">
                                    <Camera className="w-5 h-5 text-primary-400" />
                                    Fotos del Evento ({pagination.total})
                                </h3>

                                {photos.length > 0 && (
                                    <button
                                        onClick={handleDownloadAll}
                                        disabled={isDownloadingAll}
                                        className={`btn-secondary flex items-center gap-2 !text-xs !py-2 ${isTrialExpired() ? '!bg-amber-500/10 !text-amber-500 !border-amber-500/50 hover:!bg-amber-500/20' : ''
                                            }`}
                                        title={isTrialExpired() ? 'Requiere plan PRO o superior' : 'Descargar todas las fotos'}
                                    >
                                        {isDownloadingAll ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : isTrialExpired() ? (
                                            <Crown className="w-4 h-4" />
                                        ) : (
                                            <Download className="w-4 h-4" />
                                        )}
                                        {isTrialExpired() ? 'Mejorar para plan para Descargar Todas' : 'Descargar todas'}
                                    </button>
                                )}
                            </div>

                            {photos.length === 0 ? (
                                <div className="text-center py-16">
                                    <Camera className="w-16 h-16 text-white/10 mx-auto mb-4" />
                                    <p className="text-white/40">Aún no hay fotos. Compartí el QR con tus invitados.</p>
                                    <p className="text-white/20 text-sm mt-2">Link: {uploadUrl}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {photos.map((photo) => (
                                            <div
                                                key={photo.id}
                                                className="aspect-square rounded-xl overflow-hidden group cursor-pointer relative"
                                                onClick={() => setSelectedPhoto(photo)}
                                            >
                                                <img
                                                    src={photo.url}
                                                    alt={`Foto de ${photo.guest_name}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="absolute top-2 right-2">
                                                        <button
                                                            onClick={(e) => downloadSingle(e, photo)}
                                                            className={`p-2 rounded-lg text-white transition-colors ${isTrialExpired() ? 'bg-amber-500/90 hover:bg-amber-600' : 'bg-white/10 hover:bg-white/20'
                                                                }`}
                                                            title={isTrialExpired() ? 'Mejorar plan para descargar' : 'Descargar foto'}
                                                        >
                                                            {isTrialExpired() ? <Crown className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                    <div className="absolute bottom-2 left-2 text-xs text-white/80 font-medium bg-black/40 px-2 py-1 rounded-md">
                                                        {photo.guest_name}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination Controls */}
                                    {pagination.totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-4 mt-8">
                                            <button
                                                disabled={pagination.page === 1}
                                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                                className="btn-ghost !p-2 disabled:opacity-30"
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                            </button>
                                            <span className="text-sm text-white/60">
                                                Página <span className="text-white font-bold">{pagination.page}</span> de {pagination.totalPages}
                                            </span>
                                            <button
                                                disabled={pagination.page === pagination.totalPages}
                                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                                className="btn-ghost !p-2 disabled:opacity-30 flex rotate-180"
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* Zoom Modal */}
            <AnimatePresence>
                {selectedPhoto && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedPhoto(null)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center"
                        >
                            <img
                                src={selectedPhoto.url}
                                alt="Zoomed"
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-full text-white text-sm flex items-center gap-4">
                                <span className="font-bold">{selectedPhoto.guest_name}</span>
                                <div className="w-px h-4 bg-white/20" />
                                <button
                                    onClick={(e) => downloadSingle(e, selectedPhoto)}
                                    className={`transition-colors flex items-center gap-1 ${isTrialExpired() ? 'text-amber-500 font-bold hover:text-amber-400' : 'hover:text-primary-400'
                                        }`}
                                    title={isTrialExpired() ? 'Mejorar plan para descargar' : 'Descargar'}
                                >
                                    {isTrialExpired() ? <Crown className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                                    {isTrialExpired() ? 'Mejorar para plan para Descargar' : 'Descargar'}
                                </button>
                            </div>
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors"
                            >
                                <X className="w-8 h-8" />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
