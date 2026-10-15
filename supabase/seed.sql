-- ==============================================================================
-- SEED DATA FOR DEVELOPER PORTFOLIO + YOUTUBE TUTORIAL PLATFORM
-- Execute this script in your Supabase SQL Editor after running schema.sql
-- ==============================================================================

-- 1. Insert Profile
INSERT INTO public.profiles (
    id,
    display_name,
    username,
    bio,
    avatar_url,
    skills,
    social_links
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Kartik Sharma',
    'kartik',
    'Senior Android & Full Stack Developer with 5+ years of experience building scalable mobile apps, modern web platforms, and producing high-impact programming tutorials for 100K+ developers worldwide.',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
    ARRAY['Android Development', 'Kotlin', 'Java', 'Flutter', 'Dart', 'Next.js 14', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Firebase', 'Google AdMob', 'REST APIs', 'PostgreSQL', 'Docker'],
    '{
        "youtube": "https://youtube.com/@kartikdev",
        "github": "https://github.com/kartikdev",
        "linkedin": "https://linkedin.com/in/kartikdev",
        "twitter": "https://twitter.com/kartikdev",
        "email": "kartik@example.com"
    }'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio,
    skills = EXCLUDED.skills,
    social_links = EXCLUDED.social_links;

-- 2. Insert Categories
INSERT INTO public.categories (id, name, slug, description, icon) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Android Development', 'android-development', 'Native Android tutorials using Kotlin, Jetpack Compose, XML, and modern Android architecture.', 'Smartphone'),
    ('c0000000-0000-0000-0000-000000000002', 'Google AdMob', 'google-admob', 'Monetize mobile applications with Google AdMob banner, interstitial, rewarded, and native ads.', 'DollarSign'),
    ('c0000000-0000-0000-0000-000000000003', 'Firebase', 'firebase', 'Cloud Firestore, Firebase Authentication, Cloud Storage, Push Notifications and Analytics.', 'Flame'),
    ('c0000000-0000-0000-0000-000000000004', 'Flutter & Dart', 'flutter-dart', 'Cross-platform mobile apps for iOS and Android using Flutter, Dart, Bloc, and Riverpod.', 'Layers'),
    ('c0000000-0000-0000-0000-000000000005', 'Web Development', 'web-development', 'Modern web engineering with Next.js, React, TypeScript, Tailwind CSS, and Serverless backends.', 'Globe'),
    ('c0000000-0000-0000-0000-000000000006', 'Database & Backend', 'database-backend', 'Supabase PostgreSQL, REST APIs, GraphQL, authentication systems, and database optimization.', 'Database')
ON CONFLICT (slug) DO NOTHING;

-- 3. Insert Tags
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

-- 4. Insert Tutorials
-- Tutorial 1: AdMob Android
INSERT INTO public.tutorials (
    id,
    title,
    slug,
    description,
    content,
    youtube_url,
    thumbnail_url,
    category_id,
    difficulty,
    prerequisites,
    reading_time,
    seo_title,
    seo_description,
    is_featured,
    status,
    published_at
) VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'How to Implement Google AdMob in Android (Kotlin Guide)',
    'how-to-implement-google-admob-in-android',
    'A comprehensive, step-by-step guide to integrating the Google Mobile Ads SDK into your Android application using Kotlin. Includes manifest configuration, SDK initialization, and test device setup.',
    E'# How to Implement Google AdMob in Android\n\nGoogle AdMob is one of the most reliable and highest-paying mobile advertisement networks for Android developers. In this complete tutorial, we will configure the Google Mobile Ads SDK from scratch, configure application permissions, initialize the SDK safely on a background thread, and verify our setup using official Google Test Ad Unit IDs.\n\n## 1. Prerequisites\n- Android Studio Iguana or newer.\n- Android SDK 21 (Lollipop) or higher.\n- A Google AdMob account (or you can use Google Test IDs while developing).\n\n## 2. Add Gradle Dependencies\nOpen your app-level `build.gradle.kts` and include the latest Google Mobile Ads SDK dependency:\n\n```kotlin\ndependencies {\n    implementation("com.google.android.gms:play-services-ads:23.0.0")\n}\n```\n\nSync your project with Gradle files.\n\n## 3. Configure AndroidManifest.xml\nAdd your AdMob App ID inside the `<application>` tag of `AndroidManifest.xml`:\n\n```xml\n<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n    <uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />\n\n    <application>\n        <!-- Sample AdMob App ID: replace with your real ID in production -->\n        <meta-data\n            android:name="com.google.android.gms.ads.APPLICATION_ID"\n            android:value="ca-app-pub-3940256099942544~3347511713"/>\n    </application>\n</manifest>\n```\n\n## 4. Initialize the Mobile Ads SDK\nIn your `MainActivity.kt` or custom `Application` class, initialize the Mobile Ads SDK before requesting any ads:\n\n```kotlin\nimport com.google.android.gms.ads.MobileAds\nimport kotlinx.coroutines.CoroutineScope\nimport kotlinx.coroutines.Dispatchers\nimport kotlinx.coroutines.launch\n\nclass MainActivity : AppCompatActivity() {\n    override fun onCreate(savedInstanceState: Bundle?) {\n        super.onCreate(savedInstanceState)\n        setContentView(R.layout.activity_main)\n\n        // Initialize SDK asynchronously\n        CoroutineScope(Dispatchers.IO).launch {\n            MobileAds.initialize(this@MainActivity) { initializationStatus ->\n                // Initialization complete callback\n            }\n        }\n    }\n}\n```\n\n## 5. Troubleshooting & Best Practices\n- **Never click your own live ads**: Always configure test device IDs when developing to prevent account suspension.\n- **Keep SDK up to date**: Google regularly updates privacy policies and target SDK requirements.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?auto=format&fit=crop&q=80&w=1200',
    'c0000000-0000-0000-0000-000000000002',
    'Beginner',
    ARRAY['Android Studio installed', 'Basic Kotlin syntax', 'Gradle build configuration knowledge'],
    7,
    'How to Implement Google AdMob in Android - Complete Kotlin Tutorial',
    'Step by step developer guide to integrate Google Mobile Ads SDK in Android with Kotlin. Learn manifest setup, test IDs, and initialization.',
    TRUE,
    'published',
    NOW() - INTERVAL '5 days'
) ON CONFLICT (slug) DO NOTHING;

