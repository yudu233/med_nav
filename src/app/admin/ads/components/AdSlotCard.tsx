"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Power, PowerOff, Save, ImageIcon, ZoomIn, X, ImagePlus } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface AdSlotCardProps {
  slot: any
  onOpenLibrary: () => void
  onSaveUrl: (id: string, url: string) => Promise<void>
  onToggleStatus: (id: string, currentStatus: boolean) => Promise<void>
}

export function AdSlotCard({
  slot,
  onOpenLibrary,
  onSaveUrl,
  onToggleStatus
}: AdSlotCardProps) {
  // 本地持有一个受控状态用于输入框打字，防止改变父组件数组导致失焦
  const [targetUrl, setTargetUrl] = useState(slot.target_url || '')
  // 负责预览本卡片已有图片的弹窗
  const [showPreview, setShowPreview] = useState(false)

  const isHeader = slot.slot_name === 'header'
  const isSidebar = slot.slot_name === 'sidebar'
  const slotTitle = isHeader ? '首页顶部通栏' : isSidebar ? '侧边栏挂件' : '列表间隙广告'

  return (
    <>
      <div className="relative flex flex-col rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all border-border/60">
        <div className="p-6 pb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-base">{slotTitle}</h3>
            <div className={`px-2 py-0.5 text-[10px] font-black uppercase rounded border ${slot.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-zinc-50 text-zinc-400 border-zinc-200"
              }`}>
              {slot.is_active ? "Live" : "Idle"}
            </div>
          </div>

          <div className="group relative aspect-video w-full rounded-xl bg-muted border-2 border-dashed border-border/80 flex items-center justify-center overflow-hidden transition-all hover:border-primary/50">
            {slot.image_url ? (
              <img src={slot.image_url} alt="ads" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-primary transition-all cursor-pointer" onClick={onOpenLibrary}>
                <ImageIcon className="h-12 w-12 opacity-30" />
                <span className="text-xs font-semibold">点击选择素材</span>
              </div>
            )}

            {/* 悬浮操作层 */}
            {slot.image_url && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <Button variant="secondary" size="sm" className="h-9 font-bold bg-white/90 hover:bg-white text-black" onClick={onOpenLibrary}>
                  <ImagePlus className="w-4 h-4 mr-2" />
                  去图库换图
                </Button>
                <Button variant="outline" size="sm" className="h-9 font-bold bg-black/50 hover:bg-black/80 text-white border-white/20" onClick={() => setShowPreview(true)}>
                  <ZoomIn className="w-4 h-4 mr-2" />
                  放大预览
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 pt-0 mt-auto space-y-5">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">跳转地址</label>
              <Button variant="ghost" size="icon" className="h-5 w-5 hover:text-primary" onClick={() => onSaveUrl(slot.id, targetUrl)}>
                <Save className="h-3 w-3" />
              </Button>
            </div>
            <input
              type="text"
              className="w-full text-xs p-2.5 rounded-lg border bg-background focus:ring-1 focus:ring-primary outline-none"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <Button
            className="w-full text-xs font-bold h-11"
            variant={slot.is_active ? "secondary" : "default"}
            onClick={() => onToggleStatus(slot.id, slot.is_active)}
          >
            {slot.is_active ? <PowerOff className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" />}
            {slot.is_active ? "临时停止投放" : "保存并立即上线"}
          </Button>
        </div>
      </div>

      {/* 点击放大查看图卡的弹窗 - 精简后的样式 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent 
          showCloseButton={false}
          className="w-[85vw] h-[75vh] p-0 border-none bg-black/70 shadow-none overflow-hidden flex items-center justify-center rounded-[2.5rem]"
        >
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-6 right-6 z-50 rounded-full bg-white/10 hover:bg-white/20 text-white h-12 w-12 backdrop-blur-md"
              onClick={() => setShowPreview(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            {slot.image_url && (
              <div className="w-[80%] h-[80%] flex items-center justify-center">
                <img
                  src={slot.image_url}
                  alt="preview"
                  className="max-w-full max-h-full w-auto h-auto object-contain shadow-2xl rounded-2xl transition-transform duration-300 pointer-events-none"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
