import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. 先确认路由参数是否拿到了
  const { id } = await params;
  console.log(`[调试] 收到请求，路由参数 id =`, id)

  if (!id) {
    console.log(`[错误分支] id 为空，跳转到首页`)
    return NextResponse.redirect(new URL("/", request.url))
  }

  const supabase = await createClient()

  // 2. 查询数据库，看看有没有拿到数据
  console.log(`[调试] 正在查询 Supabase，id =`, id)
  const { data: link, error } = await supabase
    .from("links")
    .select("url, click_count, id") // 多查一个id，确认数据是否匹配
    .eq("id", id)
    .single()

  console.log(`[调试] 查询结果：`, { link, error })

  // 分支1：查询出错或没数据
  if (error || !link) {
    console.error(`[错误分支] 查询失败：`, error || "link 为 null")
    return NextResponse.redirect(new URL("/", request.url))
  }

  // 分支2：数据里没有 url 字段
  if (!link.url) {
    console.error(`[错误分支] 数据存在但 url 为空：`, link)
    return NextResponse.redirect(new URL("/", request.url))
  }

  // 3. 处理 URL，看看是不是格式问题
  console.log(`[调试] 原始 url：`, link.url)
  let rawUrl = link.url.trim()
  if (!rawUrl.startsWith('http')) {
    rawUrl = `https://${rawUrl}`
  }
  console.log(`[调试] 处理后 url：`, rawUrl)

  let targetUrl: URL
  try {
    targetUrl = new URL(rawUrl)
    console.log(`[调试] URL 解析成功，目标地址：`, targetUrl.toString())
  } catch (e) {
    console.error(`[错误分支] URL 解析失败：`, e)
    return NextResponse.redirect(new URL("/", request.url))
  }

  // 异步更新点击量（不影响重定向，先不管它）
  supabase
    .from("links")
    .update({ click_count: (link.click_count || 0) + 1 })
    .eq("id", id)
    .then(({ error }) => {
      if (error) console.error("[调试] 更新点击量失败：", error)
    })

  // 正常重定向
  console.log(`[调试] 准备重定向到：`, targetUrl.toString())
  return NextResponse.redirect(targetUrl.toString(), 302)
}