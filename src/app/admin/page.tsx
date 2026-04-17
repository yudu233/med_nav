// 服务端组件，后续接 Supabase 获取真实统计：
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MousePointerClick, CheckCircle, Clock } from "lucide-react"

export default async function AdminDashboard() {

  // 后期这里将用 async fetch supabase 来获取整体大满贯数据
  const stats = {
    totalLinks: 345,
    pendingLinks: 12,
    totalClicks: 8402,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">面板监控</h1>
        <p className="text-muted-foreground mt-1">这里可查看网站当前的宏观表现数据</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总收录网址数</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLinks}</div>
            <p className="text-xs text-muted-foreground mt-1">已稳定上架展示</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待审核排队</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{stats.pendingLinks}</div>
            <p className="text-xs text-muted-foreground mt-1">来自网友的最新提交</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">全站总出站点击</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.totalClicks}</div>
            <p className="text-xs text-muted-foreground mt-1">累计重定向人次</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
