import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Check, AlertTriangle, User, Clock, Image as ImageIcon } from 'lucide-react';
import { resizeImage } from '../utils/imageUtils';
import { hashFile } from '../utils/hashUtils';
import toast from 'react-hot-toast';

const MAX_PHOTOS_PER_UPLOAD = parseInt(import.meta.env.VITE_MAX_PHOTOS_PER_UPLOAD || '3', 10);

export default function PhotoUpload() {
    const { shortCode } = useParams();
    const fileInput = useRef(null);
    const [event, setEvent] = useState(null);
    const [guestName, setGuestName] = useState('');
    const [photos, setPhotos] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [uploadedCount, setUploadedCount] = useState(0);
    const photoIdCounter = useRef(0);
    const [showTrialModal, setShowTrialModal] = useState(false);
    const uploadedHashes = useRef(new Set()); // Track hashes of already uploaded photos

    useEffect(() => {
        // Load event info
        api.getPublicEvent(shortCode)
            .then(data => setEvent(data.event))
            .catch(() => {
                setEvent({
                    name: 'Evento Foto Eventos',
                    type: 'party',
                    require_auth: false,
                });
            });
    }, [shortCode]);

    const handleFiles = async (files) => {
        const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (validFiles.length === 0) {
            toast.error('Solo se permiten imágenes');
            return;
        }

        // Count pending photos (not yet uploaded)
        const pendingCount = photos.filter(p => p.status === 'pending').length;
        const availableSlots = MAX_PHOTOS_PER_UPLOAD - pendingCount;

        if (availableSlots <= 0) {
            toast.error(`Máximo ${MAX_PHOTOS_PER_UPLOAD} fotos por envío`);
            return;
        }

        let filesToAdd = validFiles;
        if (validFiles.length > availableSlots) {
            filesToAdd = validFiles.slice(0, availableSlots);
            toast(`Se agregaron ${availableSlots} de ${validFiles.length} fotos (máx. ${MAX_PHOTOS_PER_UPLOAD} por envío)`, { icon: '⚠️' });
        }

        const newPhotos = [];
        let duplicatesFound = 0;

        for (const file of filesToAdd) {
            // Compute hash for duplicate detection
            let fileHash = '';
            try {
                fileHash = await hashFile(file);
            } catch (e) {
                console.warn('Hash error, skipping duplicate check:', e);
            }

            // Check against already uploaded hashes
            if (fileHash && uploadedHashes.current.has(fileHash)) {
                duplicatesFound++;
                continue;
            }

            // Check against current selection
            const alreadySelected = photos.some(p => p.hash === fileHash && fileHash);
            if (alreadySelected) {
                duplicatesFound++;
                continue;
            }

            newPhotos.push({
                id: ++photoIdCounter.current,
                file,
                hash: fileHash,
                preview: URL.createObjectURL(file),
                status: 'pending',
                message: '',
            });
        }

        if (duplicatesFound > 0) {
            toast(`${duplicatesFound} foto(s) duplicada(s) detectada(s) y omitida(s)`, { icon: '🔁' });
        }

        if (newPhotos.length > 0) {
            setPhotos(prev => [...prev, ...newPhotos]);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    const removePhoto = (photoId) => {
        setPhotos(prev => {
            const photo = prev.find(p => p.id === photoId);
            if (photo) URL.revokeObjectURL(photo.preview);
            return prev.filter(p => p.id !== photoId);
        });
    };

    const uploadAll = async () => {
        const pendingPhotos = photos.filter(p => p.status === 'pending');
        if (pendingPhotos.length === 0) return;
        setUploading(true);

        let successCount = 0;
        let failCount = 0;

        for (const photo of pendingPhotos) {
            // Mark as uploading
            setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, status: 'uploading' } : p));

            try {
                let fileToUpload = photo.file;
                try {
                    fileToUpload = await resizeImage(photo.file);
                } catch (resizeErr) {
                    console.warn('Error resizing, uploading original:', resizeErr);
                }

                await api.uploadPhoto(shortCode, fileToUpload, null, guestName, photo.hash);

                // Track hash as uploaded
                if (photo.hash) uploadedHashes.current.add(photo.hash);

                // Mark as success
                setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, status: 'success', message: '¡Aprobada!' } : p));
                setUploadedCount(c => c + 1);
                successCount++;

                // Remove after 1.5s with animation
                setTimeout(() => {
                    removePhoto(photo.id);
                }, 1500);
            } catch (err) {
                failCount++;
                if (err.trial_expired) {
                    setShowTrialModal(true);
                }
                setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, status: 'error', message: err.message } : p));
                // If it's trial expired, stop trying others
                if (err.trial_expired) break;
            }
        }

        setUploading(false);
        if (successCount > 0 && failCount === 0) {
            toast.success('¡Fotos enviadas! Podés seguir subiendo más.');
        } else if (failCount > 0) {
            toast.error('Hubo errores al subir algunas fotos.');
        }
    };

    return (
        <div className="min-h-screen bg-dark-950 flex flex-col">
            {/* Header */}
            <header className="glass border-b border-white/5 p-4">
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-white text-lg">{event?.name || 'Cargando...'}</h1>
                        <p className="text-white/40 text-xs">Subí tus fotos al evento</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
                {/* Guest Name (optional) */}
                {event && !event.require_auth && (
                    <div className="mb-6">
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                                type="text"
                                placeholder="Tu nombre (opcional)"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                className="input-field !pl-10 !text-sm"
                            />
                        </div>
                    </div>
                )}

                {/* Event Inactive Alert */}
                {event && !event.is_active && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-6 text-center"
                    >
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <h2 className="font-display font-bold text-white text-lg mb-1">Evento Finalizado o Desactivado</h2>
                        <p className="text-white/60 text-sm">
                            Ya no es posible subir fotos a este evento. ¡Gracias por participar!
                        </p>
                    </motion.div>
                )}

                {/* Upload Zone */}
                <div
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${dragOver
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        } ${(event && !event.is_active) ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                    onDragOver={(e) => { 
                        if (event?.is_active === false) return;
                        e.preventDefault(); 
                        setDragOver(true); 
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        if (event?.is_active === false) return;
                        handleDrop(e);
                    }}
                    onClick={() => {
                        if (event?.is_active === false) return;
                        fileInput.current?.click();
                    }}
                >
                    <input
                        ref={fileInput}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                        disabled={event && !event.is_active}
                    />

                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-primary-400" />
                    </div>

                    <p className="font-display font-bold text-white mb-1">
                        {dragOver ? 'Soltá las fotos aquí' : 'Tocá para seleccionar fotos'}
                    </p>
                    <p className="text-white/40 text-sm">o arrastrá y soltá imágenes</p>
                    <p className="text-white/30 text-xs mt-2">Máximo {MAX_PHOTOS_PER_UPLOAD} fotos por envío</p>
                </div>

                {/* Photo Previews */}
                <AnimatePresence>
                    {photos.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-white/50">
                                    {photos.filter(p => p.status === 'pending').length} pendiente(s)
                                </span>
                                {uploadedCount > 0 && (
                                    <span className="text-sm text-green-400">✓ {uploadedCount} subida(s) en total</span>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <AnimatePresence mode="popLayout">
                                {photos.map((photo) => (
                                    <motion.div
                                        key={photo.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="relative aspect-square rounded-xl overflow-hidden group"
                                    >
                                        <img src={photo.preview} alt="" className="w-full h-full object-cover" />

                                        {/* Status overlay */}
                                        {photo.status === 'uploading' && (
                                            <div className="absolute inset-0 bg-dark-950/70 flex items-center justify-center">
                                                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                        {photo.status === 'success' && (
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="absolute inset-0 bg-green-500/30 flex flex-col items-center justify-center"
                                            >
                                                <motion.div 
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring', stiffness: 300 }}
                                                    className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mb-1"
                                                >
                                                    <Check className="w-6 h-6 text-white" />
                                                </motion.div>
                                                <span className="text-xs text-green-300 font-medium">¡Subida!</span>
                                            </motion.div>
                                        )}
                                        {photo.status === 'error' && (
                                            <div className="absolute inset-0 bg-red-500/20 flex flex-col items-center justify-center p-2">
                                                <AlertTriangle className="w-6 h-6 text-red-400 mb-1" />
                                                <span className="text-xs text-red-300 text-center">{photo.message}</span>
                                            </div>
                                        )}

                                        {/* Remove button */}
                                        {photo.status === 'pending' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-dark-950/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3 text-white" />
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                                </AnimatePresence>
                            </div>

                            {/* Upload Button */}
                            <button
                                onClick={uploadAll}
                                disabled={uploading || photos.every(p => p.status === 'success')}
                                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Subiendo...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        Enviar Fotos
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Info */}
                <div className="mt-8 text-center">
                    <p className="text-white/30 text-xs">
                        Las fotos son revisadas por IA antes de mostrarse en la pantalla del evento.
                        Contenido inapropiado será rechazado automáticamente.
                    </p>
                </div>
            </main>

            {/* Trial Expired Modal */}
            <AnimatePresence>
                {showTrialModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTrialModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm glass rounded-3xl p-8 text-center border border-white/10"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center mx-auto mb-6">
                                <Clock className="w-10 h-10 text-amber-400" />
                            </div>
                            
                            <h2 className="font-display text-2xl font-bold text-white mb-3">Periodo de prueba finalizado</h2>
                            <p className="text-white/60 text-sm mb-8 leading-relaxed">
                                Este evento ha completado su tiempo de prueba gratuito de {import.meta.env.VITE_FREE_TRIAL_MINUTES || '30'} minutos. 
                                <br /><br />
                                Avisale al organizador para que mejore su plan y así poder compartir tus mejores momentos.
                            </p>

                            <button
                                onClick={() => setShowTrialModal(false)}
                                className="w-full btn-primary !bg-gradient-to-r !from-amber-400 !to-orange-500 !border-none text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20"
                            >
                                Entendido
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
