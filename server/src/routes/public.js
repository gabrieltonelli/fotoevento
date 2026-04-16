import { Router } from 'express';
import { supabase } from '../services/supabase.js';

const router = Router();

/**
 * GET /api/public/event/:shortCode - Get public event info
 */
router.get('/event/:shortCode', async (req, res) => {
    try {
        const { data: event, error } = await supabase
            .from('events')
            .select('id, name, type, date, location, skin, require_auth, show_qr_on_screen, dark_mode, short_code, is_active')
            .eq('short_code', req.params.shortCode)
            .single();

        if (error || !event) {
            return res.status(404).json({ message: 'Evento no encontrado' });
        }

        res.json({ event });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
