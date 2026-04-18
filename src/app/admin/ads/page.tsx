"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { Upload, ImageIcon, Loader2 } from "lucide-react"

export default function AdsAdmin() {
  const supabase = createClient()
  const [uploading, setUploading] = useState<string | null>(null)
  
  // 模拟数据（后续应从数据库读取）
  const [adSlots, setAdSlots] = useState([
    { id: "header", name: "首页顶部通栏", active: true, target_url: "https://example.com/ad1", image_url: "" },
    { id: "sidebar", name: "侧边栏中置", active: false, target_url: "", image_url: "" },
    { id: "list", name: "瀑布流列表注入", active: true, target_url: "https://example.com/ad2", image_url: "" }
  ])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, slotId: string) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return

      setUploading(slotId)

      // 1. 上传图片到 Supabase Storage (Bucket 名为 ads)
      const fileExt = file.name.split('.').pop()
      const fileName = `${slotId}-${Math.random()}.${fileExt}`
      const filePath = `banner/${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('ads')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. 获取公开访问链接
      const { data: { publicUrl } } = supabase.storage
        .from('ads')
        .getPublicUrl(filePath)

      // 3. 更新 UI 状态（实际开发中这里应调用 API 更新数据库）
      setAdSlots(prev => prev.map(slot => 
        slot.id === slotId ? { ...slot, image_url: publicUrl } : slot
      ))

      toast.success("图片上传成功")
    } catch (error: any) {
      toast.error("上传失败", { description: error.message })
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">广告位管理</h1>
          <p className="text-muted-foreground mt-1">控制预留的医疗广告资源位置。您可以上传本地图片并设置跳转链接。</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {adSlots.map(slot => (
          <div key={slot.id} className="relative flex flex-col rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
            <div className="p-6 pb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold leading-none tracking-tight">{slot.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${slot.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {slot.active ? '运行中' : '已停用'}
                </span>
              </div>
              
              {/* 图片上传/预览区域 */}
              <div className="group relative aspect-video w-full rounded-md bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border transition-colors hover:border-primary/50">
                {slot.image_url ? (
                  <>
                    <img src={slot.image_url} alt={slot.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-2">
                        <Upload className="h-4 w-4" /> 更换图片
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
                        <span className="text-sm">点击上传大图</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/*" disabled={uploading !== null} onChange={(e) => handleFileUpload(e, slot.id)} />
                  </label>
                )}
              </div>
            </div>

            <div className="p-6 pt-0 mt-auto">
              <label className="text-sm font-medium text-muted-foreground block mb-1">跳转链接 (Target URL)</label>
              <input 
                type="text" 
                className="w-full text-sm p-2 border rounded bg-background mb-4 focus:ring-1 focus:ring-primary outline-none" 
                defaultValue={slot.target_url} 
                placeholder="https://"
              />
              <Button 
                className="w-full" 
                variant={slot.active ? "secondary" : "default"}
              >
                {slot.active ? "下架广告" : "保存并上线"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