-- Tutorial 2: Banner and Interstitial Ads
INSERT INTO public.tutorials (
    id,
    title,
    slug,
    description,
    content,
    youtube_url,
    thumbnail_url,
    category_id,
    difficulty,
    prerequisites,
    reading_time,
    seo_title,
    seo_description,
    is_featured,
    status,
    published_at
) VALUES (
    'e0000000-0000-0000-0000-000000000002',
    'How to Integrate Banner and Interstitial Ads in Android',
    'how-to-integrate-banner-and-interstitial-ads',
    'Master both Banner and Full-Screen Interstitial Ad formats in Kotlin. Includes adaptive banner sizing, lifecycle management, and preloading strategies.',
    E'# How to Integrate Banner and Interstitial Ads in Android\n\nBanner ads occupy a spot within an app layout, while interstitial ads are full-screen ads that cover the interface of their host app at natural transition points.\n\n## 1. Adding an Adaptive Banner Ad\nIn your XML layout:\n```xml\n<com.google.android.gms.ads.AdView\n    xmlns:ads="http://schemas.android.com/apk/res-auto"\n    android:id="@+id/adView"\n    android:layout_width="match_parent"\n    android:layout_height="wrap_content"\n    android:layout_alignParentBottom="true"\n    ads:adSize="BANNER"\n    ads:adUnitId="ca-app-pub-3940256099942544/6300978111" />\n```\n\nIn Kotlin:\n```kotlin\nval adView = findViewById<AdView>(R.id.adView)\nval adRequest = AdRequest.Builder().build()\nadView.loadAd(adRequest)\n```\n\n## 2. Preloading Interstitial Ads\nInterstitial ads should always be preloaded before the user triggers a transition:\n\n```kotlin\nprivate var mInterstitialAd: InterstitialAd? = null\n\nfun loadInterstitial() {\n    val adRequest = AdRequest.Builder().build()\n    InterstitialAd.load(this, "ca-app-pub-3940256099942544/1033173712", adRequest, \n        object : InterstitialAdLoadCallback() {\n            override fun onAdLoaded(interstitialAd: InterstitialAd) {\n                mInterstitialAd = interstitialAd\n            }\n            override fun onAdFailedToLoad(loadAdError: LoadAdError) {\n                mInterstitialAd = null\n            }\n        })\n}\n```\n\n## 3. Showing the Interstitial Ad\nWhen the user finishes a level or clicks a milestone button:\n```kotlin\nif (mInterstitialAd != null) {\n    mInterstitialAd?.show(this)\n} else {\n    // Proceed directly without waiting\n}\n```',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200',
    'c0000000-0000-0000-0000-000000000002',
    'Intermediate',
    ARRAY['Google Mobile Ads SDK Initialized', 'Basic Activity Lifecycle understanding'],
    9,
    'Google AdMob Banner & Interstitial Ads Integration in Android Kotlin',
    'Complete code and guide to loading Adaptive Banner Ads and preloading full-screen Interstitial Ads in Android apps.',
    TRUE,
    'published',
    NOW() - INTERVAL '3 days'
) ON CONFLICT (slug) DO NOTHING;

