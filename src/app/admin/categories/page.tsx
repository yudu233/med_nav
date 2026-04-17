"use client"

import { Button } from "@/components/ui/button"

export default function CategoriesAdmin() {
  const categories = [
    { id: "1", name: "心血管科", slug: "cardiology", sort: 1 },
    { id: "2", name: "神经外科", slug: "neurosurgery", sort: 2 },
    { id: "3", name: "肿瘤科", slug: "oncology", sort: 3 }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">分类类目管理</h1>
          <p className="text-muted-foreground mt-1">全局侧边栏和顶栏的资源分类，支持自定义排序控制。</p>
        </div>
        <Button>添加新科室/分类</Button>
      </div>

      <div className="bg-background border rounded-md">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">排序号</th>
              <th className="px-4 py-3 font-medium">显示名称</th>
              <th className="px-4 py-3 font-medium">URL Slug</th>
              <th className="px-4 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{cat.sort}</td>
                <td className="px-4 py-3 font-medium">{cat.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{cat.slug}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Button variant="outline" size="sm">编辑</Button>
                  <Button variant="outline" size="sm" className="text-red-600">删除</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
