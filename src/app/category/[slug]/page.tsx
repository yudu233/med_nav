import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"
import { LinkCard } from "@/components/shared/LinkCard"
import { redirect } from "next/navigation"

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // 这部分待与 Supabase 连通。这里使用假数据集。
  const mockCategories: Record<string, string> = {
    "cardiology": "心血管科",
    "neurosurgery": "神经外科",
    "oncology": "肿瘤科",
    "research-tools": "科研工具",
    "imaging": "医学影像",
    "guidelines": "指南文献",
  }

  const title = mockCategories[slug]

  if (!title) {
    redirect("/")
  }

  const mockLinks = [
    {
      id: `cat-${slug}-1`,
      title: `${title} - 相关资源一`,
      url: "https://example.com/1",
      description: `这里收录了最专业的${title}相关研究与数据平台。`,
      click_count: 531,
    },
    {
      id: `cat-${slug}-2`,
      title: `${title} - 学术周刊`,
      url: "https://example.com/2",
      description: `前沿的${title}技术与最新论文。`,
      click_count: 240,
    }
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 mx-auto max-w-7xl px-4 md:px-6 py-6">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <Sidebar />
        </aside>
        <main className="flex w-full flex-col overflow-hidden">
          <div className="mb-8 flex items-center gap-2 border-b pb-4">
            <h1 className="text-3xl font-bold leading-tight tracking-tighter text-primary">
              {title}
            </h1>
            <span className="ml-4 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
              共收录 {mockLinks.length} 个资源
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockLinks.map((link, idx) => (
              <LinkCard key={link.id} link={link} delay={idx} />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
