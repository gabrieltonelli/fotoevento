import express from 'express';
import { supabase } from '../services/supabase.js';
import { sendEmail } from '../services/email.js';

const router = express.Router();

/**
 * POST /api/support
 * Crea un ticket de soporte y envía notificación por email
 */
router.post('/', async (req, res) => {
    const { name, email, subject, message, category, userId } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        // 1. Guardar en base de datos
        const { data: ticket, error } = await supabase
            .from('support_tickets')
            .insert({
                user_id: userId || null,
                name,
                email,
                subject,
                message,
                category: category || 'general'
            })
            .select()
            .single();

        if (error) throw error;

        // 2. Enviar notificación por email al equipo de soporte
        const supportEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER;
        
        if (supportEmail) {
            await sendEmail({
                to: supportEmail,
                subject: `[Soporte] ${subject} - ${name}`,
                text: `Nuevo mensaje de soporte:\n\nDe: ${name} (${email})\nCategoría: ${category || 'general'}\nAsunto: ${subject}\n\nMensaje:\n${message}`,
                html: `
                    <h2 style="color: #3b82f6; margin-top: 0;">Nuevo mensaje de soporte</h2>
                    <p><strong>De:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
                    <p><strong>Categoría:</strong> ${category || 'general'}</p>
                    <p><strong>Asunto:</strong> ${subject}</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${message}</div>
                    <p style="font-size: 11px; color: #999; margin-top: 20px;">ID del ticket: ${ticket.id}</p>
                `
            });
        }

        // 3. Opcional: Enviar confirmación al usuario
        await sendEmail({
            to: email,
            subject: `Recibimos tu mensaje - Foto Evento`,
            text: `Hola ${name}, hemos recibido tu mensaje de soporte. Nos pondremos en contacto contigo pronto.\n\nAsunto: ${subject}`,
            html: `
                <h2 style="color: #3b82f6; margin-top: 0;">¡Hola ${name}!</h2>
                <p>Gracias por ponerte en contacto con el equipo de <strong>Foto Evento</strong>.</p>
                <p>Hemos recibido tu mensaje correctamente y nuestro equipo lo revisará a la brevedad.</p>
                <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0;"><strong>Tu consulta:</strong> ${subject}</p>
                </div>
                <p>No es necesario que respondas a este correo. Te contactaremos pronto.</p>
            `
        });

        res.status(201).json({ message: 'Mensaje enviado con éxito', ticketId: ticket.id });
    } catch (error) {
        console.error('Error handling support ticket:', error);
        res.status(500).json({ message: 'Error al enviar el mensaje' });
    }
});

export default router;
