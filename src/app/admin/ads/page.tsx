"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { Upload, ImageIcon, Loader2, Power, PowerOff, Save, Library } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function AdsAdmin() {
  const supabase = createClient()
  
  // 基础状态
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [adSlots, setAdSlots] = useState<any[]>([])
  const [tableMissing, setTableMissing] = useState(false)
  
  // 资产管理器状态
  const [assetLibrary, setAssetLibrary] = useState<string[]>([])
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)

  useEffect(() => {
    fetchAds()
    fetchAssets()
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

  // 2. 获取素材库列表
  const fetchAssets = async () => {
    const { data, error } = await supabase.storage.from('ads').list('banner')
    if (!error && data) {
      const urls = data.map(file => {
        const { data: { publicUrl } } = supabase.storage.from('ads').getPublicUrl(`banner/${file.name}`)
        return publicUrl
      })
      setAssetLibrary(urls)
    }
  }

  // 3. 更新广告素材 (确定配置)
  const handleConfirmAsset = async () => {
    if (!activeSlotId || !selectedAsset) return
    
    setLoading(true)
    const { error } = await supabase
      .from('ads')
      .update({ image_url: selectedAsset })
      .eq('id', activeSlotId)

    if (error) {
      toast.error("配置失败: " + error.message)
    } else {
      setAdSlots(prev => prev.map(s => s.id === activeSlotId ? { ...s, image_url: selectedAsset } : s))
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

  // 6. 弹窗内上传新素材
  const handleFileUploadInDialog = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return
      setUploading("dialog")

      const fileName = `lib-${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('ads').upload(`banner/${fileName}`, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('ads').getPublicUrl(`banner/${fileName}`)
      
      setSelectedAsset(publicUrl)
      fetchAssets() // 立即重新读取素材列表
      toast.success("新素材上传成功，已选中")
    } catch (error: any) {
      toast.error("上传错误: " + error.message)
    } finally {
      setUploading(null)
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
          <p className="text-muted-foreground mt-1 text-sm">点击通栏图片即可启用弹窗式素材管理器。</p>
        </div>
      </div>

      {/* 核心资产管理器 Dialog */}
      <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
        <DialogContent className="max-w-3xl min-h-[500px] flex flex-col p-6">
          <div className="flex items-center justify-between pb-4 border-b">
            <h2 className="text-xl font-bold">广告素材图库</h2>
            <label className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors">
               {uploading === "dialog" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
               上传新图片
               <input type="file" className="hidden" accept="image/*" disabled={uploading !== null} onChange={handleFileUploadInDialog} />
            </label>
          </div>

          <div className="flex-1 overflow-y-auto py-6">
            <div className="grid grid-cols-3 gap-6">
              {assetLibrary.length > 0 ? assetLibrary.map((url, i) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedAsset(url)}
                  className={`group relative aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                    selectedAsset === url ? "border-primary ring-2 ring-primary/20 shadow-lg scale-95" : "border-border hover:border-primary/40"
                  }`}
                >
                  <img src={url} className="w-full h-full object-cover" alt="asset" />
                  {selectedAsset === url && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                       <div className="bg-primary text-white p-1 rounded-full shadow-lg">
                          <ImageIcon className="h-6 w-6" />
                       </div>
                    </div>
                  )}
                </div>
              )) : (
                <div className="col-span-3 py-20 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                  暂无历史素材，请点击右上角上传第一张广告图。
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t mt-4">
            <p className="text-sm text-muted-foreground">
              {selectedAsset ? "已选择 1 个素材" : "请从上方图库中选择一张图片"}
            </p>
            <div className="flex gap-3">
               <Button variant="ghost" onClick={() => setIsLibraryOpen(false)}>取消</Button>
               <Button 
                disabled={!selectedAsset || !activeSlotId || loading} 
                onClick={handleConfirmAsset}
               >
                 {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                 确定配置该素材
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pb-12">
        {adSlots.map(slot => (
          <div key={slot.id} className="relative flex flex-col rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all border-border/60">
            <div className="p-6 pb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-base">
                   {slot.slot_name === 'header' ? '首页顶部通栏' : slot.slot_name === 'sidebar' ? '侧边栏挂件' : '列表间隙广告'}
                </h3>
                <div className={`px-2 py-0.5 text-[10px] font-black uppercase rounded border ${
                    slot.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-zinc-50 text-zinc-400 border-zinc-200"
                }`}>
                  {slot.is_active ? "Live" : "Idle"}
                </div>
              </div>
              
              <div 
                onClick={() => {
                  setActiveSlotId(slot.id)
                  setSelectedAsset(slot.image_url || null)
                  setIsLibraryOpen(true)
                }}
                className="group relative aspect-video w-full rounded-xl bg-muted border-2 border-dashed border-border/80 flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-primary/50"
              >
                {slot.image_url ? (
                  <img src={slot.image_url} alt="ads" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-primary transition-all">
                    <ImageIcon className="h-12 w-12 opacity-30" />
                    <span className="text-xs font-semibold">点击选择素材</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold tracking-tight">
                  {slot.image_url ? "点击更换图片" : "库中选图或上传"}
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 mt-auto space-y-5">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">跳转地址</label>
                  <Button variant="ghost" size="icon" className="h-5 w-5 hover:text-primary" onClick={() => handleSaveUrl(slot.id, slot.target_url)}>
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
                <input 
                  type="text" 
                  className="w-full text-xs p-2.5 rounded-lg border bg-background focus:ring-1 focus:ring-primary outline-none" 
                  value={slot.target_url || ''} 
                  onChange={(e) => {
                     const val = e.target.value
                     setAdSlots(prev => prev.map(s => s.id === slot.id ? { ...s, target_url: val } : s))
                  }}
                  placeholder="https://..."
                />
              </div>

              <Button 
                className="w-full text-xs font-bold h-11"
                variant={slot.is_active ? "secondary" : "default"}
                onClick={() => handleToggleStatus(slot.id, slot.is_active)}
              >
                {slot.is_active ? <PowerOff className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" />}
                {slot.is_active ? "临时停止投放" : "保存并立即上线"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
