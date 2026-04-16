import { Router } from 'express';
import Stripe from 'stripe';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const PLANS = {
    pro: {
        name: 'Pro',
        price: 4990, // ARS centavos
        currency: 'ars',
        features: 'Hasta 500 fotos, skins premium, descarga de fotos',
    },
    premium: {
        name: 'Premium',
        price: 9990,
        currency: 'ars',
        features: 'Fotos ilimitadas, todos los skins, sin marca de agua',
    },
};

/**
 * POST /api/payments/checkout - Create Stripe checkout session
 */
router.post('/checkout', authMiddleware, async (req, res) => {
    try {
        const { plan, eventId } = req.body;

        if (!plan || !PLANS[plan]) {
            return res.status(400).json({ message: 'Plan no válido' });
        }

        const selectedPlan = PLANS[plan];
        const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: selectedPlan.currency,
                        product_data: {
                            name: `FotoEvento ${selectedPlan.name}`,
                            description: selectedPlan.features,
                        },
                        unit_amount: selectedPlan.price,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${appUrl}/dashboard?payment=success&event=${eventId || ''}`,
            cancel_url: `${appUrl}/pricing?payment=cancelled`,
            client_reference_id: req.user.id,
            metadata: {
                plan,
                event_id: eventId || '',
                user_id: req.user.id,
            },
        });

        res.json({ url: session.url, sessionId: session.id });
    } catch (err) {
        console.error('Stripe error:', err);
        res.status(500).json({ message: 'Error al crear sesión de pago' });
    }
});

/**
 * POST /api/payments/webhook - Stripe webhook handler
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            console.log('💰 Payment completed:', {
                plan: session.metadata.plan,
                userId: session.metadata.user_id,
                eventId: session.metadata.event_id,
            });

            // TODO: Update event plan in database
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Webhook error:', err.message);
        res.status(400).json({ message: 'Webhook error' });
    }
});

// Need to import express for raw body parser in webhook
import express from 'express';

export default router;
