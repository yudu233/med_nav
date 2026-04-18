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

  const fetchAds = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .order('slot_name', { ascending: true })
    
    // 如果数据库没数据，这里 adSlots 就是空的，点击肯定没反应
    if (error) {
      toast.error("读取广告配置失败: " + error.message)
    } else {
      setAdSlots(data || [])
    }
    setLoading(false)
  }

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

  if (loading) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (adSlots.length === 0) {
    return (
      <div className="flex flex-col h-[400px] items-center justify-center space-y-4">
        <p className="text-muted-foreground">检测到 ads 数据表为空</p>
        <Button onClick={fetchAds}>刷新重试</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">广告位管理</h1>
          <p className="text-muted-foreground mt-1">控制预留的医疗广告资源位置。您可以上传、从库选择素材并设置跳转链接。</p>
        </div>
      </div>

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