-- Tutorial 3: Firebase Authentication
INSERT INTO public.tutorials (
    id,
    title,
    slug,
    description,
    content,
    youtube_url,
    thumbnail_url,
    category_id,
    difficulty,
    prerequisites,
    reading_time,
    seo_title,
    seo_description,
    is_featured,
    status,
    published_at
) VALUES (
    'e0000000-0000-0000-0000-000000000003',
    'How to Implement Firebase Authentication with Email & Google Sign-In',
    'how-to-implement-firebase-authentication',
    'Secure user authentication in Android with Firebase Auth. Implement Email/Password login, Google Sign-In with Credential Manager, password resets, and session recovery.',
    E'# How to Implement Firebase Authentication\n\nUser identity is the backbone of personalized mobile apps. In this guide, we explore Firebase Authentication using modern Android Jetpack practices.\n\n## 1. Firebase Project Setup\n1. Go to Firebase Console and create a project.\n2. Add your Android package name and SHA-1 fingerprint.\n3. Download `google-services.json` and place it in the `app/` folder.\n\n## 2. Dependencies\nAdd the Firebase BoM in `build.gradle.kts`:\n```kotlin\nimplementation(platform("com.google.firebase:firebase-bom:33.1.0"))\nimplementation("com.google.firebase:firebase-auth-ktx")\n```\n\n## 3. Registering a New User\n```kotlin\nval auth = FirebaseAuth.getInstance()\nauth.createUserWithEmailAndPassword(email, password)\n    .addOnCompleteListener(this) { task ->\n        if (task.isSuccessful) {\n            val user = auth.currentUser\n            // Navigate to Dashboard\n        } else {\n            Toast.makeText(baseContext, "Authentication failed: ${task.exception?.message}", Toast.LENGTH_SHORT).show()\n        }\n    }\n```',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200',
    'c0000000-0000-0000-0000-000000000003',
    'Intermediate',
    ARRAY['Firebase Console account', 'Basic Kotlin Coroutines'],
    10,
    'Firebase Authentication in Android Kotlin - Complete Implementation',
    'Step-by-step tutorial on implementing Firebase Email and Password login and Google Sign-in on Android with Kotlin.',
    FALSE,
    'published',
    NOW() - INTERVAL '2 days'
) ON CONFLICT (slug) DO NOTHING;

-- Tutorial 4: Flutter REST API
INSERT INTO public.tutorials (
    id,
    title,
    slug,
    description,
    content,
    youtube_url,
    thumbnail_url,
    category_id,
    difficulty,
    prerequisites,
    reading_time,
    seo_title,
    seo_description,
    is_featured,
    status,
    published_at
) VALUES (
    'e0000000-0000-0000-0000-000000000004',
    'How to Integrate REST APIs in Flutter with Dio & Freezed',
    'how-to-integrate-rest-apis-in-flutter',
    'Build a robust networking layer in Flutter using Dio for HTTP requests, Freezed for type-safe models, interceptors for auth tokens, and error handling.',
    E'# How to Integrate REST APIs in Flutter\n\nConsuming remote APIs safely with proper caching, deserialization, and error handling is critical for any production Flutter application.\n\n## 1. Add Dependencies in `pubspec.yaml`\n```yaml\ndependencies:\n  flutter:\n    sdk: flutter\n  dio: ^5.4.3+1\n  freezed_annotation: ^2.4.1\n  json_annotation: ^4.9.0\n\ndev_dependencies:\n  build_runner: ^2.4.9\n  freezed: ^2.5.2\n  json_serializable: ^6.8.0\n```\n\n## 2. Create the API Client\n```dart\nclass ApiClient {\n  final Dio _dio = Dio(\n    BaseOptions(\n      baseUrl: "https://api.example.com/v1",\n      connectTimeout: const Duration(seconds: 10),\n      receiveTimeout: const Duration(seconds: 10),\n    ),\n  );\n\n  Future<Response> get(String path) async {\n    try {\n      return await _dio.get(path);\n    } on DioException catch (e) {\n      throw Exception("Network error: ${e.message}");\n    }\n  }\n}\n```',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200',
    'c0000000-0000-0000-0000-000000000004',
    'Intermediate',
    ARRAY['Flutter SDK 3.19+', 'Dart Object-Oriented Programming'],
    8,
    'Integrate REST APIs in Flutter with Dio - Clean Architecture Tutorial',
    'Learn how to architect clean REST API integration in Flutter with Dio, JSON parsing, error boundaries, and interceptors.',
    FALSE,
    'published',
    NOW() - INTERVAL '1 day'
) ON CONFLICT (slug) DO NOTHING;

