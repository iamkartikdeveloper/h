# 🚀 Kartik Sharma — Developer Portfolio & YouTube Tutorial Platform

A production-ready, full-stack Developer Portfolio, YouTube Educational Platform, and Admin Content Management Dashboard built with **Next.js 14/16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL, Auth, Storage, and Row Level Security)**.

---

## 🌟 Key Features

### 💻 Public Website
- **Home Page**: Hero section with profile photo, dynamic tagline, real-time statistics (YouTube subscribers, views), core tech stack badges, latest tutorials, topic explorer, featured projects, and newsletter subscription.
- **Tutorials Library (`/tutorials`)**: Interactive search bar with debounce, category tabs, difficulty filter, latest/in-depth sorting, and suggested search tags (`AdMob`, `Banner Ads`, `Firebase`, `Flutter`, `Kotlin`).
- **Individual Tutorial Detail Page (`/tutorials/[slug]`)**:
  - SEO-friendly URL slug.
  - Responsive 16:9 YouTube video player with poster fallback and direct YouTube shortcut.
  - Sticky Table of Contents (desktop) & collapsible contents drawer (mobile) with active scroll spy.
  - Full step-by-step markdown documentation.
  - Syntax-highlighted code blocks with language badges, line numbers, and 1-click **Copy Code** button.
  - Standalone Code Snippets section with explanations.
  - Downloadable resources (starter ZIP files, GitHub links).
  - Helpfulness feedback voting (*"Was this tutorial helpful? Yes / No"*).
  - Moderated community comments section with anti-bot honeypot protection.
  - Dynamic Open Graph metadata and `TechArticle` JSON-LD structured data.
- **Projects Portfolio (`/projects` & `/projects/[slug]`)**: Case study portfolio showcasing mobile apps and open source systems with screenshots, tech badges, live demo, and GitHub links.
- **About Page (`/about`)**: Developer bio, technical skills matrix, professional career timeline, and social links.
- **Contact Page (`/contact`)**: Validated contact form with anti-bot honeypot, response guarantee, direct contact info, and persistence in Supabase `contact_messages`.
- **Search System (`/api/search`)**: Real Supabase search across tutorial titles, descriptions, and content.
- **Dynamic SEO**: `sitemap.xml` and `robots.txt` automatically generated from database records.

---

### 🛡️ Protected Admin Dashboard (`/admin`)
- **Supabase Authentication**: Secured via Supabase Auth with server & database level verification against `admin_users` table.
- **Dashboard Overview (`/admin`)**: Authentic, non-fabricated metrics (Total Tutorials, Published vs Draft counts, Projects count, Unread Inquiries, Pending Comments, Verified Subscribers).
- **Tutorial Management (`/admin/tutorials`)**: Full CRUD table, instant Publish/Unpublish toggle, preview links, and permanent delete with confirmation.
- **Tutorial Creator & Editor (`/admin/tutorials/new` & `/admin/tutorials/[id]/edit`)**:
  - Title & auto-generating SEO slug with collision detection.
  - Live Preview tab (switch between Markdown editor and rendered preview).
  - YouTube URL input with auto-extraction of Video ID and high-res thumbnail.
  - Category and difficulty selector (Beginner, Intermediate, Advanced, All Levels).
  - Code Snippets builder (Language, Title, Code, Explanation).
  - Downloadable Resources builder (ZIP, GitHub, PDF, Link).
  - Prerequisites and reading time estimator.
- **Projects Manager (`/admin/projects`)**: Full project CRUD with live demo and GitHub repository links.
- **Categories & Tags (`/admin/categories`)**: Manage programming categories and tag pills.
- **Comment Moderation (`/admin/comments`)**: Review queue to approve, reject, or delete visitor comments.
- **Contact Messages (`/admin/messages`)**: View incoming inquiries, mark read/unread, and reply via mailto.
- **Subscribers (`/admin/subscribers`)**: Audience viewer with 1-click CSV export for email tools.
- **Settings & Profile (`/admin/settings`)**: Update developer display name, bio, avatar, skills, social profiles, and homepage announcement banner.

---

## 🗄️ Supabase Database Architecture

The complete database schema with Row Level Security (RLS) is located at:
- **`supabase/schema.sql`**: Full schema, table definitions, foreign keys, triggers, indexes, RLS policies, and storage bucket configuration.
- **`supabase/seed.sql`**: Sample tutorials (Google AdMob in Android, Banner & Interstitial Ads, Firebase Authentication, Flutter REST APIs, Flutter + Supabase), categories, tags, projects, and website settings.

