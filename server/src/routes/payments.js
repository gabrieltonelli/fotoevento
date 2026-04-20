import { Router } from 'express';
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
    createCheckout,
    handleStripeWebhook,
    handleMPWebhook,
    getEnabledProcessors,
    getDefaultProcessor,
    isProcessorEnabled,
    PLANS,
    activatePlan,
} from '../services/payments.js';

const router = Router();

/**
 * GET /api/payments/processors - Devuelve los procesadores habilitados
 * El frontend usa esto para mostrar las opciones de pago correctas
 */
router.get('/processors', (req, res) => {
    res.json({
        processors: getEnabledProcessors(),
        default: getDefaultProcessor(),
        free_trial_limit: parseInt(process.env.FREE_TRIAL_LIMIT || '1'),
        plans: Object.entries(PLANS)
            .filter(([key]) => key !== 'free')
            .map(([key, plan]) => ({
                id: key,
                name: plan.name,
                price: plan.price,
                currency: plan.currency,
                features: plan.features,
                max_photos: plan.max_photos,
            })),
    });
});

/**
 * POST /api/payments/checkout - Crear sesión de checkout
 * Body: { plan: "pro"|"premium", eventId?: string, processor?: "stripe"|"mercadopago" }
 */
router.post('/checkout', authMiddleware, async (req, res) => {
    try {
        const { plan, eventId, processor, cycle } = req.body;

        if (!plan || !PLANS[plan] || plan === 'free') {
            return res.status(400).json({ message: 'Seleccioná un plan de pago válido (pro o premium)' });
        }

        const result = await createCheckout({
            plan,
            eventId: eventId || '',
            userId: req.user.id,
            userEmail: req.user.email,
            processor,
            cycle: cycle || 'monthly'
        });

        res.json(result);
    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).json({ message: err.message || 'Error al crear sesión de pago' });
    }
});

/**
 * POST /api/payments/webhook/stripe - Stripe webhook
 * Nota: necesita raw body para verificar firmas
 */
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!isProcessorEnabled('stripe')) {
        return res.status(404).json({ message: 'Stripe no está habilitado' });
    }

    try {
        const sig = req.headers['stripe-signature'];
        const result = await handleStripeWebhook(req.body, sig);
        res.json(result);
    } catch (err) {
        console.error('Stripe webhook error:', err.message);
        res.status(400).json({ message: 'Webhook error: ' + err.message });
    }
});

/**
 * POST /api/payments/webhook/mercadopago - MercadoPago webhook (IPN)
 * MercadoPago envía notificaciones cuando cambia el estado de un pago
 */
router.post('/webhook/mercadopago', async (req, res) => {
    if (!isProcessorEnabled('mercadopago')) {
        return res.status(404).json({ message: 'MercadoPago no está habilitado' });
    }

    try {
        const result = await handleMPWebhook(req.query, req.body);
        res.json(result);
    } catch (err) {
        console.error('MercadoPago webhook error:', err.message);
        res.status(400).json({ message: 'Webhook error: ' + err.message });
    }
});

/**
 * POST /api/payments/activate-from-redirect - Activación por redirect (fallback)
 * Cuando MercadoPago redirige al usuario con payment=success,
 * el frontend puede llamar aquí para asegurar la activación del plan
 * (en caso de que el webhook no haya llegado aún)
 */
/**
 * POST /api/payments/activate-free - Activar plan gratuito
 */
router.post('/activate-free', authMiddleware, async (req, res) => {
    try {
        await activatePlan({
            plan: 'free',
            userId: req.user.id,
            eventId: '',
            paymentId: 'free-activation',
            processor: 'none',
        });

        res.json({ message: 'Plan gratuito activado', activated: true });
    } catch (err) {
        console.error('Error in activate-free route:', err.message);
        res.status(500).json({ message: err.message || 'Error al activar plan gratuito' });
    }
});

router.post('/activate-from-redirect', authMiddleware, async (req, res) => {
    try {
        const { plan, eventId, paymentId, processor } = req.body;

        if (!plan || !PLANS[plan] || plan === 'free') {
            return res.status(400).json({ message: 'Plan no válido' });
        }

        // Verificar que no se activó ya
        if (eventId) {
            const { data: event } = await import('../services/supabase.js')
                .then(mod => mod.supabase.from('events')
                    .select('plan')
                    .eq('id', eventId)
                    .eq('user_id', req.user.id)
                    .single()
                );

            if (event && event.plan === plan) {
                return res.json({ message: 'Plan ya activado', alreadyActive: true });
            }
        }

        const success = await activatePlan({
            plan,
            userId: req.user.id,
            eventId: eventId || '',
            paymentId: paymentId || 'redirect-activation',
            processor: processor || 'unknown',
        });

        if (success) {
            res.json({ message: 'Plan activado exitosamente', activated: true });
        } else {
            res.status(500).json({ message: 'Error al activar el plan' });
        }
    } catch (err) {
        console.error('Activate from redirect error:', err);
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/payments/status/:eventId - Verificar estado del plan de un evento
 */
router.get('/status/:eventId', authMiddleware, async (req, res) => {
    try {
        const { supabase } = await import('../services/supabase.js');
        const { data: event, error } = await supabase
            .from('events')
            .select('plan, max_photos, is_active')
            .eq('id', req.params.eventId)
            .eq('user_id', req.user.id)
            .single();

        if (error || !event) {
            return res.status(404).json({ message: 'Evento no encontrado' });
        }

        const planInfo = PLANS[event.plan] || PLANS.free;

        res.json({
            plan: event.plan,
            planName: planInfo.name,
            maxPhotos: event.max_photos,
            isActive: event.is_active,
            features: planInfo,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/payments - Obtener historial de pagos del usuario
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { supabase } = await import('../services/supabase.js');
        const { data: payments, error } = await supabase
            .from('payments')
            .select('*, events(name)')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ payments: payments || [] });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
