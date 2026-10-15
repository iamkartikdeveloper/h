-- ==============================================================================
-- DEVELOPER PORTFOLIO & YOUTUBE TUTORIAL PLATFORM
-- Supabase PostgreSQL Complete Database Schema & Row Level Security (RLS)
-- ==============================================================================

-- Enable essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Portfolio Owner Profile)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL DEFAULT 'Kartik Sharma',
    username TEXT UNIQUE DEFAULT 'kartik',
    bio TEXT DEFAULT 'Full Stack Developer & Android Engineer passionate about crafting high-performance mobile apps, web experiences, and educational YouTube tutorials.',
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
    skills TEXT[] DEFAULT ARRAY['Android', 'Kotlin', 'Java', 'Flutter', 'Next.js', 'React', 'TypeScript', 'Supabase', 'Firebase', 'Google AdMob', 'Tailwind CSS', 'Node.js'],
    social_links JSONB DEFAULT '{
        "youtube": "https://youtube.com/@kartikdev",
        "github": "https://github.com/kartikdev",
        "linkedin": "https://linkedin.com/in/kartikdev",
        "twitter": "https://twitter.com/kartikdev",
        "email": "contact@kartikdev.com"
    }'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. ADMIN USERS TABLE (Authorization mapped to Supabase Auth users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper function to check if the current user is an authorized admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
    );
$$;

-- ------------------------------------------------------------------------------
-- 3. CATEGORIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. TAGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. TUTORIALS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tutorials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    content TEXT NOT NULL,
    youtube_url TEXT,
    thumbnail_url TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    difficulty TEXT DEFAULT 'Beginner' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'All Levels')),
    prerequisites TEXT[] DEFAULT ARRAY[]::TEXT[],
    reading_time INT DEFAULT 8,
    seo_title TEXT,
    seo_description TEXT,
    og_image_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. TUTORIAL TAGS (Many-to-Many junction)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tutorial_tags (
    tutorial_id UUID NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (tutorial_id, tag_id)
);

