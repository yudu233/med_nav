"use client"

import { useState, useEffect } from "react"
import { Loader2, Plus, GripVertical, Settings2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"

import { Button } from "@/components/ui/button"
import { CategoryFormDialog, Category } from "./components/CategoryFormDialog"
import { CategoryLinksSheet } from "./components/CategoryLinksSheet"

export default function CategoriesAdmin() {
  const supabase = createClient()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [tableMissing, setTableMissing] = useState(false)

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort', { ascending: true })
    
    if (error) {
      const msg = error.message.toLowerCase()
      if (error.code === '42P01' || msg.includes('does not exist') || msg.includes('could not find')) {
        setTableMissing(true)
      } else {
        toast.error("加载数据失败: " + error.message)
      }
    } else {
      setCategories(data || [])
      setTableMissing(false)
    }
    setLoading(false)
  }

  // Handle Form Submit (Create & Update)
  const handleFormSubmit = async (formData: Omit<Category, 'id'>) => {
    if (editingCategory) {
      // Update
      const { error } = await supabase
        .from('categories')
        .update(formData)
        .eq('id', editingCategory.id)

      if (error) {
        toast.error("更新失败: " + error.message)
      } else {
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...formData } : c).sort((a,b)=>a.sort - b.sort))
        toast.success("分类更新成功")
      }
    } else {
      // Create
      const { data, error } = await supabase
        .from('categories')
        .insert(formData)
        .select()
        .single()

      if (error) {
        toast.error("创建失败: " + error.message)
      } else if (data) {
        setCategories(prev => [...prev, data].sort((a,b)=>a.sort - b.sort))
        toast.success("分类创建成功")
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("如果强制删除分类，关联的 URLs 将会被级联删除或者重置。请确认您真的要永久删除该分类吗？")) return

    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      toast.error("删除失败: " + error.message)
    } else {
      setCategories(prev => prev.filter(c => c.id !== id))
      toast.success("分立已成功删除")
    }
  }

  // 快捷初始化功能
  const handleInitDB = async () => {
    setLoading(true)
    const mockData = [
      { name: "心血管科", slug: "cardiology", sort: 10 },
      { name: "神经内科", slug: "neurology", sort: 20 },
      { name: "肿瘤科", slug: "oncology", sort: 30 }
    ]
    const { error } = await supabase.from('categories').insert(mockData)
    if (error) {
      toast.error("初始化数据失败: " + error.message)
    } else {
      toast.success("标准科室分类初始化完成")
      fetchCategories()
    }
    setLoading(false)
  }

  const sqlScript = `create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort integer default 0,
  created_at timestamp with time zone default now()
);

alter table categories enable row level security;
create policy "所有人可读取分类" on categories for select using (true);
create policy "管理员可操作分类" on categories for all using (auth.role() = 'authenticated');`

  if (loading && categories.length === 0) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (tableMissing) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-red-600 font-sans">⚠️ 分类数据表未配置</h2>
          <p className="text-muted-foreground">请在 Supabase 后台运行以下 SQL 以创建核心数据表。</p>
        </div>
        <div className="bg-zinc-950 text-zinc-300 p-6 rounded-xl font-mono text-sm relative group border border-zinc-800">
           <Button size="sm" variant="secondary" className="absolute top-4 right-4" onClick={() => {
              navigator.clipboard.writeText(sqlScript)
              toast.success("脚本文本已复制")
            }}>复制 SQL</Button>
          <pre className="overflow-x-auto">{sqlScript}</pre>
        </div>
        <div className="flex justify-center gap-4">
           <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noreferrer">
              <Button size="lg" className="bg-primary hover:bg-primary/90">打开 SQL Dashboard</Button>
           </a>
           <Button size="lg" variant="outline" onClick={fetchCategories}>已运行并重新检测</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">分类类目管理</h1>
          <p className="text-muted-foreground mt-1 text-sm">在这里控制全局的资源分类展示与排序。</p>
        </div>
        <Button onClick={() => {
          setEditingCategory(null)
          setIsDialogOpen(true)
        }}>
          <Plus className="h-4 w-4 mr-2" /> 新增科室/分类
        </Button>
      </div>

      {categories.length === 0 && !loading && (
        <div className="border border-dashed rounded-xl p-12 text-center flex flex-col items-center">
           <div className="bg-muted h-12 w-12 rounded-full flex items-center justify-center mb-4">
             <Settings2 className="h-6 w-6 text-muted-foreground" />
           </div>
           <h3 className="text-lg font-medium text-foreground">暂无分类数据</h3>
           <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-sm">您目前还没有创建任何分类，这可能导致前台无法正常导航。</p>
           <div className="flex gap-4">
             <Button onClick={() => setIsDialogOpen(true)} variant="outline">手动新增首个分类</Button>
             <Button onClick={handleInitDB}>一键导入标准科目示例</Button>
           </div>
        </div>
      )}

      {categories.length > 0 && (
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium w-24">排序优先级</th>
                <th className="px-4 py-3 font-medium w-1/3">体系与名称</th>
                <th className="px-4 py-3 font-medium text-muted-foreground w-1/4">URL Slug (路径名)</th>
                <th className="px-4 py-3 font-medium text-right">操作动作</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-4 font-mono text-muted-foreground">
                    <div className="flex items-center gap-2">
                       <GripVertical className="h-3 w-3 opacity-20" />
                       <span className="font-semibold text-foreground/80">{cat.sort}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-foreground">{cat.name}</td>
                  <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                     <span className="bg-muted px-2 py-1 rounded-md">{cat.slug}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                        onClick={() => {
                          setActiveCategory(cat)
                          setIsSheetOpen(true)
                        }}
                      >
                         网址管理
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => {
                        setEditingCategory(cat)
                        setIsDialogOpen(true)
                      }}>编辑修改</Button>
                      <Button size="sm" variant="ghost" className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(cat.id)}>丢弃</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Forms & Drawers */}
      <CategoryFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        initialData={editingCategory} 
        onSubmit={handleFormSubmit} 
      />

      <CategoryLinksSheet 
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        category={activeCategory}
      />
    </div>
  )
}
