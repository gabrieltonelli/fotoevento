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
        throw new Error(`Plan "${plan}" no encontrado`);
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
            const { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('trial_used, trials_used_count')
                .eq('id', userId)
                .single();
            
            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error fetching profile:', fetchError);
                throw new Error('Error al verificar elegibilidad del plan gratuito');
            }

            const limit = parseInt(process.env.FREE_TRIAL_LIMIT || '1');
            const used = profile?.trials_used_count || (profile?.trial_used ? 1 : 0);

            if (used >= limit) {
                console.warn(`Usuario ${userId} ya utilizó sus ${limit} pruebas gratuitas.`);
                throw new Error(`Has alcanzado el límite de ${limit} pruebas gratuitas permitidas para tu cuenta.`);
            }

            // Guardar el conteo actual para el incremento
            profile.current_used_count = used;
        }

        // 2. Actualizar el perfil del usuario
        const trialLimit = parseInt(process.env.FREE_TRIAL_LIMIT || '1');
        const profileUpdates = {
            subscription_plan: plan,
            subscription_status: 'active',
            subscription_expiry: expiryDate.toISOString(),
            updated_at: new Date().toISOString()
        };

        if (plan === 'free') {
            profileUpdates.trial_used = true;
            profileUpdates.trials_used_count = (profile?.current_used_count || 0) + 1;
            profileUpdates.trial_expires_at = expiryDate.toISOString();
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .update(profileUpdates)
            .eq('id', userId);

        if (profileError) {
            console.error('Error al actualizar perfil:', profileError);
            // Fallback upsert
            const { error: upsertError } = await supabase.from('profiles').upsert({
                id: userId,
                ...profileUpdates,
                trials_used_count: profileUpdates.trials_used_count || 0
            });
            if (upsertError) {
                console.error('Error in upsert fallback:', upsertError);
                throw new Error('No se pudo actualizar el perfil de suscripción');
            }
        }

        // 3. Si hay eventId específico, actualizar ese evento
        if (eventId) {
            const { error: eventError } = await supabase
                .from('events')
                .update({
                    plan,
                    max_photos: planInfo.max_photos === -1 ? 999999 : planInfo.max_photos,
                    is_active: true,
                    updated_at: new Date().toISOString() 
                })
                .eq('id', eventId)
                .eq('user_id', userId);

            if (eventError) {
                console.error('Error al actualizar evento:', eventError);
                throw new Error('No se pudo vincular el plan al evento');
            }
        }

        // 4. Registrar pago en la tabla payments
        const { error: paymentError } = await supabase.from('payments').insert({
            user_id: userId,
            event_id: eventId || null,
            plan,
            amount: planInfo.price,
            currency: planInfo.currency,
            processor,
            payment_external_id: paymentId,
            status: 'completed',
        });

        if (paymentError) {
            console.error('Error al registrar pago:', paymentError);
            // Non-critical error, we don't throw here as the plan IS activated in profile
        }

        console.log(`✅ Plan "${plan}" activado exitosamente (ID: ${userId})`);
        return true;
    } catch (err) {
        console.error('Error en activatePlan:', err.message);
        throw err; // Re-throw to be caught by route handler
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
export async function createMPSubscription({ plan, eventId, userId, userEmail, cycle }) {
    if (!mpClient) throw new Error('MercadoPago no está configurado');
    
    const preApproval = new PreApproval(mpClient);
    const selectedPlan = PLANS[plan];
    
    const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
    
    // Obtener el ciclo y el ID correspondiente
    const currentCycle = cycle || 'monthly';
    let mpPlanId = null;

    if (plan === 'pro') {
        mpPlanId = currentCycle === 'annual' 
            ? process.env.VITE_MP_PLAN_PRO_ANNUAL_ID 
            : process.env.VITE_MP_PLAN_PRO_ID;
    } else if (plan === 'premium') {
        mpPlanId = currentCycle === 'annual' 
            ? process.env.VITE_MP_PLAN_PREMIUM_ANNUAL_ID 
            : process.env.VITE_MP_PLAN_PREMIUM_ID;
    }

    if (!mpPlanId) {
        throw new Error(`ID de plan de Mercado Pago no configurado para el plan "${plan}" (${currentCycle})`);
    }

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
        // Bubble up the specific MP error message if available
        const mpErrorMsg = error.message || (error.response?.data?.message) || "No se pudo iniciar el proceso de suscripción";
        throw new Error(mpErrorMsg);
    }
}

export async function createMPCheckout({ plan, eventId, userId, userEmail, cycle }) {
    // Si queremos que TODO en MP sea suscripción, redirigimos a createMPSubscription
    return createMPSubscription({ plan, eventId, userId, userEmail, cycle });
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
            return createMPCheckout({ plan, eventId, userId, userEmail, cycle });
        default:
            throw new Error(`Procesador "${chosenProcessor}" no soportado`);
    }
}
