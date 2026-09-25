'use strict';

/*
 * 项目数据
 *
 * 项目卡片、站内搜索和独立项目页共用这份数据。
 * slug 必须唯一，并用于 projects.html#slug 锚点。
 */
window.RENFF_PROJECTS = [
  {
    slug: 'practice-minigame',
    title: 'Practice_minigame',
    kicker: 'Python / Mini game',
    category: 'python',
    categoryLabel: 'Python',
    year: '2026',
    status: '持续维护',
    role: '个人练习',
    featured: true,
    summary: '用 Python 实现一个包含状态更新、分支判断和循环控制的命令行小游戏。',
    description: '这个项目把基础语法放进了一个可运行的小型状态机里，用实际流程练习函数拆分、输入处理和游戏状态更新。',
    highlights: ['命令行状态机', '函数与模块拆分', '输入校验'],
    cover: './assets/images/project-python.svg',
    coverAlt: 'Practice_minigame 项目封面',
    repository: 'https://github.com/fangfren/Practice_minigame',
    readme: 'https://github.com/fangfren/Practice_minigame#readme',
    tags: ['Python', 'CLI', 'Game logic']
  },
  {
    slug: 'practice-git',
    title: 'PracticeGit',
    kicker: 'C / Version control',
    category: 'c',
    categoryLabel: 'C',
    year: '2026',
    status: '持续维护',
    role: '个人练习',
    featured: true,
    summary: '通过 C 语言练习和 Git 工作流记录，整理编译流程、程序结构与版本管理。',
    description: '从单文件程序开始，逐步记录编译、调试、提交和分支操作，让每次练习都有可以追溯的上下文。',
    highlights: ['C 基础程序结构', '编译与调试', 'Git 提交习惯'],
    cover: './assets/images/project-c.svg',
    coverAlt: 'PracticeGit 项目封面',
    repository: 'https://github.com/fangfren/PracticeGit',
    readme: 'https://github.com/fangfren/PracticeGit#readme',
    tags: ['C', 'Git', 'Fundamentals']
  }
];
