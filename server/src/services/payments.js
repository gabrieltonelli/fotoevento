/**
 * FotoEvento - Payment Gateway Service
 *
 * Abstrae los procesadores de pago (Stripe y MercadoPago)
 * habilitados por variable de entorno PAYMENT_PROCESSORS.
 *
 * Cada procesador implementa: createCheckout(), handleWebhook()
 * La activación del plan se realiza en activatePlan() tras pago exitoso.
 */

import Stripe from 'stripe';
import { MercadoPagoConfig, Preference, Payment as MPPayment } from 'mercadopago';
import { supabase } from './supabase.js';

// ─── Planes ───
export const PLANS = {
    free: {
        name: 'Gratuito',
        price: 0,
        currency: 'ARS',
        max_photos: 50,
        max_events: 1,
        features: '1 evento, hasta 50 fotos',
        skins: ['classic-dark', 'classic-light'],
        watermark: true,
        download: false,
    },
    pro: {
        name: 'Pro',
        price: 4990,
        currency: 'ARS',
        max_photos: 500,
        max_events: -1, // ilimitados
        features: 'Hasta 500 fotos, skins premium, descarga de fotos',
        skins: ['classic-dark', 'classic-light', 'elegant-gold', 'neon'],
        watermark: false,
        download: true,
    },
    premium: {
        name: 'Premium',
        price: 9990,
        currency: 'ARS',
        max_photos: -1, // ilimitadas
        max_events: -1,
        features: 'Fotos ilimitadas, todos los skins, sin marca de agua',
        skins: ['classic-dark', 'classic-light', 'elegant-gold', 'neon', 'minimal', 'fiesta'],
        watermark: false,
        download: true,
    },
};

// ─── Procesadores habilitados ───
const enabledProcessors = (process.env.PAYMENT_PROCESSORS || 'stripe')
    .split(',')
    .map(p => p.trim().toLowerCase())
    .filter(Boolean);

const defaultProcessor = process.env.PAYMENT_DEFAULT_PROCESSOR || enabledProcessors[0] || 'stripe';

export function getEnabledProcessors() {
    return enabledProcessors;
}

export function getDefaultProcessor() {
    return defaultProcessor;
}

export function isProcessorEnabled(name) {
    return enabledProcessors.includes(name.toLowerCase());
}

// ─── Stripe Client ───
let stripe = null;
if (isProcessorEnabled('stripe') && process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_test_tu')) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe habilitado');
} else if (isProcessorEnabled('stripe')) {
    console.warn('⚠️ Stripe está habilitado pero sin API key válida');
}

// ─── MercadoPago Client ───
let mpClient = null;
let mpPreference = null;
let mpPaymentClient = null;
if (isProcessorEnabled('mercadopago') && process.env.MP_ACCESS_TOKEN && !process.env.MP_ACCESS_TOKEN.startsWith('APP_USR-tu')) {
    mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    mpPreference = new Preference(mpClient);
    mpPaymentClient = new MPPayment(mpClient);
    console.log('✅ MercadoPago habilitado');
} else if (isProcessorEnabled('mercadopago')) {
    console.warn('⚠️ MercadoPago está habilitado pero sin Access Token válido');
}

// ═══════════════════════════════════════
// Activar plan del evento tras pago
// ═══════════════════════════════════════
export async function activatePlan({ plan, userId, eventId, paymentId, processor }) {
    console.log(`💰 Activando plan "${plan}" para usuario ${userId}, evento ${eventId} [${processor}]`);

    const planInfo = PLANS[plan];
    if (!planInfo) {
        console.error(`Plan "${plan}" no encontrado`);
        return false;
    }

    try {
        // Si hay eventId específico, actualizar ese evento
        if (eventId) {
            const { error } = await supabase
                .from('events')
                .update({
                    plan,
                    max_photos: planInfo.max_photos === -1 ? 999999 : planInfo.max_photos,
                    is_active: true,
                })
                .eq('id', eventId)
                .eq('user_id', userId);

            if (error) throw error;
        }

        // Registrar pago en la tabla payments
        await supabase.from('payments').insert({
            user_id: userId,
            event_id: eventId || null,
            plan,
            amount: planInfo.price,
            currency: planInfo.currency,
            processor,
            payment_external_id: paymentId,
            status: 'completed',
        });

        console.log(`✅ Plan "${plan}" activado exitosamente`);
        return true;
    } catch (err) {
        console.error('Error al activar plan:', err);
        return false;
    }
}

