"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Upload, ImageIcon, Loader2, ZoomIn, X } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"

interface AssetLibraryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeSlotId: string | null
  currentAsset: string | null
  loading: boolean
  onConfirm: (assetUrl: string) => Promise<void>
}

export function AssetLibraryDialog({
  open,
  onOpenChange,
  activeSlotId,
  currentAsset,
  loading,
  onConfirm
}: AssetLibraryDialogProps) {
  const supabase = createClient()
  const [assetLibrary, setAssetLibrary] = useState<string[]>([])
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)
  const [uploading, setUploading] = useState<boolean>(false)
  
  // 用于放大预览的图片URL
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // 每次打开弹窗，初始选中状态和加载数据
  useEffect(() => {
    if (open) {
      setSelectedAsset(currentAsset)
      fetchAssets()
    }
  }, [open, currentAsset])

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return
      setUploading(true)

      const fileName = `lib-${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('ads').upload(`banner/${fileName}`, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('ads').getPublicUrl(`banner/${fileName}`)
      
      setSelectedAsset(publicUrl)
      fetchAssets()
      toast.success("新素材上传成功，已选中")
    } catch (error: any) {
      toast.error("上传错误: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleConfirm = async () => {
    if (selectedAsset) await onConfirm(selectedAsset)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl min-h-[600px] flex flex-col p-6 overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b">
            <h2 className="text-2xl font-bold">广告素材图库</h2>
            <label className="cursor-pointer bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              上传新图片
              <input type="file" className="hidden" accept="image/*" disabled={uploading} onChange={handleFileUpload} />
            </label>
          </div>

          <div className="flex-1 overflow-y-auto py-6 pr-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {assetLibrary.length > 0 ? assetLibrary.map((url, i) => (
                <div 
                  key={i} 
                  className={`group relative aspect-video rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                    selectedAsset === url ? "border-primary ring-4 ring-primary/20 shadow-lg scale-[0.98]" : "border-border hover:border-primary/40 focus:outline-none"
                  }`}
                >
                  {/* 点击选择卡片本身进行选取 */}
                  <img src={url} className="w-full h-full object-cover" alt="asset" onClick={() => setSelectedAsset(url)} />
                  
                  {/* 右上角放大按钮，只在 Hover 时出现 */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                     <Button 
                       size="icon" 
                       variant="secondary" 
                       className="h-8 w-8 rounded-full shadow-md backdrop-blur bg-background/80 hover:bg-background"
                       onClick={(e) => {
                         e.stopPropagation()
                         setPreviewImage(url)
                       }}
                       title="放大查看"
                     >
                        <ZoomIn className="h-4 w-4" />
                     </Button>
                  </div>

                  {selectedAsset === url && (
                    <div 
                      className="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none"
                    >
                       <div className="bg-primary text-white p-2 rounded-full shadow-lg">
                          <ImageIcon className="h-6 w-6" />
                       </div>
                    </div>
                  )}
                </div>
              )) : (
                <div className="col-span-full py-32 text-center text-muted-foreground border-2 border-dashed rounded-2xl bg-muted/30">
                  暂无历史素材，请点击右上角上传第一张广告图。
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t mt-4 bg-background">
            <p className="text-sm font-medium text-muted-foreground">
              {selectedAsset ? "已选择 1 个素材" : "请从上方图库中选择一张图片"}
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="lg" onClick={() => onOpenChange(false)}>取消</Button>
              <Button 
                size="lg"
                disabled={!selectedAsset || !activeSlotId || loading} 
                onClick={handleConfirm}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                确定配置该素材
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 沉浸式放大预览层 */}
      <Dialog open={!!previewImage} onOpenChange={(v) => !v && setPreviewImage(null)}>
         <DialogContent className="max-w-[90vw] w-fit p-1 border-none bg-transparent shadow-none overflow-visible">
            <div className="relative flex items-center justify-center bg-black/5 rounded-lg">
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute -top-12 -right-12 rounded-full bg-background/50 hover:bg-background text-white border-none shadow-xl h-10 w-10 backdrop-blur"
                onClick={() => setPreviewImage(null)}
              >
                 <X className="h-5 w-5 text-foreground" />
              </Button>
              {previewImage && (
                <img 
                  src={previewImage} 
                  alt="preview" 
                  className="max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10" 
                />
              )}
            </div>
         </DialogContent>
      </Dialog>
    </>
  )
}