-- ------------------------------------------------------------------------------
-- 7. CODE SNIPPETS (Organized code blocks per tutorial)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.code_snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutorial_id UUID NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
    title TEXT,
    language TEXT NOT NULL DEFAULT 'javascript',
    code TEXT NOT NULL,
    explanation TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. TUTORIAL RESOURCES (Downloadables, zip, docs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tutorial_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutorial_id UUID NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    resource_type TEXT DEFAULT 'zip' CHECK (resource_type IN ('zip', 'pdf', 'github', 'link', 'other')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. PROJECTS TABLE (Developer Portfolio Projects)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    content TEXT,
    thumbnail_url TEXT,
    technologies TEXT[] DEFAULT ARRAY[]::TEXT[],
    github_url TEXT,
    demo_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. CONTACT MESSAGES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. COMMENTS TABLE (Moderated tutorial comments)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutorial_id UUID NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 12. TUTORIAL FEEDBACK (Helpfulness votes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tutorial_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutorial_id UUID NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 13. NEWSLETTER SUBSCRIBERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 14. TUTORIAL VIEWS (Real analytics aggregation)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tutorial_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutorial_id UUID NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 15. WEBSITE SETTINGS TABLE (Configurable site title, footer, announcements)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.website_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- INDEXES FOR MAXIMUM QUERY AND SEARCH PERFORMANCE
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tutorials_slug ON public.tutorials(slug);
CREATE INDEX IF NOT EXISTS idx_tutorials_status ON public.tutorials(status);
CREATE INDEX IF NOT EXISTS idx_tutorials_published_at ON public.tutorials(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_tutorials_category_id ON public.tutorials(category_id);
CREATE INDEX IF NOT EXISTS idx_tutorials_is_featured ON public.tutorials(is_featured);

-- Full-Text Search and Trigram index on Tutorials
CREATE INDEX IF NOT EXISTS idx_tutorials_title_trgm ON public.tutorials USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tutorials_description_trgm ON public.tutorials USING gin (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_comments_tutorial_id ON public.comments(tutorial_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON public.comments(status);
CREATE INDEX IF NOT EXISTS idx_tutorial_views_tutorial_id ON public.tutorial_views(tutorial_id);
CREATE INDEX IF NOT EXISTS idx_code_snippets_tutorial_id ON public.code_snippets(tutorial_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_resources_tutorial_id ON public.tutorial_resources(tutorial_id);

-- ------------------------------------------------------------------------------
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_tutorials_updated_at ON public.tutorials;
CREATE TRIGGER set_tutorials_updated_at
BEFORE UPDATE ON public.tutorials
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES
CREATE POLICY "Public read profiles" ON public.profiles
    FOR SELECT USING (true);
CREATE POLICY "Admin update profiles" ON public.profiles
    FOR ALL USING (public.is_admin());

-- 2. ADMIN USERS
CREATE POLICY "Admins or self can read admin_users" ON public.admin_users
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins can manage admin_users" ON public.admin_users
    FOR ALL USING (public.is_admin());

-- 3. CATEGORIES
CREATE POLICY "Public read categories" ON public.categories
    FOR SELECT USING (true);
CREATE POLICY "Admin manage categories" ON public.categories
    FOR ALL USING (public.is_admin());

-- 4. TAGS
CREATE POLICY "Public read tags" ON public.tags
    FOR SELECT USING (true);
CREATE POLICY "Admin manage tags" ON public.tags
    FOR ALL USING (public.is_admin());

-- 5. TUTORIALS
CREATE POLICY "Public read published tutorials" ON public.tutorials
    FOR SELECT USING (status = 'published' OR public.is_admin());
CREATE POLICY "Admin manage tutorials" ON public.tutorials
    FOR ALL USING (public.is_admin());

-- 6. TUTORIAL TAGS
CREATE POLICY "Public read tutorial_tags" ON public.tutorial_tags
    FOR SELECT USING (true);
CREATE POLICY "Admin manage tutorial_tags" ON public.tutorial_tags
    FOR ALL USING (public.is_admin());

-- 7. CODE SNIPPETS
CREATE POLICY "Public read code_snippets for published tutorials" ON public.code_snippets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tutorials 
            WHERE tutorials.id = code_snippets.tutorial_id 
            AND (tutorials.status = 'published' OR public.is_admin())
        )
    );
CREATE POLICY "Admin manage code_snippets" ON public.code_snippets
    FOR ALL USING (public.is_admin());

-- 8. TUTORIAL RESOURCES
CREATE POLICY "Public read tutorial_resources for published tutorials" ON public.tutorial_resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tutorials 
            WHERE tutorials.id = tutorial_resources.tutorial_id 
            AND (tutorials.status = 'published' OR public.is_admin())
        )
    );
CREATE POLICY "Admin manage tutorial_resources" ON public.tutorial_resources
    FOR ALL USING (public.is_admin());

-- 9. PROJECTS
CREATE POLICY "Public read published projects" ON public.projects
    FOR SELECT USING (status = 'published' OR public.is_admin());
CREATE POLICY "Admin manage projects" ON public.projects
    FOR ALL USING (public.is_admin());

-- 10. CONTACT MESSAGES
CREATE POLICY "Public insert contact_messages" ON public.contact_messages
    FOR INSERT WITH CHECK (
        length(trim(name)) > 0 AND 
        length(trim(email)) > 3 AND 
        length(trim(message)) > 0
    );
CREATE POLICY "Admin read and manage contact_messages" ON public.contact_messages
    FOR ALL USING (public.is_admin());

-- 11. COMMENTS
CREATE POLICY "Public read approved comments" ON public.comments
    FOR SELECT USING (status = 'approved' OR public.is_admin());
CREATE POLICY "Public insert comments" ON public.comments
    FOR INSERT WITH CHECK (
        length(trim(author_name)) > 0 AND 
        length(trim(author_email)) > 3 AND 
        length(trim(content)) > 0 AND
        status = 'pending'
    );
CREATE POLICY "Admin manage comments" ON public.comments
    FOR ALL USING (public.is_admin());

-- 12. TUTORIAL FEEDBACK
CREATE POLICY "Public insert tutorial_feedback" ON public.tutorial_feedback
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read tutorial_feedback" ON public.tutorial_feedback
    FOR SELECT USING (public.is_admin());

-- 13. NEWSLETTER SUBSCRIBERS
CREATE POLICY "Public insert newsletter_subscribers" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (length(trim(email)) > 3);
CREATE POLICY "Admin manage newsletter_subscribers" ON public.newsletter_subscribers
    FOR ALL USING (public.is_admin());

-- 14. TUTORIAL VIEWS
CREATE POLICY "Public insert tutorial_views" ON public.tutorial_views
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read tutorial_views" ON public.tutorial_views
    FOR SELECT USING (public.is_admin());

-- 15. WEBSITE SETTINGS
CREATE POLICY "Public read website_settings" ON public.website_settings
    FOR SELECT USING (true);
CREATE POLICY "Admin manage website_settings" ON public.website_settings
    FOR ALL USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- STORAGE BUCKETS SETUP & POLICIES
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('tutorial-thumbnails', 'tutorial-thumbnails', true),
    ('tutorial-images', 'tutorial-images', true),
    ('tutorial-resources', 'tutorial-resources', true),
    ('project-images', 'project-images', true),
    ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Public read for public buckets
CREATE POLICY "Public can view storage objects" ON storage.objects
    FOR SELECT USING (
        bucket_id IN ('tutorial-thumbnails', 'tutorial-images', 'tutorial-resources', 'project-images', 'profile-images')
    );

-- Storage RLS: Admins can upload/modify/delete storage objects
CREATE POLICY "Admins can upload storage objects" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id IN ('tutorial-thumbnails', 'tutorial-images', 'tutorial-resources', 'project-images', 'profile-images')
        AND (public.is_admin() OR auth.role() = 'authenticated')
    );

CREATE POLICY "Admins can update storage objects" ON storage.objects
    FOR UPDATE USING (
        bucket_id IN ('tutorial-thumbnails', 'tutorial-images', 'tutorial-resources', 'project-images', 'profile-images')
        AND (public.is_admin() OR auth.role() = 'authenticated')
    );

CREATE POLICY "Admins can delete storage objects" ON storage.objects
    FOR DELETE USING (
        bucket_id IN ('tutorial-thumbnails', 'tutorial-images', 'tutorial-resources', 'project-images', 'profile-images')
        AND (public.is_admin() OR auth.role() = 'authenticated')
    );