// ═══════════════════════════════════════
// STRIPE
// ═══════════════════════════════════════
export async function createStripeCheckout({ plan, eventId, userId }) {
    if (!stripe) throw new Error('Stripe no está configurado');

    const selectedPlan = PLANS[plan];
    if (!selectedPlan || selectedPlan.price === 0) {
        throw new Error('Plan no válido para pago');
    }

    const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: selectedPlan.currency.toLowerCase(),
                    product_data: {
                        name: `FotoEvento ${selectedPlan.name}`,
                        description: selectedPlan.features,
                        images: [`${appUrl}/favicon.svg`],
                    },
                    unit_amount: selectedPlan.price * 100, // Stripe usa centavos
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `${appUrl}/dashboard?payment=success&plan=${plan}&event=${eventId || ''}`,
        cancel_url: `${appUrl}/pricing?payment=cancelled`,
        client_reference_id: userId,
        metadata: {
            plan,
            event_id: eventId || '',
            user_id: userId,
            processor: 'stripe',
        },
    });

    return { url: session.url, sessionId: session.id, processor: 'stripe' };
}

export async function handleStripeWebhook(rawBody, signature) {
    if (!stripe) throw new Error('Stripe no está configurado');

    const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { plan, event_id, user_id } = session.metadata;

        await activatePlan({
            plan,
            userId: user_id,
            eventId: event_id,
            paymentId: session.payment_intent,
            processor: 'stripe',
        });
    }

    return { received: true };
}

// ═══════════════════════════════════════
// MERCADO PAGO
// ═══════════════════════════════════════
export async function createMPCheckout({ plan, eventId, userId }) {
    if (!mpPreference) throw new Error('MercadoPago no está configurado');

    const selectedPlan = PLANS[plan];
    if (!selectedPlan || selectedPlan.price === 0) {
        throw new Error('Plan no válido para pago');
    }

    const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001';

    const preference = await mpPreference.create({
        body: {
            items: [
                {
                    id: `fotoevento-${plan}`,
                    title: `FotoEvento ${selectedPlan.name}`,
                    description: selectedPlan.features,
                    quantity: 1,
                    unit_price: selectedPlan.price,
                    currency_id: 'ARS',
                },
            ],
            payer: {
                // Se puede completar con datos del usuario si los tenemos
            },
            back_urls: {
                success: `${appUrl}/dashboard?payment=success&plan=${plan}&event=${eventId || ''}&processor=mercadopago`,
                failure: `${appUrl}/pricing?payment=failed`,
                pending: `${appUrl}/dashboard?payment=pending&plan=${plan}`,
            },
            auto_return: 'approved',
            notification_url: `${apiUrl}/api/payments/webhook/mercadopago`,
            external_reference: JSON.stringify({
                plan,
                event_id: eventId || '',
                user_id: userId,
            }),
            statement_descriptor: 'FOTOEVENTO',
        },
    });

    return {
        url: preference.init_point,
        sandboxUrl: preference.sandbox_init_point,
        preferenceId: preference.id,
        processor: 'mercadopago',
    };
}

export async function handleMPWebhook(query, body) {
    if (!mpPaymentClient) {
        console.warn('MercadoPago webhook recibido pero no configurado');
        return { received: true };
    }

    // MercadoPago envía notificaciones de tipo "payment"
    const topic = query.topic || query.type || body?.type;
    const resourceId = query.id || body?.data?.id;

    if (topic === 'payment' && resourceId) {
        try {
            const payment = await mpPaymentClient.get({ id: resourceId });

            if (payment.status === 'approved') {
                let externalRef = {};
                try {
                    externalRef = JSON.parse(payment.external_reference || '{}');
                } catch {
                    console.warn('No se pudo parsear external_reference:', payment.external_reference);
                }

                const { plan, event_id, user_id } = externalRef;

                if (plan && user_id) {
                    await activatePlan({
                        plan,
                        userId: user_id,
                        eventId: event_id,
                        paymentId: String(payment.id),
                        processor: 'mercadopago',
                    });
                }
            }
        } catch (err) {
            console.error('Error procesando webhook de MercadoPago:', err);
        }
    }

    return { received: true };
}

// ═══════════════════════════════════════
// Unified checkout (elige procesador)
// ═══════════════════════════════════════
export async function createCheckout({ plan, eventId, userId, processor }) {
    const chosenProcessor = processor || defaultProcessor;

    if (!isProcessorEnabled(chosenProcessor)) {
        throw new Error(`Procesador "${chosenProcessor}" no está habilitado. Habilitados: ${enabledProcessors.join(', ')}`);
    }

    switch (chosenProcessor) {
        case 'stripe':
            return createStripeCheckout({ plan, eventId, userId });
        case 'mercadopago':
            return createMPCheckout({ plan, eventId, userId });
        default:
            throw new Error(`Procesador "${chosenProcessor}" no soportado`);
    }
}
