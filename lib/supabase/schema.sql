-- ==============================================
-- AMPÈRE Database Schema for Supabase (PostgreSQL)
-- ==============================================
-- Run this in the Supabase SQL Editor to create all tables.
-- This schema uses Row-Level Security (RLS) for all user-facing tables.
-- ==============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- 1. PROFILES (extends Supabase auth.users)
-- ==============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'User',
  email TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'parent', 'child', 'admin')),
  avatar_url TEXT,
  header_url TEXT,
  region TEXT DEFAULT 'north_america',
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'America/New_York',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================
-- 2. FAMILY PROFILES (sub-profiles under a parent account)
-- ==============================================
CREATE TABLE public.family_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'parent', 'child')),
  avatar_url TEXT,
  pin_hash TEXT, -- bcrypt hash of 4-digit PIN
  is_kid_profile BOOLEAN DEFAULT false,
  max_age_rating TEXT DEFAULT 'NC-17',
  blocked_genres TEXT[] DEFAULT '{}',
  blocked_platforms TEXT[] DEFAULT '{}',
  time_limit_daily_minutes INTEGER,
  time_limit_weekend_minutes INTEGER,
  allowed_hours_start INTEGER DEFAULT 0,
  allowed_hours_end INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages family profiles" ON public.family_profiles
  FOR ALL USING (auth.uid() = owner_id);

-- ==============================================
-- 3. FAVORITE PLATFORMS
-- ==============================================
CREATE TABLE public.favorite_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform_id TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform_id)
);

ALTER TABLE public.favorite_platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites" ON public.favorite_platforms
  FOR ALL USING (auth.uid() = user_id);

-- ==============================================
-- 4. FAVORITE LEAGUES
-- ==============================================
CREATE TABLE public.favorite_leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  league TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, league)
);

ALTER TABLE public.favorite_leagues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own leagues" ON public.favorite_leagues
  FOR ALL USING (auth.uid() = user_id);

-- ==============================================
-- 5. FAVORITE TEAMS
-- ==============================================
CREATE TABLE public.favorite_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team TEXT NOT NULL,
  league TEXT,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, team)
);

ALTER TABLE public.favorite_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own teams" ON public.favorite_teams
  FOR ALL USING (auth.uid() = user_id);

-- ==============================================
-- 6. CONNECTED PLATFORMS (auth tokens stored encrypted)
-- ==============================================
CREATE TABLE public.connected_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform_id TEXT NOT NULL,
  is_connected BOOLEAN DEFAULT true,
  auth_type TEXT DEFAULT 'none' CHECK (auth_type IN ('oauth2', 'api_key', 'session', 'device_code', 'none')),
  encrypted_token TEXT, -- AES-256-GCM encrypted JSON blob
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform_id)
);

ALTER TABLE public.connected_platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own connections" ON public.connected_platforms
  FOR ALL USING (auth.uid() = user_id);

-- ==============================================
-- 7. TV DEVICES
-- ==============================================
CREATE TABLE public.tv_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT,
  ip_address TEXT,
  mac_address TEXT,
  discovery_protocol TEXT,
  control_protocol TEXT,
  capabilities JSONB DEFAULT '{}',
  is_primary BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tv_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own devices" ON public.tv_devices
  FOR ALL USING (auth.uid() = user_id);

-- ==============================================
-- 8. ACTIVITY LOG (audit trail)
-- ==============================================
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  family_profile_id UUID REFERENCES public.family_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own activity" ON public.activity_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System inserts activity" ON public.activity_log
  FOR INSERT WITH CHECK (true);

-- Index for querying recent activity
CREATE INDEX idx_activity_log_user_id ON public.activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_log_action ON public.activity_log(action);

-- ==============================================
-- 9. PUSH SUBSCRIPTIONS (Web Push)
-- ==============================================
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- ==============================================
-- 10. NOTIFICATION PREFERENCES
-- ==============================================
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notify_live_games BOOLEAN DEFAULT true,
  notify_favorite_teams BOOLEAN DEFAULT true,
  notify_new_content BOOLEAN DEFAULT false,
  notify_price_changes BOOLEAN DEFAULT false,
  quiet_hours_start INTEGER, -- hour 0-23
  quiet_hours_end INTEGER,   -- hour 0-23
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notification prefs" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ==============================================
-- 11. OFFLINE SCHEDULE CACHE
-- ==============================================
CREATE TABLE public.schedule_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league TEXT NOT NULL,
  team TEXT,
  event_title TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  platform_id TEXT,
  venue TEXT,
  broadcast_info TEXT,
  metadata JSONB DEFAULT '{}',
  cached_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '24 hours'
);

-- No RLS needed — schedule data is public
CREATE INDEX idx_schedule_league ON public.schedule_cache(league, event_date);
CREATE INDEX idx_schedule_team ON public.schedule_cache(team, event_date);

-- ==============================================
-- 12. WIZARD DRAFTS (server-side persistence)
-- ==============================================
CREATE TABLE public.wizard_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  step INTEGER DEFAULT 1,
  name TEXT,
  region TEXT,
  language TEXT,
  platforms TEXT[] DEFAULT '{}',
  leagues TEXT[] DEFAULT '{}',
  teams TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.wizard_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wizard draft" ON public.wizard_drafts
  FOR ALL USING (auth.uid() = user_id);

-- ==============================================
-- HELPER: Updated_at trigger
-- ==============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_family_profiles_updated_at BEFORE UPDATE ON public.family_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_notification_prefs_updated_at BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
