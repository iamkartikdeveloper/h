-- ==============================================================================
-- COMPLETE SUPABASE ALL-IN-ONE FIX & DATABASE SETUP
-- Project: moddedteamweb (igrritzxmfjymshjdphy)
-- Description: Run this entire script in Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 0. Enable essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ------------------------------------------------------------------------------
-- 1. UPDATE EXISTING PROFILES TABLE WITH ALL REQUIRED COLUMNS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add missing columns to existing public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT 'Kartik Sharma';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT 'Full Stack Developer & Android Engineer passionate about crafting high-performance mobile apps, web experiences, and educational YouTube tutorials.';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT ARRAY['Android', 'Kotlin', 'Java', 'Flutter', 'Next.js', 'React', 'TypeScript', 'Supabase', 'Firebase', 'Google AdMob', 'Tailwind CSS', 'Node.js'];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{
    "youtube": "https://youtube.com/@kartikdev",
    "github": "https://github.com/kartikdev",
    "linkedin": "https://linkedin.com/in/kartikdev",
    "twitter": "https://twitter.com/kartikdev",
    "email": "contact@kartikdev.com"
}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Sync full_name & display_name
UPDATE public.profiles SET display_name = full_name WHERE display_name IS NULL AND full_name IS NOT NULL;
UPDATE public.profiles SET full_name = display_name WHERE full_name IS NULL AND display_name IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 2. ADMIN USERS TABLE & AUTHORIZATION
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure Kartik Sharma is registered as Owner/Admin in both tables
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'kartiksharma20081186@gmail.com' LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- Insert/update in profiles
        INSERT INTO public.profiles (
            id, email, display_name, full_name, username, role, updated_at
        ) VALUES (
            v_user_id,
            'kartiksharma20081186@gmail.com',
            'Kartik Sharma',
            'Kartik Sharma',
            'kartik',
            'owner',
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            role = 'owner',
            display_name = 'Kartik Sharma',
            full_name = 'Kartik Sharma',
            username = 'kartik',
            email = 'kartiksharma20081186@gmail.com',
            updated_at = NOW();

        -- Insert/update in admin_users
        INSERT INTO public.admin_users (user_id, role)
        VALUES (v_user_id, 'owner')
        ON CONFLICT (user_id) DO UPDATE SET role = 'owner';
    END IF;
END $$;

-- Helper function to check if current authenticated session is Admin/Owner
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
    ) OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'owner')
    );
$$;

-- ------------------------------------------------------------------------------
-- 3. AUTOMATIC USER REGISTRATION TRIGGER (Sign up -> Profile provision)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  default_name TEXT;
  default_username TEXT;
BEGIN
  default_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1)
  );

  default_username := coalesce(
    new.raw_user_meta_data->>'username',
    lower(split_part(new.email, '@', 1)) || '_' || substr(replace(new.id::text, '-', ''), 1, 6)
  );

  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    full_name,
    username,
    avatar_url,
    role,
    skills,
    social_links,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    default_name,
    default_name,
    default_username,
    new.raw_user_meta_data->>'avatar_url',
    'user',
    ARRAY[]::TEXT[],
    '{}'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    updated_at = NOW();

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 4. CATEGORIES TABLE
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
-- 5. TAGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. TUTORIALS TABLE
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
-- 7. TUTORIAL TAGS JUNCTION
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tutorial_tags (
    tutorial_id UUID NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (tutorial_id, tag_id)
);