-- Tutorial 5: Flutter + Supabase
INSERT INTO public.tutorials (
    id,
    title,
    slug,
    description,
    content,
    youtube_url,
    thumbnail_url,
    category_id,
    difficulty,
    prerequisites,
    reading_time,
    seo_title,
    seo_description,
    is_featured,
    status,
    published_at
) VALUES (
    'e0000000-0000-0000-0000-000000000005',
    'How to Connect a Flutter Application to Supabase',
    'how-to-connect-a-flutter-application-to-supabase',
    'Complete guide on integrating Supabase with Flutter for real-time PostgreSQL subscriptions, OAuth authentication, row-level security, and file uploads.',
    E'# How to Connect a Flutter Application to Supabase\n\nSupabase is an open source Firebase alternative offering a full Postgres database with real-time subscriptions, authentication, instant APIs, and storage.\n\n## 1. Installation\n```yaml\ndependencies:\n  supabase_flutter: ^2.5.4\n```\n\n## 2. Initialize in `main.dart`\n```dart\nimport \'package:flutter/material.dart\';\nimport \'package:supabase_flutter/supabase_flutter.dart\';\n\nFuture<void> main() async {\n  WidgetsFlutterBinding.ensureInitialized();\n\n  await Supabase.initialize(\n    url: \'https://your-project.supabase.co\',\n    anonKey: \'your-anon-key\',\n  );\n\n  runApp(const MyApp());\n}\n\nfinal supabase = Supabase.instance.client;\n```\n\n## 3. Real-Time Stream\n```dart\nfinal stream = supabase.from(\'messages\').stream(primaryKey: [\'id\']);\n```',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1200',
    'c0000000-0000-0000-0000-000000000006',
    'All Levels',
    ARRAY['Flutter installed', 'Supabase account and project URL'],
    11,
    'Connect Flutter to Supabase - Full Realtime & Auth Tutorial',
    'Learn how to integrate Supabase into Flutter apps for authentication, real-time database querying, and file storage.',
    TRUE,
    'published',
    NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 5. Link Tutorial Tags
INSERT INTO public.tutorial_tags (tutorial_id, tag_id) VALUES
    ('e0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001'), -- Kotlin
    ('e0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000002'), -- AdMob
    ('e0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000002'), -- AdMob
    ('e0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000003'), -- Banner Ads
    ('e0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000004'), -- Interstitial Ads
    ('e0000000-0000-0000-0000-000000000003', 't0000000-0000-0000-0000-000000000005'), -- Firebase Auth
    ('e0000000-0000-0000-0000-000000000004', 't0000000-0000-0000-0000-000000000006'), -- Flutter
    ('e0000000-0000-0000-0000-000000000004', 't0000000-0000-0000-0000-000000000007'), -- REST API
    ('e0000000-0000-0000-0000-000000000005', 't0000000-0000-0000-0000-000000000006'), -- Flutter
    ('e0000000-0000-0000-0000-000000000005', 't0000000-0000-0000-0000-000000000008')  -- Supabase
ON CONFLICT DO NOTHING;

-- 6. Insert Code Snippets
INSERT INTO public.code_snippets (id, tutorial_id, title, language, code, explanation, sort_order) VALUES
    ('s0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'build.gradle.kts Dependencies', 'kotlin', 'dependencies {\n    implementation("com.google.android.gms:play-services-ads:23.0.0")\n}', 'Adds the official Google Mobile Ads SDK to your Android project.', 1),
    ('s0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'AndroidManifest.xml Configuration', 'xml', '<meta-data\n    android:name="com.google.android.gms.ads.APPLICATION_ID"\n    android:value="ca-app-pub-3940256099942544~3347511713"/>', 'Configures the required Google AdMob App ID in your Android Manifest.', 2),
    ('s0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000002', 'Adaptive Banner Load in Activity', 'kotlin', 'val adView = findViewById<AdView>(R.id.adView)\nval adRequest = AdRequest.Builder().build()\nadView.loadAd(adRequest)', 'Requests and displays an adaptive banner advertisement.', 1),
    ('s0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000005', 'Supabase Initialization in Flutter', 'dart', 'await Supabase.initialize(\n  url: "https://your-project.supabase.co",\n  anonKey: "your-anon-key",\n);', 'Initializes the Supabase client at application startup.', 1)
ON CONFLICT DO NOTHING;

-- 7. Insert Tutorial Resources
INSERT INTO public.tutorial_resources (id, tutorial_id, title, file_url, resource_type) VALUES
    ('r0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'AdMob Android Starter Project (ZIP)', 'https://github.com/kartikdev/admob-android-sample/archive/refs/heads/main.zip', 'zip'),
    ('r0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'Banner & Interstitial Complete Source', 'https://github.com/kartikdev/android-ads-complete', 'github')
ON CONFLICT DO NOTHING;

-- 8. Insert Projects
INSERT INTO public.projects (
    id,
    title,
    slug,
    description,
    content,
    thumbnail_url,
    technologies,
    github_url,
    demo_url,
    is_featured,
    status
) VALUES
    ('p0000000-0000-0000-0000-000000000001', 'PulseStream - Realtime Analytics & Monetization Hub', 'pulsestream-analytics-hub', 'A full-stack analytics suite designed for mobile app developers to track ad impressions, eCPM, and user engagement metrics in real time.', 'Detailed walkthrough of how PulseStream connects to Firebase, AdMob Reporting API, and displays live charts using Next.js and ChartJS.', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=1200', ARRAY['Android', 'Kotlin', 'Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS'], 'https://github.com/kartikdev/pulsestream', 'https://pulsestream-demo.vercel.app', TRUE, 'published'),
    ('p0000000-0000-0000-0000-000000000002', 'FitTrack Pro - AI Fitness & Workout Planner', 'fittrack-pro-ai-fitness', 'An Android & Flutter fitness tracking application with custom workout generators, calorie counters, and offline SQLite synchronization.', 'Architected with clean MVVM pattern, Jetpack Room, and Coroutines.', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1200', ARRAY['Flutter', 'Dart', 'Firebase', 'Clean Architecture', 'Bloc'], 'https://github.com/kartikdev/fittrack-pro', 'https://fittrack-demo.vercel.app', TRUE, 'published'),
    ('p0000000-0000-0000-0000-000000000003', 'CryptoVault - Decentralized Mobile Wallet', 'cryptovault-mobile-wallet', 'High-security multi-chain crypto wallet with biometric authentication, hardware security module integration, and token swap aggregator.', 'Features biometric key derivation, AES-256 encryption, and instant balance synchronization.', 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=1200', ARRAY['Kotlin', 'Android Jetpack', 'Biometrics', 'Web3j', 'Coroutines'], 'https://github.com/kartikdev/cryptovault', 'https://cryptovault-demo.vercel.app', TRUE, 'published')
ON CONFLICT (slug) DO NOTHING;

-- 9. Insert Website Settings
INSERT INTO public.website_settings (id, setting_key, setting_value) VALUES
    ('w0000000-0000-0000-0000-000000000001', 'site_config', '{
        "title": "Kartik Sharma | Developer & Educator",
        "tagline": "Building High-Impact Mobile Apps & Educating 100K+ Developers",
        "hero_heading": "Crafting High-Performance Apps & Teaching Modern Tech",
        "hero_subheading": "Explore production-grade Android, Flutter, and Full-Stack tutorials with complete source code, video walk-throughs, and step-by-step documentation.",
        "announcement_banner": "🚀 New AdMob & Android 14 Masterclass video is now live!",
        "youtube_subscribers": "125,000+",
        "total_views": "4.8M+"
    }'::jsonb)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value;

-- 10. Helper script for bootstrapping the first administrator:
-- To make a registered user an administrator, run:
-- INSERT INTO public.admin_users (user_id, role) VALUES ('<YOUR-USER-UUID-FROM-AUTH.USERS>', 'admin') ON CONFLICT DO NOTHING;
