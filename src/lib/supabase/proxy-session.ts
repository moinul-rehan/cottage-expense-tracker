import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshes the session cookie if needed. Required so Server Components
  // reading cookies() get an up-to-date session.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // The marketing landing page, the privacy policy, and the password-reset
  // page are reachable regardless of auth state - reset-password in
  // particular because completing a reset link creates a short-lived
  // recovery session, which would otherwise get bounced straight to
  // /dashboard before the user can set their new password.
  // /platform-admin/login is its own, separate auth flow (a plain email
  // allowlist, not a cottage role) -- always reachable regardless of
  // whether the visitor already has an unrelated Cottage session, so
  // signing into a different (allowed) account there never gets caught by
  // the guest-only redirect below and bounced back to Cottage's own login.
  const alwaysAccessible =
    pathname === '/' ||
    pathname === '/privacy' ||
    pathname.startsWith('/reset-password') ||
    pathname === '/platform-admin/login'

  const guestOnlyPrefixes = ['/login', '/signup', '/forgot-password', '/auth/callback']
  const isGuestOnlyRoute = guestOnlyPrefixes.some((prefix) => pathname.startsWith(prefix))

  if (alwaysAccessible) {
    return response
  }

  if (!user && !isGuestOnlyRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isGuestOnlyRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}
