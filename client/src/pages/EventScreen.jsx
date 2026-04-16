import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { api } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image as ImageIcon } from 'lucide-react';

export default function EventScreen() {
    const { shortCode } = useParams();
    const [event, setEvent] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showQR, setShowQR] = useState(true);

    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const uploadUrl = `${appUrl}/e/${shortCode}`;

    useEffect(() => {
        // Load event data
        api.getPublicEvent(shortCode)
            .then(data => {
                setEvent(data.event);
                setShowQR(data.event?.show_qr_on_screen !== false);
            })
            .catch(() => {
                setEvent({ name: 'Evento Demo', short_code: shortCode, dark_mode: true, show_qr_on_screen: true });
            });

        // Load existing photos
        api.getPhotos(shortCode)
            .then(data => setPhotos(data.photos || []))
            .catch(() => { });

        // Subscribe to realtime updates
        const channel = supabase
            .channel(`photos-${shortCode}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'photos',
                filter: `event_short_code=eq.${shortCode}`,
            }, (payload) => {
                if (payload.new.status === 'approved') {
                    setPhotos(prev => [...prev, payload.new]);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [shortCode]);

    // Auto-cycle through photos
    useEffect(() => {
        if (photos.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % photos.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [photos.length]);

    const isDark = event?.dark_mode !== false;

    return (
        <div className={`min-h-screen ${isDark ? 'bg-dark-950' : 'bg-gray-50'} overflow-hidden relative`}>
            {/* Background effects */}
            {isDark && (
                <>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-950/20 via-transparent to-transparent" />
                    <div className="absolute top-0 left-0 w-full h-full">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-float" />
                        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/5 rounded-full blur-3xl animate-float animate-delay-300" />
                    </div>
                </>
            )}

            {/* Main Content */}
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
                {/* Event Title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                            <Camera className="w-5 h-5 text-white" />
                        </div>
                        <h1 className={`font-display text-4xl font-bold ${isDark ? 'gradient-text' : 'text-gray-900'}`}>
                            {event?.name || 'FotoEvento'}
                        </h1>
                    </div>
                    <p className={`text-lg ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                        ¡Subí tus fotos escaneando el QR!
                    </p>
                </motion.div>

                {/* Photo Display */}
                {photos.length > 0 ? (
                    <div className="w-full max-w-4xl aspect-video relative rounded-3xl overflow-hidden shadow-2xl">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, scale: 1.05 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.8 }}
                                className="absolute inset-0"
                            >
                                <img
                                    src={photos[currentIndex]?.url || ''}
                                    alt=""
                                    className="w-full h-full object-contain bg-black/50"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                {/* Photo info overlay */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                                    <p className="text-white/80 text-sm">
                                        {photos[currentIndex]?.guest_name && `📸 ${photos[currentIndex].guest_name}`}
                                    </p>
                                    <p className="text-white/40 text-xs mt-1">
                                        {currentIndex + 1} / {photos.length}
                                    </p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`w-full max-w-4xl aspect-video rounded-3xl flex flex-col items-center justify-center ${isDark ? 'glass' : 'bg-white shadow-xl border border-gray-200'
                            }`}
                    >
                        <ImageIcon className={`w-24 h-24 ${isDark ? 'text-white/5' : 'text-gray-200'} mb-4`} />
                        <p className={`text-xl font-display ${isDark ? 'text-white/20' : 'text-gray-400'}`}>
                            Esperando fotos...
                        </p>
                        <p className={`text-sm mt-2 ${isDark ? 'text-white/10' : 'text-gray-300'}`}>
                            Escaneá el QR para subir la primera foto
                        </p>
                    </motion.div>
                )}

                {/* Photo count */}
                <div className={`mt-6 text-center ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                    <p className="text-sm font-display">{photos.length} fotos compartidas</p>
                </div>
            </div>

            {/* QR Code Overlay */}
            {showQR && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 }}
                    className="fixed bottom-8 right-8 z-20"
                >
                    <div className={`${isDark ? 'glass' : 'bg-white shadow-xl'} rounded-2xl p-4 text-center`}>
                        <div className="bg-white rounded-xl p-2 mb-2">
                            <QRCodeSVG value={uploadUrl} size={120} level="H" />
                        </div>
                        <p className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                            Escaneá para subir fotos
                        </p>
                        <p className={`text-lg font-mono font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {shortCode}
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
