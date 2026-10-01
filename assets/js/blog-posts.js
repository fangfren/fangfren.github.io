/*
 * 博客文章配置
 *
 * 新增文章时，复制一个大括号中的文章对象即可，页面会按 date 从新到旧排序。
 * slug 必须是唯一值，并且只能使用小写字母、数字和连字符。
 * cover 路径统一写成 ./assets/images/文件名，文件名大小写必须和磁盘一致。
 * content 可以直接写 HTML，下面示例中用到的标签都有对应的页面样式。
 */
window.RENFF_BLOG_POSTS = [
  {
    slug: 'bigdog-woof-woof',
    title: 'BigDog Woof Woof：给 Codex 任务完成加一声提示音',
    date: '2026-10-01',
    category: '项目复盘',
    tags: ['C', 'Windows', 'Codex', '效率工具'],
    readingTime: '6 分钟',
    summary: '一个极轻量的 Windows Codex 完成提示音开关，原生 C 实现，无托盘、无常驻进程，只保留一个桌面快捷方式。',
    cover: './assets/images/project-bigdog.svg',
    coverAlt: 'BigDog Woof Woof 项目封面',
    url: './posts/bigdog-woof-woof.html',
    content: `
      <p>
        BigDog Woof Woof 是一个极轻量的 Windows Codex 完成提示音开关。它的目标很简单：
        当 Codex 任务完成时，用一声“汪”提醒我回来查看结果。
      </p>
      <p>
        这个想法来自一个很实际的问题。任务运行期间，我通常会切去处理别的事情，
        但代码任务结束的时间和时长并不固定。如果一直盯着窗口，效率很低；如果完全不管，
        又可能错过下一轮需要确认的步骤。
      </p>
      <h3>为什么不做成托盘常驻</h3>
      <p>
        这类工具只在任务完成时短暂工作，没有必要长期占用后台资源。v2.0.1 已经移除托盘和
        常驻进程，主程序改为原生 C 实现，空闲常驻内存为 0，只在 Stop Hook 触发时运行。
      </p>
      <h3>目前能做什么</h3>
      <ul>
        <li>原生 C 程序，无托盘、无常驻进程。</li>
        <li>首次运行自动安装或修复 Codex Stop Hook。</li>
        <li>创建一个名为“Codex 提示音”的桌面快捷方式作为开关。</li>
        <li>支持双击快捷方式或按 Ctrl+Alt+B 快速切换。</li>
        <li>提供 Codex Stop Hook 的安装和移除入口。</li>
        <li>使用外置 MP3，替换文件即可更换提示音。</li>
      </ul>
      <h3>快捷方式和 Stop Hook</h3>
      <p>
        首次运行 BigDogBark.exe 后，程序会复制文件到 %LOCALAPPDATA%\BigDogBark，
        写入自己的 Stop Hook，并在桌面创建快捷方式。Codex 完成任务后，Hook 调用程序播放 MP3，
        处理完成后立即退出，不会留下后台进程。
      </p>
      <p>
        快捷方式名称会显示当前状态：Codex 提示音 - 开启或 Codex 提示音 - 关闭。
        关闭自定义提示音后，Codex 默认通知行为会保留。
      </p>
      <h3>资源占用</h3>
      <p>
        主程序约 25 KB，外置 MP3 约 71 KB。Hook 进程通常在 0.1–0.3 秒内退出，
        音频播放子进程约 3 秒后退出，空闲常驻内存为 0。
      </p>
      <h3>安装和卸载</h3>
      <p>
        下载 BigDogBark-portable.zip 后解压，双击 BigDogBark.exe，无需安装器。
        首次运行完成后，重启 Codex 并在 /hooks 中信任一次
        BigDogBark.exe --hook 即可。卸载时可以运行 --uninstall，
        程序只会移除自己的 Hook，并保留其他 Hook 和 Computer Use 配置。
      </p>
      <p>
        项目源码和使用说明见
        <a href="https://github.com/fangfren/BigDog-Bark-Bark-Bark" target="_blank" rel="noopener noreferrer">
          GitHub 仓库
        </a>。
      </p>
    `
  }
];
