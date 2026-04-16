import OpenAI from 'openai';

const hasValidKey = process.env.OPENAI_API_KEY &&
    !process.env.OPENAI_API_KEY.startsWith('sk-tu') &&
    process.env.OPENAI_API_KEY !== 'sk-...';

let openai = null;
if (hasValidKey) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Moderates an image using OpenAI's vision model.
 * Returns { safe: boolean, reason: string, score: number }
 */
export async function moderateImage(imageBuffer) {
    if (!openai) {
        console.warn('⚠️ OpenAI no configurado. Moderación omitida.');
        return { safe: true, reason: '', score: 1 };
    }

    try {
        const base64Image = imageBuffer.toString('base64');
        const mimeType = 'image/jpeg';

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Eres un moderador de contenido para una aplicación de fotos de eventos familiares.
Tu tarea es evaluar si una imagen es apropiada para mostrar en un evento público (bodas, cumpleaños, corporativos).

Responde SOLO con un JSON:
{
  "safe": true/false,
  "reason": "razón si no es segura",
  "score": 0.0-1.0 (1.0 = completamente segura)
}

Criterios de rechazo:
- Contenido sexual o desnudez
- Violencia o gore
- Contenido ofensivo, racista o discriminatorio
- Drogas ilegales
- Contenido perturbador

Criterios de aceptación:
- Personas celebrando
- Decoración del evento
- Comida y bebidas (incluso alcohólicas)
- Selfies y fotos grupales
- Paisajes y lugares`,
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`,
                                detail: 'low',
                            },
                        },
                        {
                            type: 'text',
                            text: '¿Esta imagen es apropiada para un evento familiar?',
                        },
                    ],
                },
            ],
            max_tokens: 150,
        });

        const content = response.choices[0]?.message?.content || '';

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        // Default to safe if can't parse
        return { safe: true, reason: '', score: 0.8 };
    } catch (err) {
        console.error('Moderation error:', err.message);
        // Default to safe on error to not block uploads
        return { safe: true, reason: '', score: 0.5 };
    }
}
