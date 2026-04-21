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

/**
 * GET /api/public/check-verification?email=xxx
 * Checks if a user is confirmed in Supabase.
 */
router.get('/check-verification', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ message: 'Email es requerido' });
    }

    try {
        // Obtenemos el usuario usando la API de admin (necesita service_role key)
        const { data, error } = await supabase.auth.admin.listUsers();
        
        if (error) throw error;

        const user = data.users.find(u => u.email === email);

        if (!user) {
            return res.json({ confirmed: false, exists: false });
        }

        // email_confirmed_at existe si el usuario ya validó su cuenta
        res.json({ 
            confirmed: !!user.email_confirmed_at, 
            exists: true 
        });
    } catch (err) {
        console.error('Error checking verification:', err);
        res.status(500).json({ message: 'Error checking verification' });
    }
});

export default router;
