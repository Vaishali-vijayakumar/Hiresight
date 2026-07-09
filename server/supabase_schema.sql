-- Run this script in your Supabase SQL Editor

-- 1. Create customized Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'Applicant' CHECK (role IN ('Admin', 'HR', 'Applicant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: In a real app, you'd want a trigger to automatically insert into public.users
-- when a new user is created in auth.users. 
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', COALESCE(new.raw_user_meta_data->>'role', 'Applicant'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Create Resumes table
CREATE TABLE public.resumes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  applicant_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  extracted_text TEXT,
  summary TEXT,
  tone TEXT,
  ai_score INTEGER DEFAULT 0,
  skills JSONB DEFAULT '{}'::jsonb,
  keywords JSONB DEFAULT '[]'::jsonb,
  entities JSONB DEFAULT '{}'::jsonb,
  sentiment JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Reviewed', 'Shortlisted', 'Rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Storage Bucket for Resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'resumes' );

CREATE POLICY "Authenticated Users can upload resumes" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'resumes' AND auth.role() = 'authenticated' );

-- 4. Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- User Policies: Users can read their own data, Admins and HR can read all
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "HR and Admins can read all users" ON public.users FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('Admin', 'HR')
  )
);

-- Resume Policies
CREATE POLICY "Applicants can view own resumes" ON public.resumes FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY "Applicants can insert own resumes" ON public.resumes FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "HR and Admins can view all resumes" ON public.resumes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('Admin', 'HR')
  )
);
CREATE POLICY "HR and Admins can update resumes" ON public.resumes FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('Admin', 'HR')
  )
);

-- 5. Create Candidates table for HR Admin tracking
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  position TEXT NOT NULL,
  experience TEXT,
  skills TEXT,
  linkedin_profile TEXT,
  status TEXT DEFAULT 'Applied' CHECK (status IN ('Applied', 'Under Review', 'Interview Scheduled', 'Selected', 'Rejected', 'Hired')),
  assigned_tl TEXT,
  assigned_manager TEXT,
  interview_date TIMESTAMP WITH TIME ZONE,
  interview_feedback TEXT,
  source TEXT DEFAULT 'Manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Assignment Rules table
CREATE TABLE IF NOT EXISTS public.assignment_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  position_pattern TEXT UNIQUE NOT NULL,
  assigned_tl TEXT NOT NULL,
  assigned_manager TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default assignment rules
INSERT INTO public.assignment_rules (position_pattern, assigned_tl, assigned_manager) VALUES
('Software Engineer', 'Marcus Aurelius (TL)', 'Sarah Jenkins (MGR)'),
('Frontend Developer', 'Lucas Miller (TL)', 'Sarah Jenkins (MGR)'),
('Backend Developer', 'Vikram Singh (TL)', 'David Chen (MGR)'),
('Full Stack Engineer', 'Marcus Aurelius (TL)', 'David Chen (MGR)'),
('Data Scientist', 'Elena Rostova (TL)', 'Robert Carter (MGR)'),
('Product Manager', 'Diana Prince (TL)', 'Sophia Martinez (MGR)')
ON CONFLICT (position_pattern) DO NOTHING;

-- Enable RLS for new tables
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_rules ENABLE ROW LEVEL SECURITY;

-- Policies for Candidates and Assignment Rules
CREATE POLICY "Public Read Candidates" ON public.candidates FOR SELECT USING (true);
CREATE POLICY "Public Insert Candidates" ON public.candidates FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Candidates" ON public.candidates FOR UPDATE USING (true);
CREATE POLICY "Public Delete Candidates" ON public.candidates FOR DELETE USING (true);

CREATE POLICY "Public Read Rules" ON public.assignment_rules FOR SELECT USING (true);
CREATE POLICY "Public Insert Rules" ON public.assignment_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Rules" ON public.assignment_rules FOR UPDATE USING (true);
CREATE POLICY "Public Delete Rules" ON public.assignment_rules FOR DELETE USING (true);

