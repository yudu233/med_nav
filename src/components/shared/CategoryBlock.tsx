"use client"

import { useState } from "react"
import { LinkCard } from "./LinkCard"
import { cn } from "@/lib/utils"
// import type { Category } from "@/components/layout/Sidebar" // 如果使用独立导出

// 这里为了通用直接声明内联，或者引用
interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string | null
}

interface LinkData {
  id: string
  category_id: string
  title: string
  url: string
  description: string
  icon_url?: string
  click_count: number
}

export function CategoryBlock({ 
  parentCategory, 
  subCategories, 
  allLinks 
}: { 
  parentCategory: Category, 
  subCategories: Category[], 
  allLinks: LinkData[] 
}) {
   const [activeTab, setActiveTab] = useState("all")

   // 获取包含父分类及所有子分类在内的关联 ID
   const relatedCategoryIds = [parentCategory.id, ...subCategories.map(c => c.id)]
   
   // 从全部链接中过滤出属于本大类板块的链接
   const linksForThisBlock = allLinks.filter(l => relatedCategoryIds.includes(l.category_id))

   // 进一步根据激活的二级 Tab 进行二次过滤
   const displayLinks = activeTab === "all" 
      ? linksForThisBlock
      : linksForThisBlock.filter(l => l.category_id === activeTab)

   return (
      <section id={`cat-${parentCategory.slug}`} className="mb-14 scroll-mt-[100px] pt-8 border-t border-border/30 first:border-0 first:pt-4">
         <h2 className="text-2xl font-bold mb-4 flex items-center tracking-tight">
            <span className="w-1.5 h-6 bg-primary rounded-full mr-3 inline-block"></span>
            {parentCategory.name}
         </h2>
         
         {subCategories.length > 0 && (
           <div className="flex flex-wrap gap-2 mb-6 bg-muted/30 p-2 rounded-xl backdrop-blur-sm border">
              <button 
                 onClick={() => setActiveTab("all")}
                 className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-colors", activeTab === "all" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/80")}
              >
                 汇总聚合
              </button>
              {subCategories.map(sub => (
                <button 
                  key={sub.id}
                  onClick={() => setActiveTab(sub.id)}
                  className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-colors", activeTab === sub.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/80")}
                >
                   {sub.name}
                </button>
              ))}
           </div>
         )}

         <div className="min-h-[150px]">
           {displayLinks.length === 0 ? (
             <div className="flex items-center justify-center h-40 text-muted-foreground border border-dashed rounded-xl bg-muted/10">
               该节点下暂无收录内容
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                 {displayLinks.map((link, idx) => <LinkCard key={link.id} link={link as any} delay={idx} />)}
             </div>
           )}
         </div>
      </section>
   )
}
