"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { Upload, ImageIcon, Loader2, Power, PowerOff, Save, Library } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function AdsAdmin() {
  const supabase = createClient()
  const [uploading, setUploading] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [adSlots, setAdSlots] = useState<any[]>([])
  const [assetLibrary, setAssetLibrary] = useState<string[]>([])

  useEffect(() => {
    fetchAds()
    fetchAssets()
  }, [])



  // 获取过去上传过的素材
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

  const handleUpdateAd = async (slot: any) => {
    const { error } = await supabase
      .from('ads')
      .update({ 
        is_active: slot.is_active,
        target_url: slot.target_url,
        image_url: slot.image_url
      })
      .eq('id', slot.id)

    if (error) {
      toast.error("更新失败: " + error.message)
    } else {
      toast.success("配置已同步至公网")
      // 局部刷新，不用全量 fetch
      setAdSlots(prev => prev.map(s => s.id === slot.id ? slot : s))
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const target = adSlots.find(s => s.id === id)
    if (!target) return
    
    const updated = { ...target, is_active: !currentStatus }
    await handleUpdateAd(updated)
  }

  const handleInputChange = (id: string, value: string) => {
    setAdSlots(prev => prev.map(s => s.id === id ? { ...s, target_url: value } : s))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, slotId: string) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return
      setUploading(slotId)

      const fileExt = file.name.split('.').pop()
      const fileName = `${slotId}-${Date.now()}.${fileExt}`
      const filePath = `banner/${fileName}`

      const { error: uploadError } = await supabase.storage.from('ads').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('ads').getPublicUrl(filePath)
      
      const target = adSlots.find(s => s.id === slotId)
      await handleUpdateAd({ ...target, image_url: publicUrl })
      fetchAssets() // 刷新库
    } catch (error: any) {
      toast.error("上传错误: " + error.message)
    } finally {
      setUploading(null)
    }
  }

  const selectFromLibrary = async (slotId: string, url: string) => {
    const target = adSlots.find(s => s.id === slotId)
    await handleUpdateAd({ ...target, image_url: url })
  }


  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)

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

  const handleUpdateAd = async (slotId: string, url: string) => {
    const target = adSlots.find(s => s.id === slotId)
    const { error } = await supabase
      .from('ads')
      .update({ image_url: url })
      .eq('id', slotId)

    if (error) {
      toast.error("配置失败: " + error.message)
    } else {
      setAdSlots(prev => prev.map(s => s.id === slotId ? { ...s, image_url: url } : s))
      toast.success("素材已更新并同步")
      setIsLibraryOpen(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const target = adSlots.find(s => s.id === id)
    if (!target) return
    const { error } = await supabase.from('ads').update({ is_active: !currentStatus }).eq('id', id)
    if (!error) {
      setAdSlots(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s))
      toast.success(currentStatus ? "广告已停用" : "广告已成功上线")
    }
  }

  const handleSaveUrl = async (slot: any) => {
    const { error } = await supabase.from('ads').update({ target_url: slot.target_url }).eq('id', slot.id)
    if (!error) toast.success("跳转链接已保存")
  }

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
      fetchAssets() // 刷新列表
      toast.success("素材上传并已加入库")
    } catch (error: any) {
      toast.error("上传错误: " + error.message)
    } finally {
      setUploading(null)
    }
  }

  const handleInitDB = async () => {
    setLoading(true)
    const initialData = [
      { slot_name: 'header', name: '首页顶部通栏', is_active: false, target_url: '' },
      { slot_name: 'sidebar', name: '侧边栏挂件', is_active: false, target_url: '' },
      { slot_name: 'list', name: '列表间隙广告', is_active: false, target_url: '' }
    ]
    const { error } = await supabase.from('ads').insert(initialData)
    if (error) {
       const msg = error.message.toLowerCase()
       if (error.code === '42P01' || msg.includes('could not find') || msg.includes('does not exist')) {
        setTableMissing(true)
      } else {
        toast.error("初始化数据失败: " + error.message)
      }
    } else {
      toast.success("初始化成功")
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

  if (loading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  if (tableMissing) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-red-600 font-sans">⚠️ 数据库表缺失</h2>
          <p className="text-muted-foreground">请在 Supabase SQL 编辑器中运行下方代码以开启功能。</p>
        </div>
        <div className="bg-zinc-950 text-zinc-300 p-6 rounded-xl font-mono text-sm relative group border border-zinc-800">
           <Button size="sm" variant="ghost" className="absolute top-4 right-4 hover:bg-white/10" onClick={() => {
              navigator.clipboard.writeText(sqlScript)
              toast.success("SQL 已复制")
            }}>一键复制</Button>
          <pre className="overflow-x-auto">{sqlScript}</pre>
        </div>
        <div className="flex justify-center gap-4">
           <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noreferrer">
              <Button size="lg" className="bg-primary hover:bg-primary/90">打开编辑器</Button>
           </a>
           <Button size="lg" variant="outline" onClick={fetchAds}>我已运行，刷新</Button>
        </div>
      </div>
    )
  }

  if (adSlots.length === 0) {
    return (
      <div className="flex flex-col h-[400px] items-center justify-center space-y-4">
        <div className="text-center"><p className="text-lg font-medium">✨ 数据库已就绪</p></div>
        <Button onClick={handleInitDB} size="lg">一键生成基础广告位</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">广告位管理</h1>
          <p className="text-muted-foreground mt-1 text-sm">点击槽位即可从素材库选择或上传新广告素材。</p>
        </div>
      </div>

      <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
        <DialogContent className="max-w-3xl min-h-[500px] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <DialogTitle className="text-xl">素材管理器</DialogTitle>
            <label className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-primary/90">
               {uploading === "dialog" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
               上传新素材
               <input type="file" className="hidden" accept="image/*" disabled={uploading !== null} onChange={handleFileUploadInDialog} />
            </label>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-6">
            <div className="grid grid-cols-3 gap-4">
              {assetLibrary.length > 0 ? assetLibrary.map((url, i) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedAsset(url)}
                  className={`group relative aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                    selectedAsset === url ? "border-primary ring-2 ring-primary/20 shadow-lg scale-[0.98]" : "border-border hover:border-primary/50"
                  }`}
                >
                  <img src={url} className="w-full h-full object-cover" alt="asset" />
                  {selectedAsset === url && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                       <div className="bg-primary text-white p-1 rounded-full shadow-xl">
                          <Save className="h-5 w-5" />
                       </div>
                    </div>
                  )}
                </div>
              )) : (
                <div className="col-span-3 py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                  当前库中无素材，请点击右上角上传
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <p className="text-sm text-muted-foreground">已选择 1 张图片</p>
            <div className="flex gap-3">
               <Button variant="ghost" onClick={() => setIsLibraryOpen(false)}>取消</Button>
               <Button 
                disabled={!selectedAsset || !activeSlotId} 
                onClick={() => handleUpdateAd(activeSlotId!, selectedAsset!)}
               >
                 确定配置
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {adSlots.map(slot => (
          <div key={slot.id} className="relative flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6 pb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-base leading-none">
                   {slot.slot_name === 'header' ? '首页顶部通栏' : slot.slot_name === 'sidebar' ? '侧边栏挂件' : '列表间隙广告'}
                </h3>
                <div className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded border ${
                    slot.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-400 border-gray-200"
                }`}>
                  {slot.is_active ? "RUNNING" : "STOPPED"}
                </div>
              </div>
              
              <div 
                onClick={() => {
                  setActiveSlotId(slot.id)
                  setSelectedAsset(slot.image_url || null)
                  setIsLibraryOpen(true)
                }}
                className="group relative aspect-video w-full rounded-lg bg-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:bg-muted/80"
              >
                {slot.image_url ? (
                  <img src={slot.image_url} alt="ads" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                    <ImageIcon className="h-10 w-10 opacity-40 shrink-0" />
                    <span className="text-xs font-medium">点击配置素材</span>
                  </div>
                )}
                {slot.image_url && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                    点击更换素材
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 pt-0 mt-auto space-y-4">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5 ml-1">重定向跳转 URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 text-sm p-2 rounded-md border bg-background focus:ring-1 focus:ring-primary outline-none transition-all" 
                    value={slot.target_url || ''} 
                    onChange={(e) => {
                       const val = e.target.value
                       setAdSlots(prev => prev.map(s => s.id === slot.id ? { ...s, target_url: val } : s))
                    }}
                    placeholder="https://"
                  />
                  <Button variant="ghost" size="icon" className="h-9 w-9 border shrink-0" onClick={() => handleSaveUrl(slot)}>
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button 
                className="w-full text-xs h-10 shadow-sm"
                variant={slot.is_active ? "secondary" : "default"}
                onClick={() => handleToggleStatus(slot.id, slot.is_active)}
              >
                {slot.is_active ? <PowerOff className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" />}
                {slot.is_active ? "下架该广告" : "保存并上线"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