-- ------------------------------------------------------------------------------
-- 8. CODE SNIPPETS
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
-- 9. TUTORIAL RESOURCES
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
-- 10. PROJECTS TABLE
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
-- 11. CONTACT MESSAGES TABLE
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
-- 12. COMMENTS TABLE
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
-- 13. TUTORIAL FEEDBACK
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tutorial_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutorial_id UUID NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 14. NEWSLETTER SUBSCRIBERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 15. TUTORIAL VIEWS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tutorial_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutorial_id UUID NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 16. WEBSITE SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.website_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 17. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tutorials_slug ON public.tutorials(slug);
CREATE INDEX IF NOT EXISTS idx_tutorials_status ON public.tutorials(status);
CREATE INDEX IF NOT EXISTS idx_tutorials_published_at ON public.tutorials(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_tutorials_category_id ON public.tutorials(category_id);
CREATE INDEX IF NOT EXISTS idx_tutorials_is_featured ON public.tutorials(is_featured);
CREATE INDEX IF NOT EXISTS idx_tutorials_title_trgm ON public.tutorials USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tutorials_description_trgm ON public.tutorials USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_comments_tutorial_id ON public.comments(tutorial_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON public.comments(status);
CREATE INDEX IF NOT EXISTS idx_tutorial_views_tutorial_id ON public.tutorial_views(tutorial_id);

-- ------------------------------------------------------------------------------
-- 18. UPDATED_AT TRIGGER
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
-- 19. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
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

-- Clean drop existing policies to ensure idempotent run
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins or self can read admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Admin manage categories" ON public.categories;
DROP POLICY IF EXISTS "Public read tags" ON public.tags;
DROP POLICY IF EXISTS "Admin manage tags" ON public.tags;
DROP POLICY IF EXISTS "Public read published tutorials" ON public.tutorials;
DROP POLICY IF EXISTS "Admin manage tutorials" ON public.tutorials;
DROP POLICY IF EXISTS "Public read tutorial_tags" ON public.tutorial_tags;
DROP POLICY IF EXISTS "Admin manage tutorial_tags" ON public.tutorial_tags;
DROP POLICY IF EXISTS "Public read code_snippets for published tutorials" ON public.code_snippets;
DROP POLICY IF EXISTS "Admin manage code_snippets" ON public.code_snippets;
DROP POLICY IF EXISTS "Public read tutorial_resources for published tutorials" ON public.tutorial_resources;
DROP POLICY IF EXISTS "Admin manage tutorial_resources" ON public.tutorial_resources;
DROP POLICY IF EXISTS "Public read published projects" ON public.projects;
DROP POLICY IF EXISTS "Admin manage projects" ON public.projects;
DROP POLICY IF EXISTS "Public insert contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admin read and manage contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Public read approved comments" ON public.comments;
DROP POLICY IF EXISTS "Public insert comments" ON public.comments;
DROP POLICY IF EXISTS "Admin manage comments" ON public.comments;
DROP POLICY IF EXISTS "Public insert tutorial_feedback" ON public.tutorial_feedback;
DROP POLICY IF EXISTS "Admin read tutorial_feedback" ON public.tutorial_feedback;
DROP POLICY IF EXISTS "Public insert newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admin manage newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Public insert tutorial_views" ON public.tutorial_views;
DROP POLICY IF EXISTS "Admin read tutorial_views" ON public.tutorial_views;
DROP POLICY IF EXISTS "Public read website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "Admin manage website_settings" ON public.website_settings;

-- 1. Profiles
CREATE POLICY "Public read profiles" ON public.profiles
    FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admin update profiles" ON public.profiles
    FOR ALL USING (public.is_admin());

-- 2. Admin Users
CREATE POLICY "Admins or self can read admin_users" ON public.admin_users
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins can manage admin_users" ON public.admin_users
    FOR ALL USING (public.is_admin());

-- 3. Categories
CREATE POLICY "Public read categories" ON public.categories
    FOR SELECT USING (true);
CREATE POLICY "Admin manage categories" ON public.categories
    FOR ALL USING (public.is_admin());

-- 4. Tags
CREATE POLICY "Public read tags" ON public.tags
    FOR SELECT USING (true);
CREATE POLICY "Admin manage tags" ON public.tags
    FOR ALL USING (public.is_admin());

-- 5. Tutorials
CREATE POLICY "Public read published tutorials" ON public.tutorials
    FOR SELECT USING (status = 'published' OR public.is_admin());
CREATE POLICY "Admin manage tutorials" ON public.tutorials
    FOR ALL USING (public.is_admin());

-- 6. Tutorial Tags
CREATE POLICY "Public read tutorial_tags" ON public.tutorial_tags
    FOR SELECT USING (true);
CREATE POLICY "Admin manage tutorial_tags" ON public.tutorial_tags
    FOR ALL USING (public.is_admin());

-- 7. Code Snippets
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

-- 8. Tutorial Resources
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

-- 9. Projects
CREATE POLICY "Public read published projects" ON public.projects
    FOR SELECT USING (status = 'published' OR public.is_admin());
CREATE POLICY "Admin manage projects" ON public.projects
    FOR ALL USING (public.is_admin());

-- 10. Contact Messages
CREATE POLICY "Public insert contact_messages" ON public.contact_messages
    FOR INSERT WITH CHECK (
        length(trim(name)) > 0 AND 
        length(trim(email)) > 3 AND 
        length(trim(message)) > 0
    );
CREATE POLICY "Admin read and manage contact_messages" ON public.contact_messages
    FOR ALL USING (public.is_admin());

-- 11. Comments
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

-- 12. Tutorial Feedback
CREATE POLICY "Public insert tutorial_feedback" ON public.tutorial_feedback
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read tutorial_feedback" ON public.tutorial_feedback
    FOR SELECT USING (public.is_admin());

-- 13. Newsletter Subscribers
CREATE POLICY "Public insert newsletter_subscribers" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (length(trim(email)) > 3);
CREATE POLICY "Admin manage newsletter_subscribers" ON public.newsletter_subscribers
    FOR ALL USING (public.is_admin());

-- 14. Tutorial Views
CREATE POLICY "Public insert tutorial_views" ON public.tutorial_views
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read tutorial_views" ON public.tutorial_views
    FOR SELECT USING (public.is_admin());

-- 15. Website Settings
CREATE POLICY "Public read website_settings" ON public.website_settings
    FOR SELECT USING (true);
CREATE POLICY "Admin manage website_settings" ON public.website_settings
    FOR ALL USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 20. STORAGE BUCKETS SETUP
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('tutorial-thumbnails', 'tutorial-thumbnails', true),
    ('tutorial-images', 'tutorial-images', true),
    ('tutorial-resources', 'tutorial-resources', true),
    ('project-images', 'project-images', true),
    ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies
DROP POLICY IF EXISTS "Public can view storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete storage objects" ON storage.objects;

CREATE POLICY "Public can view storage objects" ON storage.objects
    FOR SELECT USING (
        bucket_id IN ('tutorial-thumbnails', 'tutorial-images', 'tutorial-resources', 'project-images', 'profile-images')
    );

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

-- ------------------------------------------------------------------------------
-- 21. SEED INITIAL ESSENTIAL DATA (Categories, Tags, Tutorials, Projects, Settings)
-- ------------------------------------------------------------------------------
INSERT INTO public.website_settings (setting_key, setting_value)
VALUES ('site_config', '{
    "hero_heading": "Build High-Performance Android & Web Apps",
    "hero_subheading": "In-depth tutorials on Android Development (Kotlin, Jetpack Compose), Google AdMob, Firebase, Next.js, and Modern Full Stack Architecture.",
    "announcement_banner": "🚀 New Tutorial: Master Google AdMob Monetization in Kotlin 2026!",
    "youtube_subscribers": "100K+",
    "total_views": "2.5M+"
}'::jsonb)
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

INSERT INTO public.categories (id, name, slug, description, icon) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Android Development', 'android-development', 'Native Android tutorials using Kotlin, Jetpack Compose, XML, and modern Android architecture.', 'Smartphone'),
    ('c0000000-0000-0000-0000-000000000002', 'Google AdMob', 'google-admob', 'Monetize mobile applications with Google AdMob banner, interstitial, rewarded, and native ads.', 'DollarSign'),
    ('c0000000-0000-0000-0000-000000000003', 'Firebase', 'firebase', 'Cloud Firestore, Firebase Authentication, Cloud Storage, Push Notifications and Analytics.', 'Flame'),
    ('c0000000-0000-0000-0000-000000000004', 'Flutter & Dart', 'flutter-dart', 'Cross-platform mobile apps for iOS and Android using Flutter, Dart, Bloc, and Riverpod.', 'Layers'),
    ('c0000000-0000-0000-0000-000000000005', 'Web Development', 'web-development', 'Modern web engineering with Next.js, React, TypeScript, Tailwind CSS, and Serverless backends.', 'Globe'),
    ('c0000000-0000-0000-0000-000000000006', 'Database & Backend', 'database-backend', 'Supabase PostgreSQL, REST APIs, GraphQL, authentication systems, and database optimization.', 'Database')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (id, name, slug) VALUES
    ('t0000000-0000-0000-0000-000000000001', 'Kotlin', 'kotlin'),
    ('t0000000-0000-0000-0000-000000000002', 'AdMob', 'admob'),
    ('t0000000-0000-0000-0000-000000000003', 'Banner Ads', 'banner-ads'),
    ('t0000000-0000-0000-0000-000000000004', 'Interstitial Ads', 'interstitial-ads'),
    ('t0000000-0000-0000-0000-000000000005', 'Firebase Auth', 'firebase-auth'),
    ('t0000000-0000-0000-0000-000000000006', 'Flutter', 'flutter'),
    ('t0000000-0000-0000-0000-000000000007', 'REST API', 'rest-api'),
    ('t0000000-0000-0000-0000-000000000008', 'Supabase', 'supabase'),
    ('t0000000-0000-0000-0000-000000000009', 'Jetpack Compose', 'jetpack-compose'),
    ('t0000000-0000-0000-0000-000000000010', 'Next.js', 'nextjs')
ON CONFLICT (slug) DO NOTHING;

-- Sample Tutorial 1
INSERT INTO public.tutorials (
    id, title, slug, description, content, youtube_url, thumbnail_url,
    category_id, difficulty, prerequisites, reading_time, seo_title, seo_description,
    is_featured, status, published_at
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'Complete Google AdMob Integration in Android Studio with Kotlin',
    'google-admob-android-kotlin-complete-guide',
    'Learn how to integrate Google AdMob Banner, Interstitial, and Rewarded Video Ads in modern Android apps using Kotlin with full lifecycle management.',
    '# Complete Google AdMob Integration in Android Studio with Kotlin

Monetizing your Android application with Google AdMob is one of the most effective ways to generate consistent revenue. In this complete tutorial, we cover the exact implementation steps for Banner, Interstitial, and Rewarded Ads using modern Kotlin practices.

## 1. Prerequisites and Setup
Before writing code, ensure you have:
- Android Studio Ladybug or newer
- An approved Google AdMob Account
- Minimum SDK set to 21 or higher

## 2. Adding Gradle Dependencies
Add the Google Mobile Ads SDK inside your `app/build.gradle.kts`:

```kotlin
dependencies {
    implementation("com.google.android.gms:play-services-ads:23.6.0")
}
```

## 3. Initialize the Mobile Ads SDK
In your `Application` class or main Activity `onCreate()`:

```kotlin
MobileAds.initialize(this) { initializationStatus ->
    Log.d("AdMob", "AdMob initialized successfully: $initializationStatus")
}
```

## 4. Best Practices for Maximizing eCPM
- Never place ads directly over interactive UI buttons.
- Implement adaptive banner sizing to fill screen width efficiently.
- Preload interstitial ads in background threads to eliminate display lag.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=1200',
    'c0000000-0000-0000-0000-000000000002',
    'Intermediate',
    ARRAY['Android Studio installed', 'Basic Kotlin syntax knowledge', 'Google AdMob account'],
    10,
    'Google AdMob Android Kotlin Integration Guide 2026',
    'Step-by-step tutorial for integrating Google AdMob banner, interstitial, and rewarded ads in Android apps with Kotlin.',
    TRUE,
    'published',
    NOW() - INTERVAL '2 days'
) ON CONFLICT (slug) DO NOTHING;

-- Link Tutorial 1 with Tags
INSERT INTO public.tutorial_tags (tutorial_id, tag_id) VALUES
    ('b0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001'),
    ('b0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000002'),
    ('b0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000003'),
    ('b0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- Sample Tutorial 2
INSERT INTO public.tutorials (
    id, title, slug, description, content, youtube_url, thumbnail_url,
    category_id, difficulty, prerequisites, reading_time, seo_title, seo_description,
    is_featured, status, published_at
) VALUES (
    'b0000000-0000-0000-0000-000000000002',
    'Firebase Authentication with Jetpack Compose & Clean Architecture',
    'firebase-auth-jetpack-compose-clean-architecture',
    'Build a production-ready authentication system with Firebase Auth, Jetpack Compose, Coroutines, StateFlow, and MVVM architecture.',
    '# Firebase Authentication with Jetpack Compose

Modern Android apps require clean, reactive authentication flows. This tutorial demonstrates combining Google Firebase Authentication with Jetpack Compose.

## 1. Architecture Overview
We follow Clean Architecture with three primary layers:
- **Presentation**: Jetpack Compose Composables + ViewModels
- **Domain**: Auth Use Cases and Repository interfaces
- **Data**: Firebase SDK implementations and DTO mappers

## 2. State Management with StateFlow
Use sealed interfaces for auth states:

```kotlin
sealed interface AuthState {
    object Idle : AuthState
    object Loading : AuthState
    data class Authenticated(val user: FirebaseUser) : AuthState
    data class Error(val message: String) : AuthState
}
```',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200',
    'c0000000-0000-0000-0000-000000000003',
    'Intermediate',
    ARRAY['Jetpack Compose fundamentals', 'Firebase Console setup', 'Kotlin Coroutines'],
    12,
    'Firebase Auth in Jetpack Compose Tutorial 2026',
    'Build reactive Android login and signup flows with Firebase and Jetpack Compose.',
    TRUE,
    'published',
    NOW() - INTERVAL '5 days'
) ON CONFLICT (slug) DO NOTHING;

-- Link Tutorial 2 with Tags
INSERT INTO public.tutorial_tags (tutorial_id, tag_id) VALUES
    ('b0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001'),
    ('b0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000005'),
    ('b0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000009')
ON CONFLICT DO NOTHING;

-- Sample Projects
INSERT INTO public.projects (
    id, title, slug, description, content, thumbnail_url,
    technologies, github_url, demo_url, is_featured, status
) VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'AdFlow - Smart AdMob Mediation & Monetization Optimizer',
    'adflow-admob-monetization-optimizer',
    'Open source Android SDK and manager app designed to optimize AdMob fill rates, automate adaptive banners, and track daily eCPM revenue.',
    '# AdFlow - Smart AdMob Optimizer

AdFlow provides drop-in Android utility classes that simplify Google Mobile Ads initialization, handle fallback networks, and provide automated interstitial preload mechanisms.',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200',
    ARRAY['Android', 'Kotlin', 'Google AdMob', 'Coroutines', 'Material 3'],
    'https://github.com/kartikdev/adflow',
    'https://play.google.com/store',
    TRUE,
    'published'
), (
    'd0000000-0000-0000-0000-000000000002',
    'DevPulse - Developer Portfolio & Education Platform',
    'devpulse-developer-portfolio-platform',
    'Full stack developer website built with Next.js 16, Supabase PostgreSQL, and Tailwind CSS featuring dynamic tutorials and an admin CMS.',
    '# DevPulse Platform

Complete platform enabling content creators to publish programming tutorials, code snippets, and manage community interactions with Supabase Row Level Security.',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200',
    ARRAY['Next.js', 'React', 'TypeScript', 'Supabase', 'Tailwind CSS'],
    'https://github.com/kartikdev/devpulse',
    'https://moddedteam.netlify.app',
    TRUE,
    'published'
) ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------
-- VERIFICATION SYSTEM MIGRATION
-- ----------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_badge TEXT DEFAULT 'Developer';

ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ DEFAULT NOW();

-- Auto-verify owner / admin profiles
UPDATE public.profiles
SET is_verified = TRUE, verified_at = NOW(), verification_badge = 'Lead Engineer'
WHERE email IN ('kartiksharma20081186@gmail.com', 'admin@kartik.dev') OR role IN ('admin', 'owner');

-- Auto-verify published tutorials
UPDATE public.tutorials
SET is_verified = TRUE, verified_at = NOW()
WHERE status = 'published';

-- Output confirmation
SELECT 'SUPABASE DATABASE SETUP & VERIFICATION SYSTEM COMPLETED SUCCESSFULLY!' AS status;

