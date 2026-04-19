import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export const dynamic = 'force-dynamic'; // 强制动态，跳过缓存

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> } // 显式定义 props
) {
  const { id } = await props.params; // 严格 await

  console.log(`[Redirect] Processing ID: ${id}`)

  if (!id) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  console.log(`[Redirect] Processing ID: ${id}`)

  const supabase = await createClient()

  // 1. 查询目标网址的真实 URL
  const { data: link, error } = await supabase
    .from("links")
    .select("url, click_count")
    .eq("id", id)
    .single()

  if (error || !link || !link.url) {
    console.error(`[Redirect] Failed to find link for ID ${id}:`, error || "No data")
    if (link) console.log("[Redirect] Found link object but no url:", link)
    // 找不到真实数据或遭遇错误时，安全降级退回到首页
    return NextResponse.redirect(new URL("/", request.url))
  }

  let rawUrl = link.url.trim()
  // 确保 URL 带有协议头
  if (!rawUrl.startsWith('http')) {
    rawUrl = `https://${rawUrl}`
  }

  let targetUrl: URL
  try {
    targetUrl = new URL(rawUrl)
  } catch (e) {
    console.error(`[Redirect] Invalid target URL "${rawUrl}":`, e)
    return NextResponse.redirect(new URL("/", request.url))
  }

  const currentCount = link.click_count || 0

  // 2. 异步增加点击量 (无需等待它完成再重定向，以保证前端极速跳转)
  // 注意：在 Route Handler 中，如果不 await，Node.js 环境下可能在响应发送后立刻杀掉进程，导致更新失败
  // 但为了用户体验，我们保持异步，或者使用 waitUntil (如果是在边缘环境)
  supabase
    .from("links")
    .update({ click_count: currentCount + 1 })
    .eq("id", id)
    .then(({ error }) => {
      if (error) console.error("[Redirect] Update click count failed:", error)
    })

  // 3. 302 临时重定向至目标网站
  return NextResponse.redirect(targetUrl.toString(), 302)
}
