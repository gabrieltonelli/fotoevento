import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { supabase } from '../services/supabase.js';

const router = Router();

/**
 * GET /api/profile - Obtener perfil del usuario y estado de suscripción
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error) {
            // Si no existe perfil, lo creamos dinámicamente (fallback)
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                    id: req.user.id,
                    full_name: req.user.user_metadata?.full_name || 'Usuario',
                    subscription_plan: 'none',
                    subscription_status: 'inactive'
                })
                .select()
                .single();
            
            if (createError) throw createError;
            return res.json(newProfile);
        }

        // --- LÓGICA DE EXPIRACIÓN ---
        if (profile && profile.subscription_plan !== 'free' && profile.subscription_plan !== 'none') {
            const expiry = new Date(profile.subscription_expiry);
            if (expiry < new Date()) {
                console.log(`🕒 Suscripción expirada para ${req.user.id}. Aplicando downgrade...`);
                const { data: updatedProfile } = await supabase
                    .from('profiles')
                    .update({
                        subscription_plan: 'free',
                        subscription_status: 'inactive',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', req.user.id)
                    .select()
                    .single();
                
                return res.json(updatedProfile || profile);
            }
        }
        // -----------------------------

        res.json(profile);
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ message: err.message });
    }
});

export default router;
