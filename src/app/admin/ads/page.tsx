"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { Upload, ImageIcon, Loader2, Power, PowerOff } from "lucide-react"

export default function AdsAdmin() {
  const supabase = createClient()
  const [uploading, setUploading] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [adSlots, setAdSlots] = useState<any[]>([])

  // 1. 加载所有广告位配置
  useEffect(() => {
    fetchAds()
  }, [])

  const fetchAds = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .order('slot_name', { ascending: true })
    
    if (!error && data) {
      setAdSlots(data)
    }
    setLoading(false)
  }

  // 2. 切换广告状态（上线/下线）
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('ads')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (error) {
      toast.error("操作失败")
    } else {
      setAdSlots(prev => prev.map(slot => 
        slot.id === id ? { ...slot, is_active: !currentStatus } : slot
      ))
      toast.success(currentStatus ? "广告已下线" : "广告已成功上线")
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, slotId: string) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return

      setUploading(slotId)

      const fileExt = file.name.split('.').pop()
      const fileName = `${slotId}-${Math.random()}.${fileExt}`
      const filePath = `banner/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('ads')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('ads')
        .getPublicUrl(filePath)

      // 更新数据库中的图片链接
      const { error: dbError } = await supabase
        .from('ads')
        .update({ image_url: publicUrl })
        .eq('id', slotId)

      if (dbError) throw dbError

      setAdSlots(prev => prev.map(slot => 
        slot.id === slotId ? { ...slot, image_url: publicUrl } : slot
      ))

      toast.success("图片上传成功")
    } catch (error: any) {
      toast.error("上传错误", { description: error.message })
    } finally {
      setUploading(null)
    }
  }

  if (loading) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">广告位管理</h1>
          <p className="text-muted-foreground mt-1">控制预留的医疗广告资源位置。配置后将实时展示在前台对应槽位。</p>
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
                  {slot.is_active ? '已上线' : '待机中'}
                </span>
              </div>
              
              <div className="group relative aspect-video w-full rounded-md bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border transition-all">
                {slot.image_url ? (
                  <>
                    <img src={slot.image_url} alt={slot.slot_name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-2">
                        <Upload className="h-4 w-4" /> 替换素材
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, slot.id)} />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    {uploading === slot.id ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8" />
                        <span className="text-sm">尚未上传素材</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/*" disabled={uploading !== null} onChange={(e) => handleFileUpload(e, slot.id)} />
                  </label>
                )}
              </div>
            </div>

            <div className="p-6 pt-0 mt-auto">
              <label className="text-sm font-medium text-muted-foreground block mb-1">重定向链接</label>
              <input 
                type="text" 
                className="w-full text-sm p-2 border rounded bg-background mb-4 outline-none focus:ring-1 focus:ring-primary" 
                defaultValue={slot.target_url} 
                placeholder="https://"
                disabled // 暂时锁定，后续可加保存按钮
              />
              <Button 
                className="w-full" 
                variant={slot.is_active ? "outline" : "default"}
                onClick={() => handleToggleStatus(slot.id, slot.is_active)}
              >
                {slot.is_active ? (
                  <><PowerOff className="mr-2 h-4 w-4" /> 下架广告</>
                ) : (
                  <><Power className="mr-2 h-4 w-4" /> 立即上线</>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

