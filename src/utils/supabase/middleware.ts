import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 保护所有的 /admin 路由，但不包括 /admin-login 或 /admin-setup
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith('/admin') &&
    pathname !== '/admin-login' &&
    pathname !== '/admin-setup'
  ) {
    if (!user) {
      // no user, potentially respond by redirecting the user to the login page
      const url = request.nextUrl.clone()
      url.pathname = '/admin-login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
