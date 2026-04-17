# MedNav - 医疗全栈导航平台开发计划

该计划概述了 MedNav (医疗全栈导航) 平台的技术架构、核心功能实现路径和逐步开发流程。平台采用 Next.js (App Router) + TypeScript + Tailwind CSS 构建前端，搭配 Supabase 提供后端数据、Auth 与存储支持，并最终部署于 Vercel。

## 用户审核必看 (User Review Required)

> [!IMPORTANT]
> - **技术栈确认**：我们将使用 Next.js 15 App Router，结合 Shadcn UI 及 Framer Motion。请确认是否全部无误。
> - **鉴权设计**：管理后台 (`/admin` 路径) 将严格受 Supabase Auth 保护，默认只有注册为 Admin 角色的用户才能访问。
> - **医疗主题色建议**：设计系统默认将采用极简洁净风格。日间模式的主色将定义为“临床蓝 (`#0070f3`)”，并辅以轻量视觉阴影；暗黑模式主色定义为“静谧黑/深灰蓝”，减轻科研人员夜间使用的视觉疲劳。 

## 1. 数据库架构设计 (Supabase Schema)

我们将基于 PostgreSQL 构建以下核心表结构：

*   **`categories` (分类表)**
    *   `id` (UUID, Primary Key)
    *   `name` (String) - 分类名称 (如：心血管科、科研工具)
    *   `slug` (String) - 路由标识 (如：cardiology)
    *   `icon` (String) - 图标标识名
    *   `sort_order` (Int) - 显示优先级
*   **`links` (导航网址表)**
    *   `id` (UUID, Primary Key)
    *   `category_id` (Foreign Key -> categories)
    *   `title` (String) - 网站标题
    *   `url` (String) - 目标链接
    *   `description` (Text) - 简介
    *   `icon_url` (String) - 网站图标 URL
    *   `click_count` (Int, 默认 0) - 点击量
    *   `status` (Enum: pending, approved, rejected) - 审核状态 (用户提交默认为 pending)
    *   `created_at` (Timestamp)
*   **`ads` (广告位表)**
    *   `id` (UUID, Primary Key)
    *   `slot_name` (Enum: header, sidebar, list) - 广告位标识
    *   `image_url` (String) - 广告图片地址 (存于 Supabase Storage)
    *   `target_url` (String) - 跳转地址
    *   `is_active` (Boolean) - 是否启用

## 2. 前端架构与路由规划 (Next.js App Router)

### 客户端展示区 (Public)
*   **`/` (首页)**: 顶栏导航 + 侧边栏分类树 + 网址卡片瀑布流（融合广告位 `header` 和较后的 `list` 广告）。
*   **`/category/[slug]` (分类详情)**: 某一特定领域的网址大全。
*   **`/submit` (网址提交)**: 表单页，提供给访客/用户自主提交，提交后落库状态为 `pending`。
*   **`/redirect/[id]` (内部跳转路由)**: 一个纯服务端的路由处理器 (Route Handler)，点击任意外部链接时，先请求到此接口使 `click_count + 1`，然后 `302 Redirect` 到真实的 `url`。

### 管理后台 (Admin - 需授权)
*   **`/admin` (仪表盘)**: 大盘统计组件 (网站总展示、网址数、待审提交数、总点击量)。
*   **`/admin/links`**: 审核提交网址，支持编辑标题、URL和排序，增删改查。
*   **`/admin/ads`**: 广告位映射管理（上传/覆盖广告图、配置链接、控制上线）。
*   **`/admin/categories`**: 科室分类的增删改和拖拽排序。

## 3. UI/UX 体验与组件设计

1.  **极简医疗设计系统 (Design System)**
    *   全面接入 **Shadcn UI**：提取 `Button`, `Card`, `Dialog`, `Form`, `Input`, `Toaster` 等基本组件。
    *   **暗黑模式 (Dark Mode)**：提供 `next-themes` 用于头部快捷切换。
2.  **关键组件说明**
    *   `AdSlot`：传入 `slot_name`，自动向服务器请求有效的广告并在预设尺寸渲染。
    *   `LinkCard`：展示链接的 Logo，标题与说明。鼠标 Hover 时呈现 Framer Motion 的微抬升动画。
    *   `AnimatedList`：采用 Framer Motion `AnimatePresence` 处理分类切换与内容加载时的淡入淡出。
3.  **响应式适配策略**
    *   **Mobile**：侧边栏 `Sidebar` 在小于 `md` 尺寸时将转变为底部的抽屉菜单 (Bottom Sheet / Drawer) 或顶部的折叠汉堡菜单，以方便手机和平板用户单手操作。

## 4. 实施阶段拆解 (Execution Steps)

1.  **阶段一：项目初始化**
    *   通过 `npx create-next-app` 初始化项目。
    *   配置 Tailwind 主题颜色、接入 Shadcn UI 基础环境。
    *   设置 Supabase 客户端，创建并连通基础表结构。
2.  **阶段二：公共页面开发**
    *   构建全站 Layout、侧边导航布局以及头部设置区 (含主题切换)。
    *   构建网址卡片 `LinkCard`。
    *   实现首页、分类页的数据 Fetch 及展示。
    *   实现 `/redirect` 接口用以记录点击。
    *   实现 `/submit` 页以及相关的后端入库逻辑。
3.  **阶段三：管理后台开发**
    *   实现 Supabase Auth 登录与管理员权限中间件校验。
    *   构建 Admin Layout 数据展示面板。
    *   构建 Links, Categories, Ads 管理页面并接通后端数据增删改查逻辑。
4.  **阶段四：细节打磨与测试**
    *   接入 Framer Motion 补齐视效和微交互。
    *   移动端样式地毯式优化。
    *   检查广告位分发逻辑正确性。

## 待确认的问题 (Open Questions)

> [!WARNING]
> - 管理员账号我们应该直接在 Supabase 后台手动创建并通过授权表赋权，还是你需要我在前台提供一个超级管理员的初始注册入口？
> - 对于外部网站的 favicon 抓取，我计划优先调用 `https://www.google.com/s2/favicons?domain=...` 解析获取，如果不清晰或拿不到则显示我们预设的医疗占位图标。您觉得是否可行？

---

请您阅读以上计划，并在认为方向正确时向我提供审批意见，之后我将正式开始项目代码的构建。
