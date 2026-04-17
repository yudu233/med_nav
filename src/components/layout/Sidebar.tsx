"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"


type Category = {
  id: string
  name: string
  slug: string
}

// TODO: 后续将替换为从 Supabase 读取
const mockCategories: Category[] = [
  { id: "1", name: "心血管科", slug: "cardiology" },
  { id: "2", name: "神经外科", slug: "neurosurgery" },
  { id: "3", name: "肿瘤科", slug: "oncology" },
  { id: "4", name: "科研工具", slug: "research-tools" },
  { id: "5", name: "医学影像", slug: "imaging" },
  { id: "6", name: "指南文献", slug: "guidelines" },
]

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            全部分类
          </h2>
          <div className="space-y-1">
            <Link href="/">
              <div
                className={cn(
                  "w-full flex items-center justify-start rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  pathname === "/" ? "bg-accent text-accent-foreground font-bold" : "transparent"
                )}
              >
                推荐资源
              </div>
            </Link>
            {mockCategories.map((category) => (
              <Link key={category.id} href={`/category/${category.slug}`}>
                <div
                  className={cn(
                    "w-full flex items-center justify-start rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    pathname === `/category/${category.slug}`
                      ? "bg-accent text-accent-foreground font-bold text-primary"
                      : "transparent text-muted-foreground"
                  )}
                >
                  {category.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
