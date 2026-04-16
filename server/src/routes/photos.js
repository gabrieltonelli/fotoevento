import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../services/supabase.js';
import { optionalAuth } from '../middleware/auth.js';
import { moderateImage } from '../services/moderation.js';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'), false);
        }
    },
});

/**
 * POST /api/events/:eventId/photos - Upload a photo
 */
router.post('/:eventId/photos', optionalAuth, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se recibió ninguna imagen' });
        }

        const eventId = req.params.eventId;
        const guestName = req.body.guest_name || 'Anónimo';

        // Find event by ID or short_code
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('*')
            .or(`id.eq.${eventId},short_code.eq.${eventId}`)
            .single();

        if (eventError || !event) {
            return res.status(404).json({ message: 'Evento no encontrado' });
        }

        if (!event.is_active) {
            return res.status(403).json({ message: 'Este evento no está activo' });
        }

        // Check auth requirement
        if (event.require_auth && !req.user) {
            return res.status(401).json({ message: 'Este evento requiere registro para subir fotos' });
        }

        // Moderate image with AI
        let moderationResult = { safe: true, reason: '' };
        try {
            moderationResult = await moderateImage(req.file.buffer);
        } catch (modErr) {
            console.warn('Moderation service unavailable, allowing photo:', modErr.message);
        }

        if (!moderationResult.safe) {
            return res.status(422).json({
                message: `Foto rechazada: ${moderationResult.reason}`,
                moderation: moderationResult,
            });
        }

        // Upload to Supabase Storage
        const fileName = `${event.id}/${Date.now()}-${req.file.originalname}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('event-photos')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                cacheControl: '3600',
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('event-photos')
            .getPublicUrl(fileName);

        // Save photo record
        const { data: photo, error: photoError } = await supabase
            .from('photos')
            .insert({
                event_id: event.id,
                event_short_code: event.short_code,
                user_id: req.user?.id || null,
                guest_name: guestName,
                url: publicUrl,
                storage_path: fileName,
                status: 'approved',
                moderation_score: moderationResult.score || 1,
            })
            .select()
            .single();

        if (photoError) throw photoError;

        res.status(201).json({ photo, message: '¡Foto subida exitosamente!' });
    } catch (err) {
        console.error('Photo upload error:', err);
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/events/:eventId/photos - Get event photos
 */
router.get('/:eventId/photos', async (req, res) => {
    try {
        const eventId = req.params.eventId;

        const { data: photos, error } = await supabase
            .from('photos')
            .select('*')
            .or(`event_id.eq.${eventId},event_short_code.eq.${eventId}`)
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ photos: photos || [] });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
