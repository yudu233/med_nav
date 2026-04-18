"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

type Category = {
  id: string
  name: string
  slug: string
  sort: number
}

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('sort', { ascending: true })
      
      if (data) {
        setCategories(data)
      }
      setLoading(false)
    }
    fetchCategories()
  }, [])

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
            
            {loading ? (
              <div className="px-4 py-2 space-y-3 mt-2 outline-none">
                 <Skeleton className="h-6 w-3/4 rounded-sm" />
                 <Skeleton className="h-6 w-full rounded-sm" />
                 <Skeleton className="h-6 w-2/3 rounded-sm" />
                 <Skeleton className="h-6 w-5/6 rounded-sm" />
              </div>
            ) : (
              categories.map((category) => (
                <Link key={category.id} href={`/category/${category.slug}`}>
                  <div
                    className={cn(
                      "w-full flex items-center justify-start rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                      pathname === `/category/${category.slug}`
                        ? "bg-accent text-accent-foreground font-bold text-primary"
                        : "transparent text-muted-foreground"
                    )}
                  >
                    {category.name}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
