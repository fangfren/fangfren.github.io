'use strict';

/*
 * 项目数据
 *
 * 项目卡片、站内搜索和独立项目页共用这份数据。
 * slug 必须唯一，并用于 projects.html#slug 锚点。
 */
window.RENFF_PROJECTS = [
  {
    slug: 'bigdog-woof-woof',
    title: 'BigDog Woof Woof',
    kicker: 'C / Windows shortcut tool',
    category: 'c',
    categoryLabel: 'C',
    year: '2026',
    status: '持续维护',
    role: '个人工具',
    featured: true,
    summary: '一个极轻量的 Windows Codex 完成提示音开关，无托盘、无常驻进程，通过桌面快捷方式快速开关。',
    description: '原生 C 程序，仅管理自己的 Codex Stop Hook；首次运行会创建桌面快捷方式和 Ctrl+Alt+B 快捷键，空闲资源占用为 0。',
    highlights: ['无托盘与常驻进程', '桌面快捷方式开关', 'Ctrl+Alt+B 快速切换'],
    cover: './assets/images/projects/project-bigdog.svg',
    coverAlt: 'BigDog Woof Woof 项目封面',
    repository: 'https://github.com/fangfren/BigDog-Bark-Bark-Bark',
    readme: 'https://github.com/fangfren/BigDog-Bark-Bark-Bark#readme',
    tags: ['C', 'Windows', 'Codex', 'Stop Hook']
  },
  {
    slug: 'zotero-ai-organization',
    title: 'Zotero AI Organization',
    kicker: 'JavaScript / Zotero plugin',
    category: 'javascript',
    categoryLabel: 'JavaScript',
    year: '2026',
    status: '持续维护',
    role: '个人项目',
    featured: true,
    summary: '为 Zotero 增加内嵌 AI 对话，并调用本机 Codex CLI 辅助组织文献与关联说明文档。',
    description: '一个可直接安装的 Zotero 插件，在条目右侧栏提供 AI 对话，并按文献保存独立的多轮 Codex 会话。',
    highlights: ['右侧栏内嵌 AI 对话', '每篇文献独立多轮会话', 'README 导入与条目关联'],
    cover: './assets/images/projects/project-zotero-ai.svg',
    coverAlt: 'Zotero AI Organization 项目封面',
    repository: 'https://github.com/fangfren/Zotero-ai-organization',
    readme: 'https://github.com/fangfren/Zotero-ai-organization#readme',
    tags: ['JavaScript', 'Zotero', 'Codex CLI', 'AI']
  }
];
