-- ============================================
-- TEAM CALENDAR - SUPABASE DATABASE SETUP
-- ============================================
-- Version: 1.0 (Sprint 5 - Simplified without auth)
--
-- Instructions:
-- 1. Go to https://supabase.com
-- 2. Create a new project (or use existing)
-- 3. Go to SQL Editor
-- 4. Paste this entire file and click "Run"
-- 5. Wait for completion (should take ~5 seconds)
-- 6. Verify tables created in Table Editor
-- ============================================

-- ============================================
-- DROP EXISTING TABLES (if re-running)
-- ============================================
-- Uncomment these lines if you need to reset the database
-- DROP TABLE IF EXISTS imported_calendars CASCADE;
-- DROP TABLE IF EXISTS calendar_events CASCADE;
-- DROP TABLE IF EXISTS team_members CASCADE;

-- ============================================
-- CREATE TABLES
-- ============================================

-- Table: team_members
-- Stores team member information
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  color TEXT NOT NULL,
  rotation_pattern TEXT NOT NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT role_not_empty CHECK (length(trim(role)) > 0),
  CONSTRAINT color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Table: calendar_events
-- Stores calendar events for team members
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'school', 'unavailable', 'vacation')),
  note TEXT,
  is_imported BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Table: imported_calendars
-- Tracks imported calendar files metadata
CREATE TABLE IF NOT EXISTS imported_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('ics', 'xlsx', 'csv')),
  file_url TEXT,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_member_file UNIQUE (member_id, file_name)
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index for querying events by member
CREATE INDEX IF NOT EXISTS idx_events_member_id
  ON calendar_events(member_id);

-- Index for querying events by date range (most common query)
CREATE INDEX IF NOT EXISTS idx_events_dates
  ON calendar_events(start_date, end_date);

-- Index for querying imported events
CREATE INDEX IF NOT EXISTS idx_events_imported
  ON calendar_events(member_id, is_imported)
  WHERE is_imported = TRUE;

-- Index for imported calendars by member
CREATE INDEX IF NOT EXISTS idx_imported_member_id
  ON imported_calendars(member_id);

-- ============================================
-- CREATE TRIGGER FOR AUTO-UPDATE updated_at
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for team_members
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger for calendar_events
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- DISABLE ROW LEVEL SECURITY (PUBLIC ACCESS)
-- ============================================
-- WARNING: This makes all data publicly accessible
-- Only use this for internal apps with non-sensitive data

ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE imported_calendars DISABLE ROW LEVEL SECURITY;

-- ============================================
-- ENABLE REALTIME REPLICATION
-- ============================================
-- This allows real-time updates via Supabase Realtime

-- Enable realtime for team_members
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;

-- Enable realtime for calendar_events
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;

-- Enable realtime for imported_calendars
ALTER PUBLICATION supabase_realtime ADD TABLE imported_calendars;

-- ============================================
-- INSERT SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================
-- Uncomment to insert sample data for testing

/*
-- Sample member 1
INSERT INTO team_members (name, role, color, rotation_pattern, avatar)
VALUES (
  'Alice Dupont',
  'Développeur Full Stack',
  '#3B82F6',
  '2 semaines ON, 1 semaine OFF',
  NULL
);

-- Sample member 2
INSERT INTO team_members (name, role, color, rotation_pattern, avatar)
VALUES (
  'Bob Martin',
  'Designer UX/UI',
  '#10B981',
  'Temps plein',
  NULL
);

-- Sample event for Alice (available)
INSERT INTO calendar_events (member_id, start_date, end_date, status, note)
VALUES (
  (SELECT id FROM team_members WHERE name = 'Alice Dupont' LIMIT 1),
  '2025-01-13'::TIMESTAMPTZ,
  '2025-01-17'::TIMESTAMPTZ,
  'available',
  'Disponible cette semaine'
);

-- Sample event for Bob (school)
INSERT INTO calendar_events (member_id, start_date, end_date, status, note)
VALUES (
  (SELECT id FROM team_members WHERE name = 'Bob Martin' LIMIT 1),
  '2025-01-13'::TIMESTAMPTZ,
  '2025-01-19'::TIMESTAMPTZ,
  'school',
  'Formation React'
);
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify setup was successful

-- Check tables exist
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('team_members', 'calendar_events', 'imported_calendars')
ORDER BY table_name;

-- Check indexes
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('team_members', 'calendar_events', 'imported_calendars')
ORDER BY tablename, indexname;

-- Check RLS status (should all be FALSE)
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('team_members', 'calendar_events', 'imported_calendars')
ORDER BY tablename;

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================
-- Next steps:
-- 1. Go to Storage → Create bucket "calendar-files" (public)
-- 2. Copy your Project URL and Anon Key from Settings → API
-- 3. Add them to your .env.local file
-- 4. Start your Next.js app and test!
-- ============================================
