# Xiaowu 晨间简报

个人晨间科技 / AI 短读博客。公开要闻归档；私有仓库动态与本机扫描只出现在私聊，不上站。

站点标题：**Xiaowu 晨间简报** · 技术栈：Astro + Tailwind（静态导出）。

## 本地开发

需要 Node.js `>= 22.0.0`（22.x LTS）。

```bash
npm install
npm run dev
```

浏览器打开提示的本地地址（默认 `http://localhost:4321`）。

```bash
npm run build    # 产出到 dist/
npm run preview  # 预览构建结果
```

## 内容约定

每日简报放在：

```text
content/briefs/YYYY-MM-DD.md
```

Frontmatter：

```yaml
---
title: 晨间短简报 · 11/9
date: 2026-11-09
summary: 一句话摘要，出现在首页卡片与 SEO description。
sample: false   # 脚手架示例才标 true
---
```

正文用 Markdown。仅写**可公开**的科技 / AI 要闻；不要写入个人仓 PR、本机路径或内网信息。

## Vercel 部署

1. 在 [Vercel](https://vercel.com) 导入本仓库 `shiroixw/morning-brief`
2. Framework Preset 选 **Astro**（或保持自动检测）
3. Build Command：`npm run build` · Output Directory：`dist`
4. 部署后把生产域名回填到 `astro.config.mjs` 的 `site` 字段（可选，利于绝对 URL / OG）

推送到 `main` 即触发重新部署。晨间例程写入 `content/briefs/` 并提交后，官网会更新。

## 设计说明

编辑风、克制排版：纸色底、墨色字、赤陶强调色；Noto Serif / Sans SC；充足留白与细分割线；移动优先。刻意避开霓虹渐变与「AI 模板」视觉。
