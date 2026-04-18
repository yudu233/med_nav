"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronRight, ChevronDown, ListTree, Hash } from "lucide-react"

export type Category = {
  id: string
  name: string
  slug: string
  sort: number
  parent_id?: string | null
}

export function Sidebar({ className, categories = [] }: { className?: string, categories?: Category[] }) {
  const [activeSlug, setActiveSlug] = useState<string>("")
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({})

  // 分离一级和二级分类
  const parents = categories.filter(c => !c.parent_id).sort((a, b) => a.sort - b.sort)
  const childrenDict = categories.filter(c => c.parent_id).reduce((acc, curr) => {
    if (!curr.parent_id) return acc
    if (!acc[curr.parent_id]) acc[curr.parent_id] = []
    acc[curr.parent_id].push(curr)
    return acc
  }, {} as Record<string, Category[]>)

  // 默认展开所有一级父类，根据各自内部的二级菜单是否存在
  useEffect(() => {
    const initExpanded: Record<string, boolean> = {}
    parents.forEach(p => { initExpanded[p.id] = true })
    setExpandedParents(initExpanded)
  }, [categories])

  // 滚动监听以实时更新 active item 高亮
  useEffect(() => {
    const handleScroll = () => {
       const sections = parents.map(p => ({ id: p.slug, el: document.getElementById(`cat-${p.slug}`) }))
       // 找到当前滚动到视野内的最近的区块
       let currentActive = ""
       for (const section of sections) {
         if (section.el) {
           const rect = section.el.getBoundingClientRect()
           // 如果区块顶部滚到了距离整个屏幕顶部 150px 以内，它可能就是当前 active 的区块
           if (rect.top <= 150 && rect.bottom >= 150) {
              currentActive = section.id
              break
           }
         }
       }
       if (currentActive !== "") {
         setActiveSlug(currentActive)
       }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [parents])

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedParents(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleNavClick = (slug: string) => {
    if (window.location.pathname !== '/') {
       window.location.href = `/#cat-${slug}`
       return
    }

    setActiveSlug(slug)
    const el = document.getElementById(`cat-${slug}`)
    if (el) {
      // Header 大约高 60px ，这里给出额外 20px padding
      const y = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <div className={cn("pb-12 h-screen overflow-y-auto", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-4 px-4 text-sm font-bold tracking-tight text-muted-foreground uppercase flex items-center">
             <ListTree className="w-4 h-4 mr-2" />
             全部分类导航
          </h2>
          <div className="space-y-1 pr-2">
            
            {/* 静态的全局总导 */}
            <div
              onClick={() => {
                if (window.location.pathname !== '/') window.location.href = '/'
                else window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className={cn(
                "w-full flex items-center justify-start rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
                activeSlug === "" ? "bg-accent text-accent-foreground font-bold" : "text-muted-foreground"
              )}
            >
              🚀 推荐资源首页
            </div>

            {categories.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground text-center border-t mt-4 border-dashed">
                 请在管理后台建立分类
              </div>
            ) : (
              parents.map((parent) => {
                const subs = childrenDict[parent.id] || []
                const isExpanded = expandedParents[parent.id]
                const isActive = activeSlug === parent.slug

                return (
                  <div key={parent.id} className="mt-2 text-sm">
                    {/* 一级菜单行 */}
                    <div
                      onClick={() => handleNavClick(parent.slug)}
                      className={cn(
                        "group w-full flex items-center justify-between rounded-md px-4 py-2.5 font-medium hover:bg-accent/80 hover:text-accent-foreground cursor-pointer transition-colors",
                        isActive ? "bg-accent/80 text-foreground font-bold" : "text-muted-foreground"
                      )}
                    >
                      <span className="flex-1 truncate">{parent.name}</span>
                      
                      {/* 如果有子分类，显示展开折叠箭头。如果没有依然占据小空位让整体对齐 */}
                      {subs.length > 0 && (
                        <div 
                          onClick={(e) => toggleExpand(parent.id, e)}
                          className="p-1 rounded hover:bg-muted ml-2 text-muted-foreground transition-all duration-200"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      )}
                    </div>

                    {/* 二级菜单行列表 */}
                    {isExpanded && subs.length > 0 && (
                      <div className="ml-4 mt-1 pl-4 border-l border-border/60 flex flex-col gap-1 py-1 relative">
                        {/* 装饰短横杠是为了增加层次感 */}
                        {subs.map(sub => (
                          <div
                            key={sub.id}
                            onClick={() => handleNavClick(sub.slug)}
                            className={cn(
                              "relative px-3 py-1.5 rounded-md text-xs hover:text-foreground cursor-pointer transition-colors group flex items-center",
                              activeSlug === sub.slug ? "text-primary font-bold bg-primary/5" : "text-muted-foreground"
                            )}
                          >
                             {/* 鼠标悬停或者高亮时出现小圆点提示 */}
                             <div className={cn(
                               "absolute -left-[19px] w-2 h-2 rounded-full border-2 border-background",
                               activeSlug === sub.slug ? "bg-primary" : "bg-border group-hover:bg-muted-foreground"
                             )} />
                             <Hash className="w-3 h-3 mr-1.5 opacity-40 shrink-0" />
                             <span className="truncate">{sub.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
