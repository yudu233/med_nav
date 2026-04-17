import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // In Next 15, params in Route Handlers should be destructured or awaited
) {
  const { id } = await params;
  
  if (!id) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  const supabase = await createClient()

  // 1. 查询目标网址的真实 URL
  const { data: link, error } = await supabase
    .from("links")
    .select("url, click_count")
    .eq("id", id)
    .single()

  // TODO: 因为还在开发阶段未连通表，提供一个测试回退逻辑
  const targetUrl = link?.url || `https://google.com/search?q=test_redirect_${id}`
  const currentCount = link?.click_count || 0

  // 2. 异步增加点击量 (无需等待它完成再重定向，以保证前端极速跳转)
  if (!error && link) {
    supabase
      .from("links")
      .update({ click_count: currentCount + 1 })
      .eq("id", id)
      .then()
  }

  // 3. 302 临时重定向至目标网站
  return NextResponse.redirect(targetUrl, 302)
}
