import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"
import { CategoryBlock } from "@/components/shared/CategoryBlock"
import { AdSlot } from "@/components/shared/AdSlot"
import { createClient } from "@/utils/supabase/server"

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient()

  // 抓取全站收录（审批通过）的所有资源
  const { data: linksData } = await supabase
    .from('links')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  // 抓取分类菜单，避免在客户端被 HTTP 缓存
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*')
    .order('sort', { ascending: true })

  const categories = categoriesData || []
  const parents = categories.filter(c => !c.parent_id).sort((a,b) => a.sort - b.sort)

  const allLinks = linksData || []

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 mx-auto max-w-7xl px-4 md:px-6 py-6">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <Sidebar categories={categories} />
          {/* 侧边栏广告位 */}
          <div className="mt-8 px-4">
            <AdSlot slotName="sidebar" />
          </div>
        </aside>
        <main className="flex w-full flex-col overflow-hidden">
          <div className="mb-6 flex flex-col items-start gap-2">
            <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-4xl lg:leading-[1.1]">
              精准医疗科研导航
            </h1>
            <p className="text-lg font-light text-muted-foreground/80 max-w-[600px]">
              为您提供权威、纯净的临床及学术网址聚合。这里展示了最新收录的优质资源。
            </p>
          </div>

          {/* 首页通栏广告位 */}
          <AdSlot slotName="header" className="mb-10" />
          
          {parents.length === 0 ? (
             <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
                 当前系统内尚无任何分类架构数据，请进入后台配置。
             </div>
          ) : (
             <div className="flex flex-col">
               {parents.map(parent => {
                  const subs = categories.filter(c => c.parent_id === parent.id).sort((a,b) => a.sort - b.sort)
                  return (
                     <CategoryBlock 
                        key={parent.id} 
                        parentCategory={parent} 
                        subCategories={subs} 
                        allLinks={allLinks as any} 
                     />
                  )
               })}
             </div>
          )}

          {/* 列表下方广告位 */}
          <AdSlot slotName="list" className="mt-12" />
        </main>
      </div>
    </div>
  )
}
