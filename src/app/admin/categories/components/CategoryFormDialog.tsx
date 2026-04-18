"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface Category {
  id: string
  name: string
  slug: string
  sort: number
}

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Category | null
  onSubmit: (data: Omit<Category, 'id'>) => Promise<void>
}

export function CategoryFormDialog({ open, onOpenChange, initialData, onSubmit }: CategoryFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    sort: 0
  })

  // 同步外部传入的数据
  useEffect(() => {
    if (initialData && open) {
      setFormData({
        name: initialData.name || "",
        slug: initialData.slug || "",
        sort: initialData.sort || 0
      })
    } else if (!initialData && open) {
      setFormData({ name: "", slug: "", sort: 0 })
    }
  }, [initialData, open])

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      // 简单拦截，后续页面会有 sonner 提示
      return
    }
    setLoading(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? '编辑分类' : '新增分类'}</DialogTitle>
          <DialogDescription>
            管理您的内容分类信息。URL Slug 用于前端页面的地址分配，务必保证它是英文与中划线的组合。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="sort" className="text-right text-sm font-medium">排序权重</label>
            <Input 
              id="sort" 
              type="number" 
              value={formData.sort} 
              onChange={e => setFormData(prev => ({ ...prev, sort: Number(e.target.value) }))} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right text-sm font-medium">显示名称</label>
            <Input 
              id="name" 
              placeholder="例如：心血管科"
              value={formData.name} 
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="slug" className="text-right text-sm font-medium">URL Slug</label>
            <Input 
              id="slug" 
              placeholder="例如：cardiology"
              value={formData.slug} 
              onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} 
              className="col-span-3 font-mono text-sm" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.name || !formData.slug}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? '保存更改' : '确认添加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
