-- ==============================================================================
-- Video Editing Contract Tracker - Initial Database Schema & Security
-- Migration: 001_initial_schema.sql
-- ==============================================================================

-- 1. Create Profiles Table (Linked to Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create Contracts Table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Video Editing Contract',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  milestone_runtime_minutes INTEGER NOT NULL DEFAULT 90,
  milestone_amount NUMERIC NOT NULL DEFAULT 25000,
  total_runtime_minutes INTEGER NOT NULL DEFAULT 540,
  total_contract_amount NUMERIC NOT NULL DEFAULT 150000,
  monthly_reference_minutes INTEGER NOT NULL DEFAULT 90,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create Videos Table (Each completed final edited video)
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
  completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  youtube_url TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create Payments Table (Milestone tracking: Earned vs Paid)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_number INTEGER NOT NULL CHECK (milestone_number >= 1),
  runtime_threshold_minutes INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  earned BOOLEAN NOT NULL DEFAULT FALSE,
  earned_at TIMESTAMPTZ NULL,
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMPTZ NULL,
  payment_date DATE NULL,
  actual_amount_received NUMERIC NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_contract_milestone UNIQUE (contract_id, milestone_number)
);

-- 5. Create Share Links Table (Cryptographic tokens for read-only employer report)
CREATE TABLE IF NOT EXISTS public.share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ NULL,
  last_accessed_at TIMESTAMPTZ NULL
);

-- ==============================================================================
-- 6. Indexes for Performance & Query Isolation
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_contract_id ON public.videos(contract_id);
CREATE INDEX IF NOT EXISTS idx_videos_completed_at ON public.videos(completed_at);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON public.payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_share_links_token ON public.share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_user_id ON public.share_links(user_id);

-- ==============================================================================
-- 7. Enable Row Level Security (RLS) on All Tables
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 8. Row Level Security Policies (Strict User Data Isolation via auth.uid())
-- ==============================================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Contracts policies
CREATE POLICY "Users can view their own contracts"
  ON public.contracts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contracts"
  ON public.contracts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contracts"
  ON public.contracts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contracts"
  ON public.contracts FOR DELETE
  USING (auth.uid() = user_id);

-- Videos policies
CREATE POLICY "Users can view their own videos"
  ON public.videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos"
  ON public.videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
  ON public.videos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
  ON public.videos FOR DELETE
  USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments"
  ON public.payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payments"
  ON public.payments FOR DELETE
  USING (auth.uid() = user_id);

-- Share Links policies
CREATE POLICY "Users can manage their own share links"
  ON public.share_links FOR ALL
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 9. Automatic User Profile & Initial Contract Provisioning Trigger
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract_id UUID;
  v_display_name TEXT;
BEGIN
  -- Extract display name or fallback to email username
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  -- 1. Create Profile
  INSERT INTO public.profiles (id, display_name, email, created_at, updated_at)
  VALUES (NEW.id, v_display_name, NEW.email, now(), now())
  ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        email = EXCLUDED.email,
        updated_at = now();

  -- 2. Create Default Initial Contract for the newly registered user
  INSERT INTO public.contracts (
    user_id,
    title,
    status,
    milestone_runtime_minutes,
    milestone_amount,
    total_runtime_minutes,
    total_contract_amount,
    monthly_reference_minutes,
    start_date,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'Video Editing Contract',
    'active',
    90,
    25000,
    540,
    150000,
    90,
    CURRENT_DATE,
    now(),
    now()
  )
  RETURNING id INTO v_contract_id;

  RETURN NEW;
END;
$$;

-- Trigger execution on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 10. Secure Public RPC for Read-Only Employer Progress Report
-- ==============================================================================
-- This function allows employers with a valid, active share token to view ONLY
-- the contract progress, completed videos list, and payment milestones,
-- WITHOUT logging in, and WITHOUT exposing user emails, auth credentials, or private settings.
CREATE OR REPLACE FUNCTION public.get_shared_progress_report(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link RECORD;
  v_contract RECORD;
  v_videos JSONB;
  v_payments JSONB;
  v_result JSONB;
BEGIN
  -- 1. Validate Token & Active Status
  SELECT * INTO v_link
  FROM public.share_links
  WHERE token = p_token AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- 2. Update last accessed timestamp
  UPDATE public.share_links
  SET last_accessed_at = now()
  WHERE id = v_link.id;

  -- 3. Fetch Contract Details (sanitized, non-sensitive)
  SELECT 
    id,
    title,
    status,
    milestone_runtime_minutes,
    milestone_amount,
    total_runtime_minutes,
    total_contract_amount,
    monthly_reference_minutes,
    start_date,
    created_at,
    updated_at
  INTO v_contract
  FROM public.contracts
  WHERE id = v_link.contract_id;

  -- 4. Fetch Completed Videos for this contract
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'title', title,
        'duration_seconds', duration_seconds,
        'completed_at', completed_at,
        'youtube_url', youtube_url,
        'notes', notes,
        'created_at', created_at
      ) ORDER BY completed_at DESC, created_at DESC
    ),
    '[]'::jsonb
  ) INTO v_videos
  FROM public.videos
  WHERE contract_id = v_link.contract_id;

  -- 5. Fetch Payments for this contract
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'milestone_number', milestone_number,
        'runtime_threshold_minutes', runtime_threshold_minutes,
        'amount', amount,
        'earned', earned,
        'earned_at', earned_at,
        'paid', paid,
        'paid_at', paid_at,
        'payment_date', payment_date,
        'actual_amount_received', actual_amount_received,
        'notes', notes
      ) ORDER BY milestone_number ASC
    ),
    '[]'::jsonb
  ) INTO v_payments
  FROM public.payments
  WHERE contract_id = v_link.contract_id;

  -- 6. Assemble Safe Employer Report JSON
  v_result := jsonb_build_object(
    'contract', to_jsonb(v_contract),
    'videos', v_videos,
    'payments', v_payments,
    'share_link', jsonb_build_object(
      'id', v_link.id,
      'token', v_link.token,
      'is_active', v_link.is_active,
      'created_at', v_link.created_at
    ),
    'generated_at', now()
  );

  RETURN v_result;
END;
$$;

-- Grant execution of get_shared_progress_report to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_shared_progress_report(TEXT) TO anon, authenticated, service_role;
