import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"
import { LinkCard } from "@/components/shared/LinkCard"
import { AdSlot } from "@/components/shared/AdSlot"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const supabase = await createClient()

  // 1. 基于 slug 抓取该类别信息
  const { data: categoryData } = await supabase
    .from('categories')
    .select('id, name')
    .eq('slug', slug)
    .single()

  // 如果非法地址或对应分类不存在，保护并回跳
  if (!categoryData) {
    redirect("/")
  }

  const title = categoryData.name

  // 2. 抓取名下关联的上线状态的 URLs
  const { data: linksData } = await supabase
    .from('links')
    .select('*')
    .eq('category_id', categoryData.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  // 3. 抓取全局 categories 防止前端菜单数据拿不到最新
  const { data: allCategoriesData } = await supabase
    .from('categories')
    .select('*')
    .order('sort', { ascending: true })

  const allCategories = allCategoriesData || []

  const activeLinks = linksData || []

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 mx-auto max-w-7xl px-4 md:px-6 py-6">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <Sidebar categories={allCategories} />
          <div className="mt-8 px-4">
             <AdSlot slotName="sidebar" />
          </div>
        </aside>
        <main className="flex w-full flex-col overflow-hidden">
          <div className="mb-8 flex items-center gap-2 border-b pb-4">
            <h1 className="text-3xl font-bold leading-tight tracking-tighter text-primary">
              {title}
            </h1>
            <span className="ml-4 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
              共收录 {activeLinks.length} 个资源
            </span>
          </div>
          
          <AdSlot slotName="header" className="mb-8" />

          {activeLinks.length === 0 ? (
             <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
                该科室下暂无已收录的内容，敬请期待。
             </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {activeLinks.map((link, idx) => (
                 <LinkCard key={link.id} link={link} delay={idx} />
               ))}
             </div>
          )}
          
          <AdSlot slotName="list" className="mt-12" />
        </main>
      </div>
    </div>
  )
}
