-- Create user_mutes table
CREATE TABLE IF NOT EXISTS public.user_mutes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    muter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    muted_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE (muter_id, muted_id)
);

-- Enable RLS
ALTER TABLE public.user_mutes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own mutes" 
    ON public.user_mutes 
    FOR ALL 
    USING (auth.uid() = muter_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS user_mutes_muter_id_idx ON public.user_mutes(muter_id);
CREATE INDEX IF NOT EXISTS user_mutes_muted_id_idx ON public.user_mutes(muted_id);
