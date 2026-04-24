-- Add columns to track subscription notifications
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_expiry_warning_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_expiry_notified_at TIMESTAMPTZ;

-- Comment on columns
COMMENT ON COLUMN public.profiles.last_expiry_warning_sent_at IS 'Fecha en la que se envió el último aviso de vencimiento próximo';
COMMENT ON COLUMN public.profiles.last_expiry_notified_at IS 'Fecha en la que se envió el último aviso de suscripción ya vencida';
