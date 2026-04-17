"use client"

import { Button } from "@/components/ui/button"

export default function AdsAdmin() {
  const adSlots = [
    { id: "header", name: "首页顶部通栏", active: true, target_url: "https://example.com/ad1" },
    { id: "sidebar", name: "侧边栏中置", active: false, target_url: "" },
    { id: "list", name: "瀑布流列表注入", active: true, target_url: "https://example.com/ad2" }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">广告位管理</h1>
          <p className="text-muted-foreground mt-1">控制预留的医疗广告资源位置。您可以替换图片及重定向链接。</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {adSlots.map(slot => (
          <div key={slot.id} className="relative flex flex-col rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6 pb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold leading-none tracking-tight">{slot.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${slot.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {slot.active ? '运行中' : '已停用'}
                </span>
              </div>
              <div className="aspect-video w-full rounded-md bg-muted flex items-center justify-center text-muted-foreground border-dashed border-2">
                点击上传广告大图
              </div>
            </div>
            <div className="p-6 pt-0 mt-auto">
              <label className="text-sm font-medium text-muted-foreground block mb-1">外链地址 URL</label>
              <input 
                type="text" 
                className="w-full text-sm p-2 border rounded bg-background mb-4" 
                defaultValue={slot.target_url} 
                placeholder="https://"
              />
              <Button className="w-full" variant={slot.active ? "secondary" : "default"}>
                {slot.active ? "下架广告" : "保存并上线"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
