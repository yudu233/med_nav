"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LinksAdmin() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending')

  // 虚拟数据
  const mockLinks = [
    { id: "1", title: "中国抗癌协会", url: "https://www.caca.org.cn/", status: "pending", created_at: "2024-01-01" },
    { id: "2", title: "NEJM 新英格兰", url: "https://www.nejm.org/", status: "approved", created_at: "2023-12-15" }
  ]

  const displayLinks = mockLinks.filter(l => l.status === activeTab)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">网址池管理</h1>
          <p className="text-muted-foreground mt-1">审批网友提交并维护现存网址。</p>
        </div>
        <Button>直接新增网址</Button>
      </div>

      <div className="flex space-x-2 border-b pb-2">
        <Button 
          variant={activeTab === 'pending' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('pending')}
        >
          待审核
        </Button>
        <Button 
          variant={activeTab === 'approved' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('approved')}
        >
          已上线
        </Button>
      </div>

      <div className="bg-background border rounded-md">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">名称</th>
              <th className="px-4 py-3 font-medium">URL</th>
              <th className="px-4 py-3 font-medium">提交时间</th>
              <th className="px-4 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {displayLinks.length > 0 ? displayLinks.map(link => (
              <tr key={link.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{link.title}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <a href={link.url} target="_blank" className="hover:underline">{link.url}</a>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{link.created_at}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  {link.status === "pending" && (
                    <Button variant="outline" size="sm" className="text-green-600">通过</Button>
                  )}
                  <Button variant="outline" size="sm" className="text-red-600">删除</Button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
