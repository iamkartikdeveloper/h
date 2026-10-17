import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isUserAdminOrOwner } from '@/lib/auth-helpers';

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

  // Helper to create a redirect that preserves any refreshed session cookies
  const createRedirectResponse = (url: URL) => {
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  // Cryptographically verify auth state via Supabase Auth
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
    // Admin login page handler (/admin/login)
    if (pathname === '/admin/login') {
      if (user) {
        // Determine role via admin helper, profiles table, and admin_users table
        let authorized = isUserAdminOrOwner(user.email);

        if (!authorized) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .maybeSingle();

            if (profile?.role === 'admin' || profile?.role === 'owner') {
              authorized = true;
            }
          } catch {}
        }

        if (!authorized) {
          try {
            const { data: adminRecord } = await supabase
              .from('admin_users')
              .select('role')
              .eq('user_id', user.id)
              .maybeSingle();

            if (adminRecord) {
              authorized = true;
            }
          } catch {}
        }

        if (authorized) {
          // Authorized admin/owner -> redirect to admin dashboard
          const url = request.nextUrl.clone();
          url.pathname = '/admin';
          return createRedirectResponse(url);
        } else {
          // Normal user -> redirect to profile page
          const url = request.nextUrl.clone();
          url.pathname = '/profile';
          return createRedirectResponse(url);
        }
      }

      // Unauthenticated -> allow access to admin login page
      return supabaseResponse;
    }

    // Protected admin dashboard & subpages (/admin, /admin/tutorials, /admin/projects, etc.)
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return createRedirectResponse(url);
    }

    // Verify admin or owner authorization
    let authorized = isUserAdminOrOwner(user.email);

    if (!authorized) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.role === 'admin' || profile?.role === 'owner') {
          authorized = true;
        }
      } catch {}
    }

    if (!authorized) {
      try {
        const { data: adminRecord } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminRecord) {
          authorized = true;
        }
      } catch {}
    }

    // Only authorized admin or owner can access admin dashboard
    if (!authorized) {
      // Normal 'user' is redirected safely to their profile page
      const url = request.nextUrl.clone();
      url.pathname = '/profile';
      return createRedirectResponse(url);
    }

    return supabaseResponse;
  }

  // 2. USER PROFILE ROUTE PROTECTION (/profile)
  if (pathname.startsWith('/profile')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return createRedirectResponse(url);
    }
    return supabaseResponse;
  }

  // 3. PUBLIC AUTH PAGES (/login, /signup)
  if (pathname === '/login' || pathname === '/signup') {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = '/profile';
      return createRedirectResponse(url);
    }
    return supabaseResponse;
  }

  return supabaseResponse;
}
