import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // 这在中间件校验或者 server component 热更新等场景可能发生，捕获但无视即可
          }
        },
      },
    }
  )
}
