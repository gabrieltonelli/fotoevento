-- =============================================
-- FotoEvento - Supabase Database Schema
-- =============================================
-- Run this SQL in your Supabase SQL Editor
-- (Dashboard > SQL Editor > New Query)
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'party',
  date DATE NOT NULL,
  location TEXT DEFAULT '',
  skin TEXT DEFAULT 'classic-dark',
  short_code TEXT NOT NULL UNIQUE,
  require_auth BOOLEAN DEFAULT false,
  show_qr_on_screen BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT true,
  max_photos INTEGER DEFAULT 500,
  is_active BOOLEAN DEFAULT true,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by short_code
CREATE INDEX IF NOT EXISTS idx_events_short_code ON events(short_code);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);

-- =============================================
-- PHOTOS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_short_code TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT DEFAULT 'Anónimo',
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderation_score DECIMAL(3,2) DEFAULT 1.00,
  moderation_reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_photos_event_id ON photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_event_short_code ON photos(event_short_code);
CREATE INDEX IF NOT EXISTS idx_photos_status ON photos(status);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  USING (auth.uid() = user_id);

-- Public access to events by short_code (for upload page and screen)
CREATE POLICY "Public can view active events by short_code"
  ON events FOR SELECT
  USING (is_active = true);

-- Photos policies
CREATE POLICY "Anyone can view approved photos"
  ON photos FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Anyone can insert photos"
  ON photos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Event owners can manage photos"
  ON photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = photos.event_id
      AND events.user_id = auth.uid()
    )
  );

-- =============================================
-- PAYMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  plan TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'ARS',
  processor TEXT NOT NULL, -- 'stripe' | 'mercadopago'
  payment_external_id TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert payments"
  ON payments FOR INSERT
  WITH CHECK (true);

-- =============================================
-- STORAGE BUCKET
-- =============================================
-- Create bucket for event photos (run in Supabase Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('event-photos', 'event-photos', true);

-- Storage policies
-- CREATE POLICY "Anyone can upload photos"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'event-photos');

-- CREATE POLICY "Anyone can view photos"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'event-photos');

-- =============================================
-- REALTIME
-- =============================================
-- Enable realtime for photos table
ALTER PUBLICATION supabase_realtime ADD TABLE photos;

-- =============================================
-- FUNCTIONS
-- =============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
