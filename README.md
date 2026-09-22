# renff-space.github.io

Renff Space 的个人主页，使用静态 HTML、CSS 和 JavaScript 构建。

页面会自动跟随浏览器的深浅色设置，并同步浏览器地址栏主题色。

## 内容

- 个人简介与当前学习方向
- 个人博客文章列表与详情阅读
- 公开项目入口
- GitHub 联系方式

## 发布博客

博客文章配置在 [`assets/js/blog-posts.js`](./assets/js/blog-posts.js)。复制其中的文章
对象即可新增内容，页面会自动生成时间线和内容卡片、按日期排序，并在点击卡片后打开详情弹窗。

## 本地预览

可以直接打开 `index.html`，或在项目目录运行：

```bash
python -m http.server 8000
```

然后访问 `http://localhost:8000`。

## 部署

仓库名必须是 `renff-space.github.io`。GitHub Pages 从 `main` 分支根目录发布静态文件。

## 第三方来源

页面基于 [codewithsadee/vcard-personal-portfolio](https://github.com/codewithsadee/vcard-personal-portfolio)
修改。原模板的必要版权与 MIT 许可声明保留在
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。

本仓库不声明整体许可证。
