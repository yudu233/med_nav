"use client"

import { useState, useEffect } from "react"
import { Loader2, Plus, ExternalLink, Trash2, Edit2 } from "lucide-react"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"
import { Category } from "./CategoryFormDialog"

interface CategoryLinksSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
}

interface LinkItem {
  id: string
  title: string
  url: string
  status: string
}

export function CategoryLinksSheet({ open, onOpenChange, category }: CategoryLinksSheetProps) {
  const supabase = createClient()
  const [links, setLinks] = useState<LinkItem[]>([])
  const [loading, setLoading] = useState(false)
  const [tableMissing, setTableMissing] = useState(false)

  // Quick Add State
  const [newTitle, setNewTitle] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (open && category) {
      fetchLinks()
    } else {
      setLinks([])
      setNewTitle("")
      setNewUrl("")
      setTableMissing(false)
    }
  }, [open, category])

  const fetchLinks = async () => {
    if (!category) return
    setLoading(true)
    const { data, error } = await supabase
      .from('links')
      .select('id, title, url, status')
      .eq('category_id', category.id)
      .order('created_at', { ascending: false })
      
    if (error) {
      const msg = error.message.toLowerCase()
      if (error.code === '42P01' || msg.includes('could not find') || msg.includes('does not exist')) {
        setTableMissing(true)
      } else {
        toast.error("获取链接失败: " + error.message)
      }
    } else {
      setLinks(data || [])
      setTableMissing(false)
    }
    setLoading(false)
  }

  const handleAddLink = async () => {
    if (!newTitle || !newUrl || !category) return

    setAdding(true)
    const { error } = await supabase
      .from('links')
      .insert({
        category_id: category.id,
        title: newTitle,
        url: newUrl,
        status: 'approved'
      })

    if (error) {
      toast.error("添加失败: " + error.message)
    } else {
      toast.success("链接添加成功")
      setNewTitle("")
      setNewUrl("")
      fetchLinks()
    }
    setAdding(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除该网址吗？")) return
    
    const { error } = await supabase.from('links').delete().eq('id', id)
    if (error) {
      toast.error("删除失败: " + error.message)
    } else {
      setLinks(prev => prev.filter(l => l.id !== id))
      toast.success("网址已删除")
    }
  }
  
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved'
    const { error } = await supabase.from('links').update({ status: newStatus }).eq('id', id)
    if (error) {
       toast.error("状态更新失败")
    } else {
       setLinks(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l))
    }
  }

  const sqlScript = `create table links (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  title text not null,
  url text not null,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

alter table links enable row level security;
create policy "任何人可读取 approved 类型链接" on links for select using (status = 'approved');
create policy "任何人可写入新链接" on links for insert with check (true);
create policy "管理员拥有全部权限" on links for all using (auth.role() = 'authenticated');`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md w-full flex flex-col h-full right-0 overflow-hidden border-l border-border bg-background pt-8 pb-4 px-6 shadow-2xl transition-all duration-300 ease-in-out">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="text-xl flex items-center gap-2">
             <div className="bg-primary/10 p-1.5 rounded-md">
               <ExternalLink className="w-5 h-5 text-primary" />
             </div>
             {category?.name} - 网址管理
          </SheetTitle>
          <SheetDescription>
            直接在该类目下添加或管理关联的网址导航数据。
          </SheetDescription>
        </SheetHeader>

        {tableMissing ? (
           <div className="flex-1 flex flex-col mt-4">
             <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg mb-4 border border-destructive/20">
               <strong>Links 表不存在</strong>
               <p className="mt-1 opacity-90">请在 Supabase SQL 控制台中执行以下命令建表</p>
             </div>
             <div className="bg-zinc-950 text-zinc-300 p-4 rounded-xl font-mono text-xs overflow-y-auto mb-4 border border-zinc-800 relative group">
                <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6 hover:bg-zinc-800 text-zinc-400 hover:text-white" onClick={() => {
                  navigator.clipboard.writeText(sqlScript)
                  toast.success("已复制 Links 建表 SQL")
                }}>
                  <Edit2 className="h-3 w-3" />
                </Button>
               <pre className="whitespace-pre-wrap">{sqlScript}</pre>
             </div>
             <Button variant="outline" onClick={fetchLinks} className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                我已建表，重试
             </Button>
           </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden h-full">
            {/* Quick Add Form */}
            <div className="space-y-3 bg-muted/40 p-4 rounded-lg border mb-5">
               <h4 className="text-sm font-medium">快速添加链接</h4>
               <Input 
                 placeholder="网址标题 (例如: 丁香园)" 
                 value={newTitle}
                 onChange={e => setNewTitle(e.target.value)}
                 className="bg-background"
               />
               <Input 
                 placeholder="https://..." 
                 value={newUrl}
                 onChange={e => setNewUrl(e.target.value)}
                 className="bg-background"
               />
               <Button 
                  className="w-full" 
                  size="sm" 
                  onClick={handleAddLink} 
                  disabled={!newTitle || !newUrl || adding}
                >
                 {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                 提交保存
               </Button>
            </div>

            {/* List */}
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">该目录下的已收录链接 ({links.length})</h4>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-8">
              {loading && links.length === 0 ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : links.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">暂无收录数据</div>
              ) : (
                links.map(link => (
                  <div key={link.id} className="group p-3 border rounded-md bg-card shadow-sm flex items-start justify-between gap-2 overflow-hidden transition-all hover:border-primary/40 hover:shadow-md">
                     <div className="overflow-hidden">
                       <h5 className="font-medium text-sm truncate">{link.title}</h5>
                       <p className="text-xs text-muted-foreground truncate mt-0.5" title={link.url}>{link.url}</p>
                       <div className="mt-2">
                          <span 
                            onClick={() => handleToggleStatus(link.id, link.status)}
                            className={`text-[10px] px-2 py-0.5 rounded-full cursor-pointer select-none transition-colors ${link.status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'}`}
                          >
                            {link.status === 'approved' ? '已上线' : '待审核'}
                          </span>
                       </div>
                     </div>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(link.id)}>
                       <Trash2 className="h-4 w-4" />
                     </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
