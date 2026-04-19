"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, Plus, ExternalLink, Trash2, Edit2, UploadCloud, Link as LinkIcon, AlignLeft, Image as ImageIcon } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"
import { Category } from "./CategoryFormDialog"

interface CategoryLinksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
}

interface LinkItem {
  id: string
  title: string
  url: string
  description: string
  icon_url: string
  status: string
}

export function CategoryLinksDialog({ open, onOpenChange, category }: CategoryLinksDialogProps) {
  const supabase = createClient()
  const [links, setLinks] = useState<LinkItem[]>([])
  const [loading, setLoading] = useState(false)
  const [tableMissing, setTableMissing] = useState(false)

  // Quick Add State
  const [newTitle, setNewTitle] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newIcon, setNewIcon] = useState("")
  const [adding, setAdding] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && category) {
      fetchLinks()
    } else {
      setLinks([])
      resetForm()
      setTableMissing(false)
    }
  }, [open, category])

  const resetForm = () => {
    setNewTitle("")
    setNewUrl("")
    setNewDesc("")
    setNewIcon("")
  }

  const fetchLinks = async () => {
    if (!category) return
    setLoading(true)
    const { data, error } = await supabase
      .from('links')
      .select('id, title, url, description, icon_url, status')
      .eq('category_id', category.id)
      .order('created_at', { ascending: false })
      
    if (error) {
      const msg = error.message.toLowerCase()
      if (error.code === '42P01' || msg.includes('could not find') || msg.includes('does not exist') || msg.includes('column')) {
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingImage(true)
    try {
      const fileName = `icon-${Date.now()}-${file.name}`
      // 复用原本存在的 ads bucket，但放到 icons/ 子目录以作区分
      const { error: uploadError } = await supabase.storage.from('ads').upload(`icons/${fileName}`, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('ads').getPublicUrl(`icons/${fileName}`)
      setNewIcon(publicUrl)
      toast.success("图标上传成功")
    } catch (err: any) {
      toast.error("相册上传失败: " + err.message)
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
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
        description: newDesc,
        icon_url: newIcon,
        status: 'approved'
      })

    if (error) {
      toast.error("添加失败: " + error.message)
    } else {
      toast.success("网址导航已添加")
      resetForm()
      fetchLinks()
    }
    setAdding(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确认彻底删除该网址吗？")) return
    
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
  description text default '',
  icon_url text default '',
  status text default 'pending',
  click_count integer default 0,
  created_at timestamp with time zone default now()
);

alter table links enable row level security;
create policy "任何人可读取 approved 类型链接" on links for select using (status = 'approved');
create policy "任何人可写入新链接" on links for insert with check (true);
create policy "管理员拥有全部权限" on links for all using (auth.role() = 'authenticated');

-- 若原本已经存在 links 表，请执行以下命令叠加新列:
-- alter table links add column description text default '';
-- alter table links add column icon_url text default '';
`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-[95vw] h-[85vh] flex flex-col p-6 overflow-hidden gap-0">
        <DialogHeader className="mb-6 flex-shrink-0">
          <DialogTitle className="text-xl flex items-center gap-2">
             <div className="bg-primary/10 p-1.5 rounded-md">
               <ExternalLink className="w-5 h-5 text-primary" />
             </div>
             {category?.name} - 网址阵列管理
          </DialogTitle>
          <DialogDescription>
            纵列分配网址属性信息：图表、名称、描述以及底层挂载路由。
          </DialogDescription>
        </DialogHeader>

        {tableMissing ? (
           <div className="flex-1 overflow-y-auto">
             <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg mb-4 border border-destructive/20">
               <strong>Links 表结构过时或不存在</strong>
               <p className="mt-1 opacity-90">本次更新为您扩建了描述（description）与图片（icon_url）字段。请在 SQL 控制台执行代码修复表列。</p>
             </div>
             <div className="bg-zinc-950 text-zinc-300 p-4 rounded-xl font-mono text-xs overflow-y-auto mb-4 border border-zinc-800 relative group">
                <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6 hover:bg-zinc-800 text-zinc-400 hover:text-white" onClick={() => {
                  navigator.clipboard.writeText(sqlScript)
                  toast.success("已复制升级版建表 SQL")
                }}>
                  <Edit2 className="h-3 w-3" />
                </Button>
               <pre className="whitespace-pre-wrap">{sqlScript}</pre>
             </div>
             <Button variant="outline" onClick={fetchLinks} className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                我已同步更新数据库，点击重试
             </Button>
           </div>
        ) : (
          <div className="flex flex-1 overflow-hidden gap-6 h-full min-h-0">
            {/* 左侧：表单区 */}
            <div className="w-[300px] sm:w-[350px] shrink-0 overflow-y-auto border-r pr-6 space-y-6">
               <h4 className="font-semibold text-lg border-b pb-2">新增展示网</h4>
               
               <div className="space-y-4">
                 
                 <div className="space-y-1.5">
                   <label className="text-sm font-medium flex items-center gap-1.5">
                     <ImageIcon className="w-4 h-4 text-muted-foreground" /> 图标 URL
                   </label>
                   <div className="flex gap-2">
                     <Input 
                       placeholder="https://.../icon.png" 
                       value={newIcon}
                       onChange={e => setNewIcon(e.target.value)}
                       className="flex-1"
                     />
                     <Button 
                       variant="outline" 
                       size="icon" 
                       className="shrink-0 relative overflow-hidden" 
                       title="上传本地图片"
                       disabled={uploadingImage}
                     >
                       {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                       <input 
                         ref={fileInputRef}
                         type="file" 
                         className="absolute inset-0 opacity-0 cursor-pointer" 
                         accept="image/*" 
                         onChange={handleImageUpload}
                         disabled={uploadingImage}
                       />
                     </Button>
                   </div>
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-sm font-medium flex items-center gap-1.5">
                     <AlignLeft className="w-4 h-4 text-muted-foreground" /> 标题
                   </label>
                   <Input 
                     placeholder="例: Can I use" 
                     value={newTitle}
                     onChange={e => setNewTitle(e.target.value)}
                     className="font-medium"
                   />
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-sm font-medium flex items-center gap-1.5">
                     <Edit2 className="w-4 h-4 text-muted-foreground" /> 描述短语
                   </label>
                   <Input 
                     placeholder="前端 API 兼容性查询" 
                     value={newDesc}
                     onChange={e => setNewDesc(e.target.value)}
                   />
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-sm font-medium flex items-center gap-1.5">
                     <LinkIcon className="w-4 h-4 text-muted-foreground" /> 链接跳转 URL
                   </label>
                   <Input 
                     placeholder="https://caniuse.com" 
                     value={newUrl}
                     onChange={e => setNewUrl(e.target.value)}
                     className="text-sm font-mono"
                   />
                 </div>

                 <Button 
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700" 
                    onClick={handleAddLink} 
                    disabled={!newTitle || !newUrl || adding}
                  >
                   {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                   提交入库
                 </Button>

               </div>
            </div>

            {/* 右侧：列表区 */}
            <div className="flex-1 flex flex-col min-w-0">
               <h4 className="font-semibold text-lg border-b pb-2 mb-4 shrink-0 flex items-center justify-between">
                 类目所属网址
                 <span className="bg-muted text-foreground text-xs px-2 py-0.5 rounded-full">{links.length} 个</span>
               </h4>
               
               <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-8">
                 {loading && links.length === 0 ? (
                   <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                 ) : links.length === 0 ? (
                   <div className="text-center py-16 text-sm text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                     还没有向该科室投放任何外链！
                   </div>
                 ) : (
                   links.map(link => (
                     <div key={link.id} className="group p-3 border rounded-xl bg-card hover:bg-muted/30 shadow-sm flex items-start gap-4 transition-all">
                        
                        <div className="w-10 h-10 rounded-lg bg-background border flex shrink-0 items-center justify-center overflow-hidden">
                           {link.icon_url ? (
                             <img src={link.icon_url} className="w-full h-full object-cover" alt="icon" />
                           ) : (
                             <ExternalLink className="w-4 h-4 text-muted-foreground/60" />
                           )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-center justify-between gap-2">
                             <h5 className="font-bold text-sm truncate">{link.title}</h5>
                             <span 
                               onClick={() => handleToggleStatus(link.id, link.status)}
                               className={`text-[10px] px-2 py-0.5 rounded flex-shrink-0 cursor-pointer select-none transition-colors border ${
                                 link.status === 'approved' 
                                 ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                                 : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                               }`}
                             >
                               {link.status === 'approved' ? '上线中' : '隐蔽待审'}
                             </span>
                          </div>
                          
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {link.description || <span className="opacity-40 italic">无描述内容</span>}
                          </p>
                          <p className="text-[11px] text-muted-foreground/60 truncate mt-1 font-mono">
                            {link.url}
                          </p>
                        </div>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground group-hover:text-destructive shrink-0 bg-background shadow-sm border border-border/50 hover:bg-destructive/10" 
                          onClick={() => handleDelete(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                     </div>
                   ))
                 )}
               </div>
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
