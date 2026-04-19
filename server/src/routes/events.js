import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { nanoid } from 'nanoid';

const router = Router();

/**
 * GET /api/events - List user's events
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data: events, error } = await supabase
            .from('events')
            .select('*, photos(count)')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formatted = (events || []).map(e => ({
            ...e,
            photo_count: e.photos?.[0]?.count || 0,
        }));

        res.json({ events: formatted });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * POST /api/events - Create a new event
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, type, date, location, skin, require_auth, show_qr_on_screen, dark_mode, max_photos } = req.body;

        if (!name || !date) {
            return res.status(400).json({ message: 'Nombre y fecha son requeridos' });
        }

        // --- FREE PLAN LIMITS ---
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_plan')
            .eq('id', req.user.id)
            .single();
        
        if (profile?.subscription_plan === 'free' || !profile) {
            const { count: eventCount } = await supabase
                .from('events')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', req.user.id);
            
            if (eventCount >= 1) {
                return res.status(403).json({
                    message: 'El plan gratuito está limitado a 1 evento. Mejorá tu plan para crear eventos ilimitados.',
                    limit_reached: true
                });
            }
        }
        // -------------------------

        const shortCode = nanoid(8).toUpperCase();

        const { data: event, error } = await supabase
            .from('events')
            .insert({
                user_id: req.user.id,
                name,
                type: type || 'party',
                date,
                location: location || '',
                skin: skin || 'classic-dark',
                short_code: shortCode,
                require_auth: require_auth || false,
                show_qr_on_screen: show_qr_on_screen !== false,
                dark_mode: dark_mode !== false,
                max_photos: max_photos || 500,
                is_active: true,
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ event });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/events/:id - Get event by ID
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { data: event, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (error || !event) {
            return res.status(404).json({ message: 'Evento no encontrado' });
        }

        res.json({ event });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * PUT /api/events/:id - Update event
 */
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const updates = req.body;
        delete updates.id;
        delete updates.user_id;
        delete updates.short_code;

        const { data: event, error } = await supabase
            .from('events')
            .update(updates)
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ event });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * DELETE /api/events/:id - Delete event
 */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;

        res.json({ message: 'Evento eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
