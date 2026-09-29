'use strict';

/*
 * 项目数据
 *
 * 项目卡片、站内搜索和独立项目页共用这份数据。
 * slug 必须唯一，并用于 projects.html#slug 锚点。
 */
window.RENFF_PROJECTS = [
  {
    slug: 'bigdog-bark-bark-bark',
    title: 'BigDog Bark Bark Bark',
    kicker: 'C# / Windows tray tool',
    category: 'csharp',
    categoryLabel: 'C#',
    year: '2026',
    status: '持续维护',
    role: '个人工具',
    featured: true,
    summary: '一个免安装的 Windows 托盘工具，用自定义提示音提醒 Codex 任务完成，并可一键管理 Stop Hook。',
    description: '单文件 C# 工具，常驻系统托盘；支持切换提示音、导入音频、开机启动以及安装或移除自己的 Codex Stop Hook。',
    highlights: ['Codex 完成提示音', '托盘快速切换', 'WAV / MP3 等音频导入'],
    cover: './assets/images/project-bigdog.svg',
    coverAlt: 'BigDog Bark Bark Bark 项目封面',
    repository: 'https://github.com/fangfren/BigDog-Bark-Bark-Bark',
    readme: 'https://github.com/fangfren/BigDog-Bark-Bark-Bark#readme',
    tags: ['C#', 'Windows', '.NET Framework', 'Codex']
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
    cover: './assets/images/project-zotero-ai.svg',
    coverAlt: 'Zotero AI Organization 项目封面',
    repository: 'https://github.com/fangfren/Zotero-ai-organization',
    readme: 'https://github.com/fangfren/Zotero-ai-organization#readme',
    tags: ['JavaScript', 'Zotero', 'Codex CLI', 'AI']
  }
];
