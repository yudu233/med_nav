# MedNav 项目核心上下文

> 这是系统层面的全局感知地图。为了减少 token 消耗并避免幻觉错误，AI 助手在进行任何架构变动或大范围重构前，请以本文档为当前真相来源 (Single Source of Truth)。

## 1. 技术栈 (Tech Stack)

*   **核心框架**: Next.js 16 (App Router), React 19, TypeScript 5
*   **后端服务 (BaaS)**: Supabase 
    *   客户端/服务端集成依赖: `@supabase/ssr`, `@supabase/supabase-js`
*   **样式与现代 UI**: 
    *   引擎: Tailwind CSS v4
    *   组件库: Shadcn UI (基于 `@base-ui/react` 及 Radix 思想)
    *   动效与图标: Framer Motion, Lucide React (`lucide-react`)
    *   基础保障: Next-themes (原生支持无闪烁的亮/暗主题切换), `tailwind-merge`, `clsx`, `class-variance-authority`

## 2. 核心 API 与 数据结构 (Core API & Data Structures)

主要围绕 Supabase 进行建表和存储。根据项目内现有的后台页面推演，核心数据结构为：

*   **Links (网址/导航流)**
    *   主要字段包括: `id`, `title`, `url`, `status` (如 'pending' | 'approved'), `category_id` (关联科室或类别), `created_at`
*   **Categories (分类类目 / 医疗科室)**
    *   主要字段包括: `id`, `name` (显示名称), `slug` (URL别名), `sort` (排序号权重)
*   **Ads (广告位 / 推广位)**
    *   预设数据结构需包括位置标识、点击跳转 URL 及素材等。
*   **Auth 与鉴权体系**
    *   基于 `src/utils/supabase/middleware.ts` 搭建拦截层，分离管理端(Admin)验证与游客操作。

## 3. 已完成的功能 (Completed Features)

*   **基建与路由层**: 标准化搭建了基于 App Router 的目录树。
*   **全局样式与主题**: 完成 `globals.css` 变量定义，以及全局 `ThemeProvider` 的接入。
*   **Supabase Client 封装**: 在 `src/utils/supabase/` 下完成了 server, client 与 middleware 的实例化包装，随时准备向远端鉴权并交互。
*   **Admin 后台 UI 骨架**:
    *   `/admin/links`: 网址列表及审核面板（当前展示 Mock 状态）。
*   **前端核心呈现区 (C 端)**: 用户前台已经关联真实的 Supabase 分类与链接流（自动过滤 status 不匹配的内容）。
    *   `/admin/categories`: 对侧边结构、医科类别进行可视化增删改查的页卡（**已完成：完整接入 Supabase 进行 CRUD，并利用右侧 Sheet 抽屉实现特定类目下的沉浸式网址管理**）。
    *   `/admin/ads`: 广告赞助位已完成组件拆分 (AssetLibraryDialog / AdSlotCard)，解决了弹框大小受限问题，并实现了素材原图的沉浸式放大预览功能。

## 4. 正在进行中的功能 (Work In Progress)

*(暂无进行中的特定大型 Feature)*

## 5. 待开发的功能 (To-Do / Backlog)

*   **用户侧主动提交**: 允许非登录用户（或网友）提交 URL 申请（将数据写入 `Links` 表，并标记 `status`为 `pending` 供管理员审核）。
*   **流量与点击追踪**: 用户通过 MedNav 出站跳转到外部站点的中间拦截打点，以及对应的数据统计表盘。
*   **全量 API 接入**: 目前首要任务是将 `supabase` 实例的方法接入，对 `/admin/` 目录下的项目列表进行真实数据 CRUD 替换（替换现有的 Mock Array）。

## 6. 代码与样式规范 (Code & Style Guidelines)

为了避免不同大模型造成代码碎片化，遵守以下规约：

*   **Server / Client 明确划分**: 含有副作用和状态 (Hook) 的组件严守顶层 `"use client"`；展示级并需要良好 SEO 的全景页面优先选用 Server Component 以减小客户端 Bundle Size。
*   **样式必须收敛**:
    *   绝不使用 Inline Style (`style={{ ... }}`)。
    *   类名拼接必须使用框架内预配的 `cn()` 方法 (`clsx` + `twMerge`)。
*   **组件原子化**: 复用度高的组件全部通过 `shadcn` CLI 导入并汇聚在 `src/components/ui/` 下，严禁到处散落原生 HTML 标签去写死 CSS 属性。
*   **安全与中间件**: 后台页面 (以 `/admin` 起始的路由) 会被 `middleware.ts` 拦截，并判定 supabase session 信息确保数据安全。

## 7. AI 协作约定与同步记忆机制 (AI Collaboration & Memory Sync)

**这是针对 AI 助手的强制性指令：**

为了保持该文件的时效性，扮演架构师角色的 AI 必须开启**全局同步记忆引擎**：
*   **状态同步**：每当一个新功能（Feature）、接口（API）或者数据表（Schema）开发完成并通过验证，**AI 必须主动且第一时间**更新本文档结构。
*   **流转机制**：将刚刚开发好的功能从“正在进行中的功能”、“待开发的功能”中移除，并将其加入“已完成的功能”列表中。
*   **契约精神**：如果有新的核心 API 接口被定义或修改，也必须同步更新本文档中 `# 2. 核心 API 与 数据结构` 区域。
*   *此步骤不需用户提示，需在每一个 Milestone 结束时自发执行。*
