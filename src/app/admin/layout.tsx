"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Link as LinkIcon, ListTree, Image as ImageIcon, LogOut } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"

const navItems = [
  { name: "面板监控", href: "/admin", icon: LayoutDashboard },
  { name: "网址管理", href: "/admin/links", icon: LinkIcon },
  { name: "分类管理", href: "/admin/categories", icon: ListTree },
  { name: "广告展位", href: "/admin/ads", icon: ImageIcon },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/admin-login")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/40">
      {/* 侧边导航 */}
      <aside className="w-64 border-r bg-background flex flex-col">
        <div className="h-14 flex items-center px-4 border-b">
          <span className="font-bold text-lg text-primary">MedNav 站点中枢</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            注销登录
          </Button>
        </div>
      </aside>
      
      {/* 内容区域 */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