### Database Tables:
1. `profiles`: Developer identity, bio, avatar, skills array, social links JSON.
2. `admin_users`: Maps authorized administrator user IDs from `auth.users`.
3. `categories`: Tutorial categories (`android-development`, `google-admob`, `firebase`, etc.).
4. `tags`: Technology tags (`kotlin`, `admob`, `flutter`, `supabase`, etc.).
5. `tutorials`: Complete tutorial documentation, video URLs, slugs, metadata, and status (`draft`/`published`).
6. `tutorial_tags`: Junction table linking tutorials to tags.
7. `code_snippets`: Code files with language, title, code, and explanations.
8. `tutorial_resources`: Downloadable ZIP packages, PDFs, and repository links.
9. `projects`: Portfolio case studies and open-source applications.
10. `contact_messages`: Inquiries sent through the contact form with unread/read/replied status.
11. `comments`: Community comments with moderation status (`pending`/`approved`/`rejected`).
12. `tutorial_feedback`: Helpfulness votes (`is_helpful` boolean).
13. `newsletter_subscribers`: Verified subscriber email list.
14. `tutorial_views`: Authentic timestamped view events for analytics.
15. `website_settings`: Configurable site title, hero headings, announcement banner, and statistics.

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v18.x or v20.x+
- **npm** or **pnpm**
- A **Supabase** account with a project

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Ensure your Supabase project credentials are set in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://hfsflkizdbgkauebjamu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sbpublishablePEPd8cdTE5EKExCf1GzdAA_YX4Vop6D
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sbpublishablePEPd8cdTE5EKExCf1GzdAA_YX4Vop6D
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run Database Migrations in Supabase
1. Open your **Supabase Dashboard** (`https://supabase.com/dashboard/project/hfsflkizdbgkauebjamu`).
2. Go to the **SQL Editor** on the left menu.
3. Open `supabase/schema.sql`, copy all contents, paste into the SQL Editor, and click **Run**.
4. Open `supabase/seed.sql`, paste into the SQL Editor, and click **Run**.

### 4. Create Your Administrator Account
1. In your Supabase Dashboard, go to **Authentication > Users** and click **Add User > Create User**.
2. Enter your desired administrator email and password (e.g. `admin@kartikdev.com`).
3. Copy the generated **User UID** (UUID).
4. Go to the **SQL Editor** and execute:
   ```sql
   INSERT INTO public.admin_users (user_id, role)
   VALUES ('YOUR-USER-UUID-HERE', 'admin')
   ON CONFLICT (user_id) DO NOTHING;
   ```
5. You can now log into `/admin/login` using this email and password!

### 5. Install Dependencies & Start Dev Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Production Deployment to Vercel

1. Push your code to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "feat: complete developer portfolio and youtube tutorial platform"
   git remote add origin https://github.com/your-username/kartik-portfolio-platform.git
   git push -u origin main
   ```
2. Import the project into **Vercel** (`https://vercel.com/new`).
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (e.g. `https://your-domain.vercel.app`)
4. Click **Deploy**. Vercel will build and serve your production website with global edge caching and automatic SSL!

---

## 🔒 Security & Row Level Security (RLS)

- **RLS is strictly enforced on every table**:
  - Public visitors can only query published tutorials, published projects, and approved comments.
  - Public visitors can insert contact messages, comments (marked `pending`), feedback votes, and newsletter subscriptions.
  - Private administrative records (unread contact messages, subscribers list, drafts, moderation queues) are strictly inaccessible to unauthenticated visitors.
  - Administrative mutations (`INSERT`, `UPDATE`, `DELETE`) require verification via the `public.is_admin()` database security definer function.
- **Never expose service role secrets**: The application only uses the publishable client key on the frontend.

---

## 📁 Project Structure

```
├── public/                 # Static assets, favicon, icons
├── src/
│   ├── app/
│   │   ├── (public pages)
│   │   │   ├── layout.tsx         # Root layout with SEO & Navbar/Footer
│   │   │   ├── page.tsx           # Home page
│   │   │   ├── about/page.tsx     # Developer journey & skills
│   │   │   ├── projects/          # Portfolio showcase & case study detail
│   │   │   ├── tutorials/         # Searchable tutorial library & detail
│   │   │   ├── contact/page.tsx   # Contact form with honeypot
│   │   │   ├── sitemap.ts         # Dynamic XML sitemap
│   │   │   └── robots.ts          # Robots crawler configuration
│   │   ├── admin/
│   │   │   ├── layout.tsx         # Auth guard & admin navigation
│   │   │   ├── login/page.tsx     # Admin Supabase login
│   │   │   ├── page.tsx           # Real-time analytics overview
│   │   │   ├── tutorials/         # Full CRUD & Live Preview editor
│   │   │   ├── projects/          # Project manager
│   │   │   ├── categories/        # Categories & tags manager
│   │   │   ├── comments/          # Comment moderation queue
│   │   │   ├── messages/          # Contact messages viewer
│   │   │   ├── subscribers/       # Newsletter audience & CSV export
│   │   │   └── settings/          # Profile & website settings editor
│   │   └── api/
│   │       ├── search/route.ts    # Debounced Supabase tutorial search
│   │       ├── contact/route.ts   # Contact message submit endpoint
│   │       └── views/route.ts     # Authentic tutorial view logging
│   ├── components/
│   │   ├── ui/                    # Button, Input, Textarea, Badge, CodeBlock, YouTubeEmbed, Icons
│   │   └── public/                # Navbar, Footer, TableOfContents, MarkdownRenderer, CommentSection, FeedbackVote
│   ├── lib/
│   │   ├── supabase/              # Browser client & Server client singletons
│   │   └── utils/                 # YouTube parser, slugify, reading time, cn class merger
│   └── types/
│       └── database.ts            # Supabase TypeScript schema interfaces
├── supabase/
│   ├── schema.sql                 # Complete PostgreSQL schema & RLS policies
│   └── seed.sql                   # Sample tutorials, projects, and bootstrap script
├── .env.example                   # Template environment variables
└── README.md
```
