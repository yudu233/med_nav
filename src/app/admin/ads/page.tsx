"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { AssetLibraryDialog } from "./components/AssetLibraryDialog"
import { AdSlotCard } from "./components/AdSlotCard"

export default function AdsAdmin() {
  const supabase = createClient()
  
  // 基础状态
  const [loading, setLoading] = useState(true)
  const [adSlots, setAdSlots] = useState<any[]>([])
  const [tableMissing, setTableMissing] = useState(false)
  
  // 资产管理器状态
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null)

  useEffect(() => {
    fetchAds()
  }, [])

  // 1. 获取广告配置
  const fetchAds = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .order('slot_name', { ascending: true })
    
    if (error) {
      const msg = error.message.toLowerCase()
      if (error.code === '42P01' || msg.includes('could not find') || msg.includes('does not exist')) {
        setTableMissing(true)
      } else {
        toast.error("读取失败: " + error.message)
      }
    } else {
      setAdSlots(data || [])
      setTableMissing(false)
    }
    setLoading(false)
  }

  // 3. 更新广告素材 (来自于弹窗的回调)
  const handleConfirmAsset = async (assetUrl: string) => {
    if (!activeSlotId) return
    
    setLoading(true)
    const { error } = await supabase
      .from('ads')
      .update({ image_url: assetUrl })
      .eq('id', activeSlotId)

    if (error) {
      toast.error("配置失败: " + error.message)
    } else {
      setAdSlots(prev => prev.map(s => s.id === activeSlotId ? { ...s, image_url: assetUrl } : s))
      toast.success("素材配置成功")
      setIsLibraryOpen(false)
    }
    setLoading(false)
  }

  // 4. 切换状态 (上线/下线)
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('ads')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (error) {
      toast.error("更新失败: " + error.message)
    } else {
      setAdSlots(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s))
      toast.success(currentStatus ? "广告已停用" : "广告已成功上线")
    }
  }

  // 5. 保存跳转链接
  const handleSaveUrl = async (id: string, url: string) => {
    const { error } = await supabase
      .from('ads')
      .update({ target_url: url })
      .eq('id', id)

    if (error) {
      toast.error("保存链接失败")
    } else {
      toast.success("跳转链接已保存")
    }
  }

  // 7. 初始化数据库 (一键开荒)
  const handleInitDB = async () => {
    setLoading(true)
    const initialData = [
      { slot_name: 'header', name: '首页顶部通栏', is_active: false, target_url: '' },
      { slot_name: 'sidebar', name: '侧边栏挂件', is_active: false, target_url: '' },
      { slot_name: 'list', name: '列表间隙广告', is_active: false, target_url: '' }
    ]
    const { error } = await supabase.from('ads').insert(initialData)
    if (error) {
       toast.error("初始化数据失败: " + error.message)
    } else {
      toast.success("基础广告位初始化完成")
      fetchAds()
    }
    setLoading(false)
  }

  const sqlScript = `create table ads (
  id uuid primary key default gen_random_uuid(),
  slot_name text not null unique,
  name text,
  image_url text,
  target_url text,
  is_active boolean default false,
  created_at timestamp with time zone default now()
);

alter table ads enable row level security;
create policy "所有人可读广告" on ads for select using (true);
create policy "管理员可操作广告" on ads for all using (auth.role() = 'authenticated');`

  if (loading && adSlots.length === 0) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  // 情形A: 表不存在
  if (tableMissing) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-red-600 font-sans">⚠️ 数据库配置未完成</h2>
          <p className="text-muted-foreground">请在您的 Supabase 后台运行以下 SQL 脚本以启用广告功能。</p>
        </div>
        <div className="bg-zinc-950 text-zinc-300 p-6 rounded-xl font-mono text-sm relative group border border-zinc-800">
           <Button size="sm" variant="secondary" className="absolute top-4 right-4" onClick={() => {
              navigator.clipboard.writeText(sqlScript)
              toast.success("脚本已复制")
            }}>复制 SQL</Button>
          <pre className="overflow-x-auto">{sqlScript}</pre>
        </div>
        <div className="flex justify-center gap-4">
           <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noreferrer">
              <Button size="lg" className="bg-primary hover:bg-primary/90">打开 SQL 编辑器</Button>
           </a>
           <Button size="lg" variant="outline" onClick={fetchAds}>我已运行，刷新状态</Button>
        </div>
      </div>
    )
  }

  // 情形B: 有表但没初始行
  if (adSlots.length === 0 && !loading) {
    return (
      <div className="flex flex-col h-[400px] items-center justify-center space-y-4 text-center">
        <p className="text-lg font-medium">✨ 数据库已成功建表，检测到数据为空</p>
        <p className="text-sm text-muted-foreground">点击下方按钮，只需 1 秒即可自动为您配置 3 个标准广告位置。</p>
        <Button onClick={handleInitDB} size="lg" className="mt-4">一键初始化基础广告位</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">广告位管理</h1>
          <p className="text-muted-foreground mt-1 text-sm">通过资产管理器更换各核心展位的赞助物料并查看详细配置。</p>
        </div>
      </div>

      {/* 核心资产管理器 Dialog，独立组件 */}
      <AssetLibraryDialog 
        open={isLibraryOpen}
        onOpenChange={setIsLibraryOpen}
        activeSlotId={activeSlotId}
        currentAsset={activeSlotId ? adSlots.find(s => s.id === activeSlotId)?.image_url || null : null}
        loading={loading}
        onConfirm={handleConfirmAsset}
      />

      {/* 独立抽离出的卡片列表 */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pb-12">
        {adSlots.map(slot => (
          <AdSlotCard 
            key={slot.id} 
            slot={slot} 
            onOpenLibrary={() => {
              setActiveSlotId(slot.id)
              setIsLibraryOpen(true)
            }}
            onSaveUrl={handleSaveUrl}
            onToggleStatus={handleToggleStatus}
          />
        ))}
      </div>
    </div>
  )
}
