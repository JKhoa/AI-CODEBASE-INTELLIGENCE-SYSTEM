-- Paste and run this SQL script into the SQL Editor of your Supabase Dashboard

-- 1. Create Workspaces Table
CREATE TABLE public.workspaces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text DEFAULT 'free',
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Create Workspace Members Table
CREATE TABLE public.workspace_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member', -- owner, admin, member
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- 3. Create Scans Table
CREATE TABLE public.scans (
  id text PRIMARY KEY, -- Keep text to match your python generated short strings
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_owner text NOT NULL,
  repo_name text NOT NULL,
  visibility text DEFAULT 'private',
  share_token text UNIQUE,
  status text DEFAULT 'queued',
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  finished_at timestamp with time zone
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- 5. Basic RLS Policies (Update these for more granular security later)
CREATE POLICY "Users can view their own workspaces"
ON public.workspaces FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own workspaces"
ON public.workspaces FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view their scans"
ON public.scans FOR SELECT
USING (auth.uid() = user_id OR visibility = 'public');

CREATE POLICY "Users can insert scans"
ON public.scans FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 6. Trigger to automatically create a default workspace when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.workspaces (name, slug, owner_id)
  VALUES (
    'Personal Workspace',
    NEW.id::text,
    NEW.id
  );
  
  -- The workspace member record
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (
    (SELECT id FROM public.workspaces WHERE owner_id = NEW.id LIMIT 1),
    NEW.id,
    'owner'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
