# fangfren.github.io

fangfren 的个人主页：个人简介、博客文章与公开项目入口。

线上地址：<https://fangfren.github.io/>

## 发布文章

Markdown 博文放在 `content/posts/`，Word 或 PDF 稿件放在 `content/sources/`。所有文章都登记在 `content/articles.json`。
发布一篇新文章只需要两步，全部可以在 GitHub 网页上完成：

1. 打开对应目录，选择 **Add file → Upload files** 上传稿件。Markdown 的配图可以按文章归档到 `src/assets/images/blog/<slug>/`，在正文和封面字段中使用 `./assets/images/blog/<slug>/文件名`。
2. 编辑 `content/articles.json`，在 `articles` 数组里加一行。

```json
{
  "articles": [
    { "file": "content/sources/2026-10-31-fmcw-note.docx" }
  ]
}
```

提交后，GitHub Actions 会自动构建并部署，通常 1–3 分钟上线。

文件名按 `YYYY-MM-DD-slug.docx` / `YYYY-MM-DD-slug.pdf` 命名时，日期和文章地址
（`/posts/slug.html`）会自动推导，slug 只能使用小写字母、数字和连字符。需要指定标题、
分类、标签、摘要或封面时再补字段：

```json
{
  "file": "content/sources/2026-10-31-fmcw-note.docx",
  "slug": "fmcw-note",
  "title": "FMCW 学习笔记",
  "date": "2026-10-31",
  "category": "光电信号",
  "tags": ["FMCW", "激光雷达"],
  "summary": "一句话摘要。",
  "cover": "assets/images/blog/cover.svg",
  "coverAlt": "封面说明",
  "readingTime": "8 分钟"
}
```

封面文件放在 `src/assets/images/` 下，但 `cover` 写站点路径，例如
`assets/images/blog/cover.svg`（构建时会复制到 `dist/assets/images/`）。

清单字段以 `articles.json` 为准；已有的 Markdown 文章仍可从 front matter 读取缺省值，
但推荐把元数据统一写在清单里。`draft: true` 可以暂不发布。

### 支持的文件格式

| 格式 | 网页呈现 | 说明 |
| --- | --- | --- |
| `.docx` | 转换成网页正文 + 静态 KaTeX 公式 | Word **原生公式**（插入 → 公式）可以转成 LaTeX；MathType、截图或墨迹公式会以图片形式保留 |
| `.pdf` | 内嵌 PDF 查看器 + 下载 + 文本搜索 | 公式与排版 100% 保真；构建时用 PDF.js 提取文本用于站内搜索 |
| `.md` | 直接渲染 Markdown + LaTeX | 公式保真度最高，适合手写 |

Word 转换由构建时的 `pandoc` 完成。个别复杂公式（矩阵、分段函数、对齐环境）可能需要
人工检查。MathType、截图或墨迹公式常以 EMF/WMF 图片保存，浏览器无法显示，请先在
Word 中另存为 PNG/SVG 再插入。如果某篇 Word 的转换结果不理想，可以放一个同名 `.md`
到 `content/posts/` 并在清单中改指向它。

## 目录结构

```text
.
├── .github/workflows/deploy.yml   # 构建 + 部署到 GitHub Pages
├── content/
│   ├── articles.json              # 文章清单（发布时只改这里）
│   ├── posts/                     # Markdown 博文
│   └── sources/                   # 上传的 .docx / .pdf
├── scripts/
│   ├── generate-content.mjs       # 生成 posts、RSS、sitemap、搜索数据
│   └── serve.mjs                  # 本地预览
├── src/
│   ├── index.html                 # 首页
│   ├── projects.html              # 项目页
│   ├── search.html                # 全站搜索页
│   ├── templates/post.html        # 文章页模板
│   └── assets/                    # CSS、JS、图片
├── dist/                          # 构建产物（不提交）
├── package.json
└── pnpm-lock.yaml
```

`dist/`、`node_modules/`、`MAINTENANCE.local.md` 不会提交到仓库。

## 本地开发

需要 Node.js 22+、pnpm 9 和 pandoc（只有转换 `.docx` 时需要）。

```bash
pnpm install
pnpm build      # 生成 dist/
pnpm preview    # http://localhost:4173/
```

`pnpm build` 会检查清单、渲染公式、生成 RSS/sitemap、给 CSS/JS 加内容指纹，并校验
所有本地资源引用；任何一项失败都会以非零状态退出。

## 部署

推送到 `main` 后由 `.github/workflows/deploy.yml` 自动构建并部署。仓库的
**Settings → Pages → Source** 必须设置为 **GitHub Actions**（不是分支）。

## 第三方来源

页面基于 [codewithsadee/vcard-personal-portfolio](https://github.com/codewithsadee/vcard-personal-portfolio)
修改。原模板的必要版权与 MIT 许可声明保留在
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。

本仓库不声明整体许可证。
