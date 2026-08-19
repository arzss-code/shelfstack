-- Create Enum for Activity Log Actions
CREATE TYPE activity_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE');

-- Create Activity Logs Table
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id BIGINT NOT NULL,
    action activity_action NOT NULL,
    description TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    browser TEXT,
    platform TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Activity Logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (since there's no auth yet, similar to products table)
CREATE POLICY "Allow anyone to insert activity logs"
ON public.activity_logs FOR INSERT WITH CHECK (true);

-- Allow anyone to read
CREATE POLICY "Allow anyone to read activity logs"
ON public.activity_logs FOR SELECT USING (true);
