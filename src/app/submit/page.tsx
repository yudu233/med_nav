"use client"

import { useState } from "react"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function SubmitPage() {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    // 待对接 Supabase 对应表
    setTimeout(() => {
      setLoading(false)
      toast.success("网址提交成功", {
        description: "感谢您的贡献！您的网址已进入人工审核队列，我们会在24小时内处理。"
      })
      ;(e.target as HTMLFormElement).reset()
    }, 1500)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-2xl flex-1">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">推荐优秀医疗网站</CardTitle>
            <CardDescription>
              发现优质的科研导航、工具、指南或专业资源？欢迎提交给我们。所有数据将经过审核后公开。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  网站名称
                </label>
                <Input required placeholder="例如：PubMed" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  网站链接 (URL)
                </label>
                <Input required type="url" placeholder="例如：https://pubmed.ncbi.nlm.nih.gov/" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  简短描述 (选填)
                </label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="该网站主要面向哪些人群，提供什么核心价值？"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "正在保存中..." : "提交审核"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
