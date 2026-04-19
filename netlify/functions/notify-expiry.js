import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const handler = async (event, context) => {
  console.log('⏰ Ejecutando cron de notificaciones de vencimiento...');
  
  try {
    const daysBefore = parseInt(process.env.NOTIFY_DAYS_BEFORE || '3');
    const now = new Date();
    
    // 1. Buscar usuarios que vencen en exactamente N días
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + daysBefore);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    const { data: upcoming, error: upcomingError } = await supabase
      .from('profiles')
      .select('*, id')
      .filter('subscription_expiry', 'gte', `${targetDateStr}T00:00:00Z`)
      .filter('subscription_expiry', 'lte', `${targetDateStr}T23:59:59Z`)
      .eq('subscription_status', 'active');

    if (upcomingError) throw upcomingError;

    // 2. Buscar usuarios que ya vencieron hoy y no han sido notificados o desactivados
    const { data: expired, error: expiredError } = await supabase
      .from('profiles')
      .select('*, id')
      .lt('subscription_expiry', now.toISOString())
      .eq('subscription_status', 'active');

    if (expiredError) throw expiredError;

    // Enviar correos para avisos próximos
    for (const profile of (upcoming || [])) {
        await sendEmail(profile, `Tu plan ${profile.subscription_plan.toUpperCase()} vence pronto`, 
            `Hola ${profile.full_name || 'usuario'}, te recordamos que tu suscripción vence en ${daysBefore} días. Renovala para no perder tus beneficios.`);
    }

    // Enviar correos para vencidos y actualizar estado
    for (const profile of (expired || [])) {
        await sendEmail(profile, `Tu suscripción de Foto Eventos ha vencido`, 
            `Hola ${profile.full_name || 'usuario'}, tu plan ha vencido. Tus eventos han sido desactivados pero podés seguir viendo tus fotos en el dashboard.`);
        
        // Desactivar plan y eventos
        await supabase.from('profiles').update({ subscription_status: 'inactive' }).eq('id', profile.id);
        await supabase.from('events').update({ is_active: false }).eq('user_id', profile.id);
    }

    return { statusCode: 200, body: JSON.stringify({ processed: (upcoming?.length || 0) + (expired?.length || 0) }) };
  } catch (err) {
    console.error('Error en cron:', err);
    return { statusCode: 500, body: err.message };
  }
};

async function sendEmail(profile, subject, text) {
    try {
        // Obtenemos el email del usuario desde auth.users (vía rpc o tabla si la tuviéramos replicada)
        // Por simplicidad, asumimos que el perfil tiene un campo email o lo buscamos
        const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
        const email = userData?.user?.email;

        if (!email) return;

        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject,
            text,
            html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
                    <h2>Foto Eventos</h2>
                    <p>${text}</p>
                    <a href="${process.env.VITE_APP_URL}/pricing" style="background: #fbbf24; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Planes</a>
                   </div>`
        });
        console.log(`✉️ Email enviado a ${email}`);
    } catch (err) {
        console.error(`Error enviando email a ${profile.id}:`, err);
    }
}
