import cron from 'node-cron';
import { supabase } from './supabase.js';
import { sendSubscriptionWarningEmail, sendSubscriptionExpiredEmail } from './email.js';

const NOTIFY_DAYS_BEFORE = parseInt(process.env.NOTIFY_DAYS_BEFORE || '3');

/**
 * Procesa las suscripciones próximas a vencer y las ya vencidas
 */
export const checkSubscriptions = async () => {
    console.log('🕒 Running subscription check job...');
    const now = new Date();

    try {
        // 1. Obtener usuarios cuya suscripción vence en N días
        const warningDate = new Date();
        warningDate.setDate(now.getDate() + NOTIFY_DAYS_BEFORE);
        
        // Buscamos perfiles que:
        // - Tienen una fecha de expiración próxima
        // - El estado es 'active'
        // - No hemos enviado aviso para esta fecha de expiración (usamos last_expiry_warning_sent_at)
        const { data: upcomingExpiring, error: warningError } = await supabase
            .from('profiles')
            .select('id, full_name, subscription_expiry, last_expiry_warning_sent_at')
            .eq('subscription_status', 'active')
            .lte('subscription_expiry', warningDate.toISOString())
            .gt('subscription_expiry', now.toISOString());

        if (warningError) throw warningError;

        for (const profile of upcomingExpiring) {
            // Si ya enviamos el aviso para esta misma fecha de expiración, saltamos
            if (profile.last_expiry_warning_sent_at) {
                const lastSent = new Date(profile.last_expiry_warning_sent_at);
                const expiry = new Date(profile.subscription_expiry);
                // Si el aviso se envió después de que se estableciera esta expiración, no reenviar
                // (O simplemente comparar si son del mismo periodo, pero comparar fechas es más seguro si se renueva)
                // Usamos una lógica simple: si se envió en los últimos 30 días y la fecha de expiración no cambió, no reenviar.
                // Mejor: Si last_expiry_warning_sent_at > (subscription_expiry - 1 mes), asumimos que ya se notificó esta suscripción.
                if (lastSent > new Date(expiry.getTime() - 30 * 24 * 60 * 60 * 1000)) {
                    continue;
                }
            }

            // Obtener email del usuario desde auth (requiere service_role)
            const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(profile.id);
            if (userError || !user) {
                console.error(`Could not get user ${profile.id}:`, userError);
                continue;
            }

            const diffTime = Math.abs(new Date(profile.subscription_expiry) - now);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            console.log(`✉️ Sending warning to ${user.email} (${diffDays} days left)`);
            await sendSubscriptionWarningEmail(user.email, profile.full_name || 'Usuario', profile.subscription_expiry, diffDays);

            // Marcar como enviado
            await supabase
                .from('profiles')
                .update({ last_expiry_warning_sent_at: now.toISOString() })
                .eq('id', profile.id);
        }

        // 2. Obtener usuarios cuya suscripción YA venció
        // Buscamos perfiles que:
        // - Tienen fecha de expiración pasada
        // - El estado sigue siendo 'active' (aquí también aprovechamos para pasarlos a 'inactive')
        const { data: expired, error: expiredError } = await supabase
            .from('profiles')
            .select('id, full_name, subscription_expiry, last_expiry_notified_at')
            .eq('subscription_status', 'active')
            .lt('subscription_expiry', now.toISOString());

        if (expiredError) throw expiredError;

        for (const profile of expired) {
            // Actualizar estado a inactive
            await supabase
                .from('profiles')
                .update({ 
                    subscription_status: 'inactive',
                    subscription_plan: 'free', // O 'none' según lógica de negocio
                    last_expiry_notified_at: now.toISOString()
                })
                .eq('id', profile.id);

            // Obtener email
            const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(profile.id);
            if (userError || !user) continue;

            console.log(`✉️ Sending expiration notice to ${user.email}`);
            await sendSubscriptionExpiredEmail(user.email, profile.full_name || 'Usuario');
        }

    } catch (error) {
        console.error('❌ Error in subscription check job:', error);
    }
};

/**
 * Inicia el job de cron (corre todos los días a las 09:00 AM)
 */
export const initSubscriptionCron = () => {
    // '0 9 * * *' -> Everyday at 9:00 AM
    // Para pruebas inmediatas: '*/5 * * * *' (cada 5 min)
    cron.schedule('0 9 * * *', () => {
        checkSubscriptions();
    });
    
    console.log('⏰ Subscription cron job scheduled (daily at 09:00 AM)');
};
