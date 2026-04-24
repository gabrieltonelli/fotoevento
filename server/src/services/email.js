import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const LOGO_URL = process.env.VITE_LOGO_URL || 'https://raw.githubusercontent.com/gabrieltonelli/fotoevento/main/client/public/logo.png'; // Fallback to repo logo if exists or generic

/**
 * Envuelve el contenido en una plantilla con logo y estilo consistente
 */
const emailWrapper = (content) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
            <img src="${LOGO_URL}" alt="Foto Evento" style="max-height: 50px; margin-bottom: 10px;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Foto Evento</h1>
        </div>
        <div style="padding: 30px;">
            ${content}
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">© ${new Date().getFullYear()} Foto Evento - Todos los derechos reservados</p>
            <div style="margin-top: 10px;">
                <a href="${process.env.VITE_APP_URL}/terms" style="font-size: 11px; color: #3b82f6; text-decoration: none; margin: 0 5px;">Términos</a>
                <a href="${process.env.VITE_APP_URL}/privacy" style="font-size: 11px; color: #3b82f6; text-decoration: none; margin: 0 5px;">Privacidad</a>
                <a href="${process.env.VITE_APP_URL}/support" style="font-size: 11px; color: #3b82f6; text-decoration: none; margin: 0 5px;">Soporte</a>
            </div>
        </div>
    </div>
`;

/**
 * Envia un email utilizando el transporte configurado
 */
export const sendEmail = async ({ to, subject, text, html, wrap = true }) => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.warn('⚠️ SMTP not configured. Email not sent:', { to, subject });
        return null;
    }

    try {
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'Foto Evento'}" <${process.env.SMTP_FROM || 'noreply@fotoevento.app'}>`,
            to,
            subject,
            text,
            html: wrap ? emailWrapper(html) : html,
        });

        console.log('📧 Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw error;
    }
};

export const sendSubscriptionWarningEmail = async (userEmail, userName, expiryDate, daysRemaining) => {
    const formattedDate = new Date(expiryDate).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    const subject = `Tu suscripción de Foto Evento vence pronto`;
    const text = `Hola ${userName}, tu suscripción de Foto Evento vencerá el ${formattedDate} (en ${daysRemaining} días). ¡Renuévala para no perder tus beneficios!`;
    const html = `
        <h2 style="color: #3b82f6; margin-top: 0;">¡Hola ${userName}!</h2>
        <p>Te escribimos para avisarte que tu suscripción de <strong>Foto Evento</strong> vencerá pronto.</p>
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;">Fecha de vencimiento: <strong>${formattedDate}</strong></p>
            <p style="margin: 5px 0 0 0;">Días restantes: <strong>${daysRemaining}</strong></p>
        </div>
        <p>No te preocupes, puedes renovarla fácilmente desde tu panel de control para seguir disfrutando de todas las funcionalidades premium.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.VITE_APP_URL}/billing" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Renovar Suscripción</a>
        </div>
        <p style="font-size: 0.9em; color: #666;">Si ya realizaste la renovación, por favor ignora este mensaje.</p>
    `;

    return sendEmail({ to: userEmail, subject, text, html });
};

export const sendSubscriptionExpiredEmail = async (userEmail, userName) => {
    const subject = `Tu suscripción de Foto Evento ha vencido`;
    const text = `Hola ${userName}, tu suscripción de Foto Evento ha vencido. Tus eventos ahora tendrán las limitaciones del plan gratuito.`;
    const html = `
        <h2 style="color: #ef4444; margin-top: 0;">¡Hola ${userName}!</h2>
        <p>Te informamos que tu suscripción de <strong>Foto Evento</strong> ha vencido.</p>
        <p>Debido a esto, tu cuenta ha pasado al <strong>Plan Gratuito</strong>. Algunas funcionalidades premium pueden estar limitadas y tus eventos activos ahora tienen las restricciones del plan free.</p>
        <p>¡No pierdas tus beneficios! Puedes volver a suscribirte en cualquier momento para recuperar el acceso total.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.VITE_APP_URL}/pricing" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver Planes</a>
        </div>
    `;

    return sendEmail({ to: userEmail, subject, text, html });
};
