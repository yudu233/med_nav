// 服务端组件，连接真实大盘统计数据：
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MousePointerClick, CheckCircle, Clock, Trophy, ExternalLink, Activity } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // 1. 获取所有 Links 概况用于计算和汇总
  const { data: allLinks } = await supabase
    .from('links')
    .select('status, click_count')

  const totalLinks = allLinks?.filter(l => l.status === 'approved').length || 0
  const pendingLinks = allLinks?.filter(l => l.status === 'pending').length || 0
  const totalClicks = allLinks?.reduce((acc, curr) => acc + (curr.click_count || 0), 0) || 0

  // 2. 获取 Top 10 点击量资源榜单
  const { data: topLinks } = await supabase
    .from('links')
    .select('id, title, url, icon_url, description, click_count')
    .eq('status', 'approved')
    .order('click_count', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">监控仪表盘</h1>
        <p className="text-muted-foreground mt-1 text-sm">当前网站全局入库及点击量流量分配统计数据监控大屏</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/20">
            <CardTitle className="text-sm font-medium">生态常驻网站总计</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{totalLinks}</div>
            <p className="text-xs text-muted-foreground mt-1">系统已审核处于上线中</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/20">
            <CardTitle className="text-sm font-medium">待审核排队规模</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-amber-500">{pendingLinks}</div>
            <p className="text-xs text-muted-foreground mt-1">潜在的新发现资源池缓存</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-blue-500/5">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">导流出站总点击量 (PV)</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-blue-500/70 mt-1">通过跳转接口总输出访问计人次</p>
          </CardContent>
        </Card>
      </div>

      {/* 热门点击趋势榜 */}
      <h2 className="text-xl font-bold mt-10 mb-4 flex items-center">
        <Trophy className="w-5 h-5 mr-2 text-yellow-500" /> 最受欢迎热站前 10
      </h2>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-5 py-3 font-medium w-16 text-center text-muted-foreground">座次</th>
                <th className="px-4 py-3 font-medium">站点名称及核心描述</th>
                <th className="px-4 py-3 font-medium text-right text-muted-foreground">累计引流到达 (次)</th>
                <th className="px-5 py-3 font-medium w-24">操作</th>
              </tr>
            </thead>
            <tbody>
              {topLinks && topLinks.length > 0 ? (
                topLinks.map((link, idx) => (
                  <tr key={link.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors group">
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0 ? "bg-yellow-100 text-yellow-700 font-black" :
                        idx === 1 ? "bg-slate-200 text-slate-700" :
                          idx === 2 ? "bg-orange-100 text-orange-800" : "bg-muted text-muted-foreground font-normal"
                        }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 w-full max-w-[400px]">
                        <div className="w-9 h-9 shrink-0 bg-background border rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                          {link.icon_url ? (
                            <img src={link.icon_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ExternalLink className="w-4 h-4 text-muted-foreground/60" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-foreground truncate">{link.title}</h4>
                          <p className="text-xs text-muted-foreground truncate opacity-80 mt-0.5" title={link.description}>
                            {link.description || link.url}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-base font-semibold text-blue-600 dark:text-blue-400">
                      {link.click_count.toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={link.url} target="_blank" rel="noreferrer" className="text-xs flex items-center text-muted-foreground hover:text-primary transition-colors">
                          拜访 <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-muted-foreground border-dashed">
                    目前尚未发生过站内跳转点击交互，还没有产生排行数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  )
}
