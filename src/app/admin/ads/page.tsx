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


  const [tableMissing, setTableMissing] = useState(false)

  const fetchAds = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .order('slot_name', { ascending: true })
    
    if (error) {
      // 捕获“表不存在”的错误代码
      if (error.code === '42P01') {
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

  const handleInitDB = async () => {
    setLoading(true)
    const initialData = [
      { slot_name: 'header', name: '首页顶部通栏', is_active: false, target_url: '' },
      { slot_name: 'sidebar', name: '侧边栏挂件', is_active: false, target_url: '' },
      { slot_name: 'list', name: '列表间隙广告', is_active: false, target_url: '' }
    ]

    const { error } = await supabase.from('ads').insert(initialData)

    if (error) {
      if (error.code === '42P01') {
        setTableMissing(true) // 关键：如果点按钮发现没表，立刻变身为引导模式
        toast.error("检测到数据库表缺失，请先补全环境")
      } else {
        toast.error("初始化数据失败: " + error.message)
      }
    } else {
      toast.success("初始化成功！已生成核心广告位")
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

-- 开启公共读取权限
alter table ads enable row level security;
create policy "所有人可读广告" on ads for select using (true);
create policy "管理员可操作广告" on ads for all using (auth.role() = 'authenticated');`

  if (loading) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  // 场景 A: 数据库根本没有 ads 表
  if (tableMissing) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-red-600">⚠️ 检测到数据库环境不完整</h2>
          <p className="text-muted-foreground">您的 Supabase 数据库中尚未建立 "ads" 数据表，无法存储配置。</p>
        </div>
        
        <div className="bg-black text-green-400 p-6 rounded-xl font-mono text-sm relative group">
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="secondary" onClick={() => {
              navigator.clipboard.writeText(sqlScript)
              toast.success("SQL 已复制到剪贴板")
            }}>一键复制脚本</Button>
          </div>
          <pre className="overflow-x-auto">{sqlScript}</pre>
        </div>

        <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl flex flex-col items-center gap-4">
           <p className="text-blue-800 text-sm text-center">
             由于云服务安全策略限制，我无法远程直接为您建表。<br/>
             请点击下方按钮打开 Supabase，在 <b>SQL Editor</b> 中粘贴并运行，完成后点击“我已运行”。
           </p>
           <div className="flex gap-4">
              <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noreferrer">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">1. 点我打开 SQL 编辑器</Button>
              </a>
              <Button size="lg" variant="outline" onClick={fetchAds}>2. 我已运行，点击刷新</Button>
           </div>
        </div>
      </div>
    )
  }

  // 场景 B: 有表但没初始数据
  if (adSlots.length === 0) {
    return (
      <div className="flex flex-col h-[400px] items-center justify-center space-y-4">
        <div className="text-center">
          <p className="text-lg font-medium">✨ 数据库已就绪，准备开荒</p>
          <p className="text-sm text-muted-foreground">点击下方按钮，我将为您自动生成 3 个标准广告占位符。</p>
        </div>
        <Button onClick={handleInitDB} size="lg">一键生成基础广告位</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {adSlots.map(slot => (
          <div key={slot.id} className="relative flex flex-col rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
            <div className="p-6 pb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold leading-none tracking-tight">
                  {slot.slot_name === 'header' ? '首页顶部通栏' : 
                   slot.slot_name === 'sidebar' ? '侧边栏挂件' : '列表间隙广告'}
                </h3>
                <span className={`px-2 py-1 text-xs rounded-full ${slot.is_active ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100 text-gray-500'}`}>
                  {slot.is_active ? '已上线' : '已停用'}
                </span>
              </div>
              
              <div className="group relative aspect-video w-full rounded-md bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border transition-all">
                {slot.image_url ? (
                  <>
                    <img src={slot.image_url} alt={slot.slot_name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                       <div className="flex gap-2">
                        <label className="cursor-pointer bg-white text-black px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 hover:bg-white/90">
                          <Upload className="h-3 w-3" /> 本地上传
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, slot.id)} />
                        </label>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="secondary" size="sm" className="text-xs">
                              <Library className="h-3 w-3 mr-2" /> 素材库
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader><DialogTitle>从素材库选择图片</DialogTitle></DialogHeader>
                            <div className="grid grid-cols-3 gap-3 mt-4 max-h-[400px] overflow-y-auto p-1">
                              {assetLibrary.map((url, i) => (
                                <div key={i} className="aspect-video relative rounded-md overflow-hidden border hover:border-primary cursor-pointer" onClick={() => selectFromLibrary(slot.id, url)}>
                                  <img src={url} className="w-full h-full object-cover" alt="asset" />
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                       </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                     <label className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground">
                        {uploading === slot.id ? <Loader2 className="h-8 w-8 animate-spin" /> : <ImageIcon className="h-8 w-8" />}
                        <span className="text-sm">点击上传素材</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, slot.id)} />
                      </label>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 pt-0 mt-auto">
              <label className="text-sm font-medium text-muted-foreground block mb-1">重定向跳转 URL</label>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  className="flex-1 text-sm p-2 border rounded bg-background outline-none focus:ring-1 focus:ring-primary" 
                  value={slot.target_url || ''} 
                  onChange={(e) => handleInputChange(slot.id, e.target.value)}
                  placeholder="https://"
                />
                <Button size="icon" variant="ghost" className="h-9 w-9 border" onClick={() => handleUpdateAd(slot)}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                className="w-full" 
                variant={slot.is_active ? "outline" : "default"}
                onClick={() => handleToggleStatus(slot.id, slot.is_active)}
              >
                {slot.is_active ? (
                  <><PowerOff className="mr-2 h-4 w-4" /> 下架广告</>
                ) : (
                  <><Power className="mr-2 h-4 w-4" /> 保存并上线</>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


