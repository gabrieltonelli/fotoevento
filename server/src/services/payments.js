/**
 * Foto Eventos - Payment Gateway Service
 *
 * Abstrae los procesadores de pago (Stripe y MercadoPago)
 * habilitados por variable de entorno PAYMENT_PROCESSORS.
 *
 * Cada procesador implementa: createCheckout(), handleWebhook()
 * La activación del plan se realiza en activatePlan() tras pago exitoso.
 */

import Stripe from 'stripe';
import { MercadoPagoConfig, Preference, Payment as MPPayment, PreApproval } from 'mercadopago';
import { supabase } from './supabase.js';

// ─── Planes ───
export const PLANS = {
    free: {
        name: 'Gratuito',
        price: 0,
        currency: 'ARS',
        max_photos: parseInt(process.env.VITE_PLAN_FREE_MAX_PHOTOS || '50'),
        max_events: 1,
        features: `1 evento, hasta ${process.env.VITE_PLAN_FREE_MAX_PHOTOS || '50'} fotos, duración ${process.env.FREE_TRIAL_MINUTES || '30'} mins`,
        skins: ['classic-dark', 'classic-light'],
        watermark: true,
        download: false,
    },
    pro: {
        name: 'Pro',
        price: parseInt(process.env.VITE_PLAN_PRO_PRICE || '4990'),
        currency: 'ARS',
        max_photos: parseInt(process.env.VITE_PLAN_PRO_MAX_PHOTOS || '500'),
        max_events: -1, // ilimitados
        features: `Hasta ${process.env.VITE_PLAN_PRO_MAX_PHOTOS || '500'} fotos, skins premium, descarga de fotos`,
        skins: ['classic-dark', 'classic-light', 'elegant-gold', 'neon'],
        watermark: false,
        download: true,
    },
    premium: {
        name: 'Premium',
        price: parseInt(process.env.VITE_PLAN_PREMIUM_PRICE || '9990'),
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
        const expiryDate = new Date();
        const trialMinutes = parseInt(process.env.FREE_TRIAL_MINUTES || '30');

        if (plan === 'free') {
            expiryDate.setMinutes(expiryDate.getMinutes() + trialMinutes);
        } else {
            expiryDate.setDate(expiryDate.getDate() + 30); // Paid plans default to 30 days
        }

        // 1. Obtener perfil actual para verificar trial (si es plan free)
        if (plan === 'free') {
            const { data: profile } = await supabase
                .from('profiles')
                .select('trial_used')
                .eq('id', userId)
                .single();
            
            if (profile?.trial_used) {
                console.warn(`Usuario ${userId} ya utilizó su plan gratuito.`);
                return false;
            }
        }

        // 2. Actualizar el perfil del usuario
        const profileUpdates = {
            subscription_plan: plan,
            subscription_status: 'active',
            subscription_expiry: expiryDate.toISOString(),
        };

        if (plan === 'free') {
            profileUpdates.trial_used = true;
            profileUpdates.trial_expires_at = expiryDate.toISOString();
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .update(profileUpdates)
            .eq('id', userId);

        if (profileError) {
            console.error('Error al actualizar perfil:', profileError);
            // Fallback upsert
            await supabase.from('profiles').upsert({
                id: userId,
                ...profileUpdates,
            });
        }

        // 3. Si hay eventId específico, actualizar ese evento
        if (eventId) {
            const { error: eventError } = await supabase
                .from('events')
                .update({
                    plan,
                    max_photos: planInfo.max_photos === -1 ? 999999 : planInfo.max_photos,
                    is_active: true,
                    // Si es free, el evento también hereda la expiración para el bloqueo de fotos
                    updated_at: new Date().toISOString() 
                })
                .eq('id', eventId)
                .eq('user_id', userId);

            if (eventError) throw eventError;
        }

        // 4. Registrar pago en la tabla payments
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

        console.log(`✅ Plan "${plan}" activado exitosamente (Vence: ${expiryDate.toLocaleString()})`);
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
                        name: `Foto Eventos ${selectedPlan.name}`,
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
// MERCADO PAGO (Subscriptions / PreApproval)
// ═══════════════════════════════════════
export async function createMPSubscription({ plan, eventId, userId, userEmail }) {
    if (!mpClient) throw new Error('MercadoPago no está configurado');
    
    const preApproval = new PreApproval(mpClient);
    const selectedPlan = PLANS[plan];
    
    // Obtener el ID del plan de MP desde las variables de entorno
    const mpPlanId = plan === 'pro' 
        ? process.env.VITE_MP_PLAN_PRO_ID 
        : process.env.VITE_MP_PLAN_PREMIUM_ID;

    if (!mpPlanId) {
        throw new Error(`ID de plan de Mercado Pago no configurado para el plan "${plan}"`);
    }

    const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';

    try {
        const result = await preApproval.create({
            body: {
                preapproval_plan_id: mpPlanId,
                reason: `Foto Eventos - Plan ${selectedPlan.name}`,
                external_reference: JSON.stringify({
                    plan,
                    event_id: eventId || '',
                    user_id: userId,
                }),
                payer_email: userEmail,
                back_url: `${appUrl}/dashboard?payment=success&plan=${plan}&event=${eventId || ''}&processor=mercadopago`,
                status: "pending"
            }
        });

        return {
            url: result.init_point,
            sandboxUrl: result.sandbox_init_point || result.init_point,
            preapprovalId: result.id,
            processor: 'mercadopago',
        };
    } catch (error) {
        console.error("Error creando suscripción en MP:", error);
        throw new Error("No se pudo iniciar el proceso de suscripción");
    }
}

export async function createMPCheckout({ plan, eventId, userId, userEmail }) {
    // Si queremos que TODO en MP sea suscripción, redirigimos a createMPSubscription
    return createMPSubscription({ plan, eventId, userId, userEmail });
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
export async function createCheckout({ plan, eventId, userId, userEmail, processor }) {
    const chosenProcessor = processor || defaultProcessor;

    if (!isProcessorEnabled(chosenProcessor)) {
        throw new Error(`Procesador "${chosenProcessor}" no está habilitado. Habilitados: ${enabledProcessors.join(', ')}`);
    }

    switch (chosenProcessor) {
        case 'stripe':
            return createStripeCheckout({ plan, eventId, userId });
        case 'mercadopago':
            return createMPCheckout({ plan, eventId, userId, userEmail });
        default:
            throw new Error(`Procesador "${chosenProcessor}" no soportado`);
    }
}
