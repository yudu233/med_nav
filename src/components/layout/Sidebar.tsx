"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type Category = {
  id: string
  name: string
  slug: string
  sort: number
}

export function Sidebar({ className, categories = [] }: { className?: string, categories?: Category[] }) {
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

            {categories.length === 0 ? (
              <div className="px-4 py-2 text-sm text-muted-foreground">暂无分类数据</div>
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
