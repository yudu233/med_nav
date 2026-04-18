import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"

// Mock 数据，待接 supabase
const mockLinks = [
  {
    id: "uuid-1",
    title: "PubMed",
    url: "https://pubmed.ncbi.nlm.nih.gov/",
    description: "美国国立卫生研究院（NIH）的国家医学图书馆（NLM）提供的生物医学论文搜索引擎。",
    click_count: 15420,
    icon_url: "https://www.google.com/s2/favicons?sz=64&domain=pubmed.ncbi.nlm.nih.gov"
  },
  {
    id: "uuid-2",
    title: "Nature Medicine",
    url: "https://www.nature.com/nm/",
    description: "《自然-医学》是一本发表生物医学各领域具有突出重要性和广泛兴趣的原创研究论文的同行评议月刊。",
    click_count: 8300,
    icon_url: "https://www.google.com/s2/favicons?sz=64&domain=nature.com"
  },
  {
    id: "uuid-3",
    title: "丁香园",
    url: "https://www.dxy.cn/",
    description: "专业面向医生、医疗机构、医药从业者以及生命科学领域的专业社交网站。",
    click_count: 22010,
    icon_url: "https://www.google.com/s2/favicons?sz=64&domain=dxy.cn"
  },
  {
    id: "uuid-4",
    title: "中华医学期刊网",
    url: "https://www.yiigle.com/",
    description: "中华医学会旗下全系列数百本权威中文医学期刊的官方平台。",
    click_count: 5120,
    icon_url: "https://www.google.com/s2/favicons?sz=64&domain=yiigle.com"
  }
]

import { LinkCard } from "@/components/shared/LinkCard"
import { AdSlot } from "@/components/shared/AdSlot"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 mx-auto max-w-7xl px-4 md:px-6 py-6">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <Sidebar />
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
              为您提供权威、纯净的临床及学术网址聚合。
            </p>
          </div>

          {/* 首页通栏广告位 */}
          <AdSlot slotName="header" className="mb-10" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockLinks.map((link, idx) => (
              <LinkCard key={link.id} link={link} delay={idx} />
            ))}
          </div>

          {/* 列表下方广告位 */}
          <AdSlot slotName="list" className="mt-12" />
        </main>
      </div>
    </div>
  )
}
