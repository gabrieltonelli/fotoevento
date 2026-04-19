-- 1. Reactivar las pruebas gratuitas para el usuario dev
UPDATE profiles 
SET trials_used_count = 0 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'gabrieltonelli@gmail.com');

-- 2. Asegurar que los eventos gratuitos antiguos tengan una fecha de expiración
-- Esto activará el bloqueo de descarga si ya pasaron los minutos de prueba
UPDATE events
SET expires_at = created_at + (interval '1 minute' * COALESCE(NULLIF(current_setting('app.free_trial_minutes', true), ''), '30')::integer)
WHERE plan = 'free' 
AND expires_at IS NULL;

-- 3. Si quieres forzar la expiración inmediata de un evento específico para testear el botón de descarga:
-- UPDATE events SET expires_at = NOW() - interval '1 minute' WHERE id = 'TU_EVENT_ID_AQUI';
