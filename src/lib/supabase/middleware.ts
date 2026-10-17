import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXTPUBLICSUPABASE_URL ||
    'https://igrritzxmfjymshjdphy.supabase.co';

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXTPUBLICSUPABASEPUBLISHABLEKEY ||
    'sb_publishable_sJj6tpWldPBL8GDtJUtYLA_NQ9G9jXf';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Use getUser() to cryptographically verify auth state
  let user = null;
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch {
    // If Supabase is unreachable or session invalid
    user = null;
  }

  const pathname = request.nextUrl.pathname;

  // 1. ADMIN ROUTES PROTECTION (/admin/*)
  if (pathname.startsWith('/admin')) {
    // Admin login page handler
    if (pathname === '/admin/login') {
      if (user) {
        // Check role
        let role = 'user';
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          if (profile?.role) role = profile.role;
          if (role !== 'admin' && role !== 'owner') {
            const { data: adminRecord } = await supabase
              .from('admin_users')
              .select('role')
              .eq('user_id', user.id)
              .maybeSingle();
            if (adminRecord) role = 'admin';
          }
        } catch {}

        if (role === 'admin' || role === 'owner') {
          // Authorized admin/owner -> redirect to admin dashboard
          const url = request.nextUrl.clone();
          url.pathname = '/admin';
          return NextResponse.redirect(url);
        } else {
          // Normal user -> redirect to home page
          const url = request.nextUrl.clone();
          url.pathname = '/';
          return NextResponse.redirect(url);
        }
      }
      // Unauthenticated -> allow access to admin login page
      return supabaseResponse;
    }

    // Protected admin dashboard & subpages (/admin, /admin/tutorials, /admin/projects, etc.)
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    // Check user's role in public.profiles with fallback to admin_users
    let role = 'user';
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.role) role = profile.role;
      if (role !== 'admin' && role !== 'owner') {
        const { data: adminRecord } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        if (adminRecord) role = 'admin';
      }
    } catch {}

    // Strict rule: ONLY 'admin' or 'owner' can access admin dashboard
    if (role !== 'admin' && role !== 'owner') {
      // Normal 'user' is redirected directly to home page
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  // 2. USER PROFILE ROUTE PROTECTION (/profile)
  if (pathname.startsWith('/profile')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // 3. PUBLIC AUTH PAGES (/login, /signup)
  if (pathname === '/login' || pathname === '/signup') {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = '/profile';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  return supabaseResponse;
}
