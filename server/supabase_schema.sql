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
