import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDirectory = path.join(projectRoot, 'src');
const contentDirectory = path.join(projectRoot, 'content');
const postsSourceDirectory = path.join(contentDirectory, 'posts');
const sourcesDirectory = path.join(contentDirectory, 'sources');
const manifestPath = path.join(contentDirectory, 'articles.json');
const templatePath = path.join(srcDirectory, 'templates', 'post.html');
const distDirectory = path.join(projectRoot, 'dist');

const siteUrl = 'https://fangfren.github.io/';
const siteName = 'Renff Space';
const siteDescription = '记录代码、学习与持续创造。';
const siteEmail = 'renf502@163.com';
const defaultFeedImage = 'assets/images/profile/profile_photo.png';
const searchTextLimit = 2000;

const require = createRequire(import.meta.url);
const katexPackagePath = require.resolve('katex/package.json');
const katexDistributionPath = path.join(path.dirname(katexPackagePath), 'dist');
const pandocCommand = process.env.PANDOC || 'pandoc';

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex, { throwOnError: true, strict: 'warn' })
  .use(rehypeStringify);

const supportedTypes = new Map([
  ['.md', 'markdown'],
  ['.markdown', 'markdown'],
  ['.docx', 'docx'],
  ['.pdf', 'pdf']
]);

function fail(message) {
  throw new Error(message);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeXml(value) {
  return escapeHtml(value).replaceAll('&#39;', '&apos;');
}

function cdata(value) {
  return '<![CDATA[' + String(value || '').replaceAll(']]>', ']]]]><![CDATA[>') + ']]>';
}

function decodeEntities(value) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' '
  };

  return String(value || '')
    .replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp);/g, function (match) {
      return entities[match];
    })
    .replace(/&#x([0-9a-f]+);/gi, function (match, code) {
      return String.fromCodePoint(parseInt(code, 16));
    })
    .replace(/&#(\d+);/g, function (match, code) {
      return String.fromCodePoint(Number(code));
    });
}

function stripHtml(value) {
  return decodeEntities(String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<span class="katex-mathml">[\s\S]*?<\/span>/gi, ' ')
    .replace(/<annotation\b[^>]*>[\s\S]*?<\/annotation>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function clipText(value, limit) {
  const text = String(value || '').trim();

  if (text.length <= limit) {
    return text;
  }

  return text.slice(0, limit).trimEnd() + '…';
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Shanghai'
  }).format(new Date(dateString + 'T00:00:00+08:00'));
}

function normalizeDate(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value || '').trim().slice(0, 10);
}

function isValidDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

function estimateReadingTime(text) {
  const characters = String(text || '').replace(/\s+/g, '').length;
  return Math.max(1, Math.ceil(characters / 400)) + ' 分钟';
}

function resolveInsideProject(relativePath) {
  const absolutePath = path.resolve(projectRoot, relativePath);
  const relative = path.relative(projectRoot, absolutePath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    fail('文件必须位于仓库目录内：' + relativePath);
  }

  return absolutePath;
}

function normalizeCover(value) {
  const cover = String(value || '').trim().replaceAll('\\', '/');

  if (!cover || /^(?:https?:|data:)/.test(cover)) {
    return cover;
  }

  return './' + cover.replace(/^\.\//, '').replace(/^\/+/, '');
}

function toAbsoluteUrl(value) {
  return new URL(String(value || '').replace(/^\.\//, '').replace(/^\/+/, ''), siteUrl).href;
}

function toPostRelativeUrl(value) {
  const target = String(value || '');

  if (/^(?:https?:|data:)/.test(target)) {
    return target;
  }

  return '../' + target.replace(/^\.\//, '').replace(/^\/+/, '');
}

function inferType(file) {
  const extension = path.extname(file).toLowerCase();
  const type = supportedTypes.get(extension);

  if (!type) {
    fail('不支持的文件类型：' + path.basename(file) + '（支持 .md / .docx / .pdf）');
  }

  return type;
}

function slugFromFile(file) {
  const base = path.basename(file, path.extname(file))
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return base;
}

function dateFromFile(file) {
  const match = path.basename(file).match(/^(\d{4}-\d{2}-\d{2})-/);
  return match ? match[1] : '';
}

function firstHeading(markdown) {
  const match = String(markdown || '').match(/^#\s+(.+?)\s*$/m);
  return match ? match[1] : '';
}

function normalizeTags(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(function (tag) {
    return String(tag).trim();
  }).filter(Boolean);
}

async function readManifest() {
  let raw;

  try {
    raw = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  } catch (error) {
    fail('无法读取 content/articles.json：' + error.message);
  }

  if (!raw || !Array.isArray(raw.articles)) {
    fail('content/articles.json 必须包含 articles 数组。');
  }

  return raw.articles;
}

async function renderMarkdown(markdown) {
  const result = await markdownProcessor.process(markdown);
  return String(result);
}

function rewriteMarkdownAssetUrls(html) {
  return String(html || '')
    .replace(/\b(src|href)=(["'])\.\/assets\//g, '$1=$2../assets/')
    .replace(/\b(src|href)=(["'])assets\//g, '$1=$2../assets/');
}

function rewriteDocxMediaUrls(html, slug) {
  return String(html || '').replace(
    /\b(src|href)=(["'])(?:\.\/)?media\//g,
    '$1=$2../assets/images/posts/' + slug + '/'
  );
}

function normalizeDocxMarkdown(markdown) {
  const protectedBlocks = [];
  const protect = function (match) {
    protectedBlocks.push(match);
    return '\u0000PROTECTED' + (protectedBlocks.length - 1) + '\u0000';
  };

  return String(markdown || '')
    .replace(/```[\s\S]*?```/g, protect)
    .replace(/`[^`\n]+`/g, protect)
    .replace(/(!\[[^\]]*\]\([^)\n]*\))\{[^}\n]*\}/g, '$1')
    .replace(/\$\$([\s\S]+?)\$\$/g, function (match, body) {
      return '\n\n$$\n' + body.trim() + '\n$$\n\n';
    })
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\u0000PROTECTED(\d+)\u0000/g, function (match, index) {
      return protectedBlocks[Number(index)];
    });
}

function absolutizeHtmlUrls(value) {
  return String(value || '').replace(
    /\b(src|href)=(["'])((?:\.\.\/|\.\/)?assets\/[^"']+)\2/g,
    function (match, attribute, quote, relativeUrl) {
      return attribute + '=' + quote + toAbsoluteUrl(relativeUrl.replace(/^(?:\.\.\/)+/, '')) + quote;
    }
  );
}

async function convertDocx(file, slug, workDirectory) {
  const markdownPath = path.join(workDirectory, 'article.md');

  try {
    execFileSync(pandocCommand, [
      file,
      '--from=docx',
      '--to=markdown+tex_math_dollars+pipe_tables+raw_html',
      '--wrap=none',
      '--extract-media=.',
      '--output=article.md'
    ], { cwd: workDirectory, stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (error) {
    const detail = error.stderr ? error.stderr.toString().trim() : error.message;
    fail('pandoc 转换失败（' + path.basename(file) + '）：' + detail);
  }

  const markdown = await fs.readFile(markdownPath, 'utf8');
  const mediaDirectory = path.join(workDirectory, 'media');
  const mediaTarget = path.join(distDirectory, 'assets', 'images', 'posts', slug);

  if (existsSync(mediaDirectory)) {
    await fs.cp(mediaDirectory, mediaTarget, { recursive: true });

    const unsupportedImages = (await walk(mediaDirectory)).filter(function (file) {
      return /\.(?:emf|wmf)$/i.test(file);
    });

    if (unsupportedImages.length > 0) {
      console.warn('警告：文章 ' + slug + ' 包含浏览器无法显示的 EMF/WMF 图片，请改用 PNG 或 SVG。');
    }
  }

  return markdown;
}

async function extractPdfText(file) {
  try {
    const { extractText, getDocumentProxy } = await import('unpdf');
    const buffer = await fs.readFile(file);
    const document = await getDocumentProxy(new Uint8Array(buffer));
    const result = await extractText(document, { mergePages: true });
    return String(result.text || '');
  } catch (error) {
    console.warn('警告：无法提取 PDF 文本（' + path.basename(file) + '）：' + error.message);
    return '';
  }
}

function renderPdfContent(post, pdfUrl, text) {
  const details = text ? [
    '<details class="pdf-text">',
    '<summary>文本版（供搜索与无障碍阅读）</summary>',
    '<pre>' + escapeHtml(clipText(text, searchTextLimit * 4)) + '</pre>',
    '</details>'
  ].join('') : '';

  return [
    '<p class="pdf-note">本文以 PDF 原文发布，公式与排版保持原样。</p>',
    '<div class="pdf-embed">',
    '<iframe src="' + escapeHtml(pdfUrl) + '" title="' + escapeHtml(post.title) + '" loading="lazy"></iframe>',
    '</div>',
    '<p class="pdf-actions">',
    '<a class="pdf-download" href="' + escapeHtml(pdfUrl) + '" download>下载 PDF 原文</a>',
    '</p>',
    details
  ].join('');
}

async function loadArticle(entry, index) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    fail('articles[' + index + '] 必须是一个对象。');
  }

  if (entry.draft === true) {
    return null;
  }

  if (typeof entry.file !== 'string' || !entry.file.trim()) {
    fail('articles[' + index + '] 缺少 file 字段。');
  }

  const file = resolveInsideProject(entry.file.trim().replaceAll('\\', '/'));

  if (!existsSync(file)) {
    fail('articles[' + index + '] 指向的文件不存在：' + entry.file);
  }

  const type = inferType(file);
  const slug = String(entry.slug || '').trim() || slugFromFile(file);

  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    fail('文章 ' + entry.file + ' 的 slug 无效："' + slug + '"。请在 articles.json 中指定由小写字母、数字和连字符组成的 slug。');
  }

  let frontMatter = {};
  let markdown = '';

  if (type === 'markdown') {
    const parsed = matter(await fs.readFile(file, 'utf8'));
    frontMatter = parsed.data || {};
    markdown = parsed.content;
  }

  const date = normalizeDate(entry.date || frontMatter.date || dateFromFile(file));

  if (!isValidDate(date)) {
    fail('文章 ' + entry.file + ' 缺少有效日期。请在 articles.json 中填写 date，或把文件名写成 2026-10-31-slug.docx。');
  }

  const title = String(entry.title || frontMatter.title || '').trim();
  const category = String(entry.category || frontMatter.category || '未分类').trim();
  const summary = String(entry.summary || frontMatter.summary || '').trim();
  const readingTime = String(entry.readingTime || frontMatter.readingTime || '').trim();
  const cover = normalizeCover(entry.cover || frontMatter.cover || '');
  const coverAlt = String(entry.coverAlt || frontMatter.coverAlt || '').trim();
  const rawTags = entry.tags === undefined ? (frontMatter.tags || []) : entry.tags;

  if (!Array.isArray(rawTags)) {
    fail('文章 ' + entry.file + ' 的 tags 必须是数组，例如 ["FMCW", "激光雷达"]。');
  }

  const tags = normalizeTags(rawTags);
  const updated = normalizeDate(entry.updated || frontMatter.updated || '');

  if (updated && !isValidDate(updated)) {
    fail('文章 ' + entry.file + ' 的 updated 日期无效："' + updated + '"。请使用 YYYY-MM-DD。');
  }

  return {
    slug,
    type,
    file,
    date,
    updated,
    title,
    category,
    summary,
    readingTime,
    cover,
    coverAlt,
    tags,
    markdown
  };
}

async function buildArticle(article, workRoot) {
  const post = Object.assign({}, article);
  let contentHtml = '';
  let searchText = '';

  try {
    await renderArticleContent(post, workRoot);
  } catch (error) {
    if (String(error.message || '').startsWith('文章 ' + post.slug + ' 构建失败')) {
      throw error;
    }

    fail('文章 ' + post.slug + ' 构建失败：' + (error.message || error));
  }

  contentHtml = post.content;
  searchText = post.searchText;

  const formulaError = String(contentHtml).match(/class="katex-error"[^>]*title="([^"]*)"/);

  if (formulaError) {
    fail('文章 ' + post.slug + ' 的公式无法渲染：' + decodeEntities(formulaError[1]));
  }

  const fullSearchText = searchText || stripHtml(contentHtml);
  searchText = clipText(fullSearchText, searchTextLimit);
  post.title = post.title || post.slug;
  post.summary = post.summary || clipText(fullSearchText, 120);
  post.readingTime = post.readingTime || estimateReadingTime(fullSearchText);
  post.coverAlt = post.coverAlt || post.title;
  post.content = contentHtml;
  post.searchText = searchText;
  post.url = './posts/' + post.slug + '.html';

  return post;
}

async function renderArticleContent(post, workRoot) {
  let contentHtml = '';
  let searchText = '';

  if (post.type === 'markdown') {
    post.title = post.title || firstHeading(post.markdown) || post.slug;
    contentHtml = rewriteMarkdownAssetUrls(await renderMarkdown(post.markdown));
  } else if (post.type === 'docx') {
    const workDirectory = path.join(workRoot, 'docx-' + post.slug);
    await fs.mkdir(workDirectory, { recursive: true });
    const markdown = normalizeDocxMarkdown(await convertDocx(post.file, post.slug, workDirectory));
    post.title = post.title || firstHeading(markdown) || post.slug;
    contentHtml = rewriteDocxMediaUrls(await renderMarkdown(markdown), post.slug);
  } else {
    post.title = post.title || post.slug;
    const pdfName = post.slug + '.pdf';
    const pdfTargetDirectory = path.join(distDirectory, 'files');
    await fs.mkdir(pdfTargetDirectory, { recursive: true });
    await fs.copyFile(post.file, path.join(pdfTargetDirectory, pdfName));
    post.pdfName = pdfName;
    const pdfUrl = '../files/' + encodeURIComponent(pdfName);
    const text = await extractPdfText(post.file);
    searchText = text;
    contentHtml = renderPdfContent(post, pdfUrl, text);
  }

  post.content = contentHtml;
  post.searchText = searchText;
}

function renderTags(post) {
  return [post.category].concat(post.tags || []).filter(Boolean).map(function (tag) {
    return '<li>' + escapeHtml(tag) + '</li>';
  }).join('');
}

function getRelatedPosts(post, posts) {
  const tags = new Set([post.category].concat(post.tags || []).filter(Boolean));

  return posts
    .filter(function (item) {
      return item.slug !== post.slug;
    })
    .map(function (item) {
      const score = [item.category].concat(item.tags || []).filter(function (tag) {
        return tags.has(tag);
      }).length;
      return { item, score };
    })
    .sort(function (first, second) {
      return second.score - first.score;
    })
    .slice(0, 2);
}

function renderRelated(post, posts) {
  return getRelatedPosts(post, posts).map(function (entry) {
    return [
      '<a href="./' + escapeHtml(entry.item.slug) + '.html">',
      '<span>' + escapeHtml(entry.item.category || 'Blog') + '</span>',
      '<strong>' + escapeHtml(entry.item.title) + '</strong>',
      '</a>'
    ].join('');
  }).join('');
}

function renderPost(template, post, posts) {
  const postUrl = getPostUrl(post);
  const image = post.cover ? toAbsoluteUrl(post.cover) : siteUrl + 'assets/images/home/home-scenery.webp';
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary || '',
    datePublished: post.date,
    dateModified: post.updated || post.date,
    inLanguage: 'zh-CN',
    mainEntityOfPage: postUrl,
    image: image,
    author: {
      '@type': 'Person',
      name: siteName,
      url: siteUrl
    },
    publisher: {
      '@type': 'Person',
      name: siteName,
      url: siteUrl
    },
    keywords: [post.category].concat(post.tags || []).filter(Boolean).join(', ')
  };

  if (post.type === 'pdf') {
    structuredData.associatedMedia = {
      '@type': 'MediaObject',
      contentUrl: toAbsoluteUrl('files/' + encodeURIComponent(post.pdfName)),
      encodingFormat: 'application/pdf'
    };
  }

  const replacements = {
    '{{TITLE}}': escapeHtml(post.title),
    '{{SUMMARY}}': escapeHtml(post.summary || ''),
    '{{URL}}': escapeHtml(postUrl),
    '{{IMAGE}}': escapeHtml(image),
    '{{DATE}}': escapeHtml(post.date),
    '{{DATE_LABEL}}': escapeHtml(formatDate(post.date)),
    '{{READING_TIME}}': escapeHtml(post.readingTime || ''),
    '{{CATEGORY}}': escapeHtml(post.category || 'Blog'),
    '{{CONTENT}}': rewriteMarkdownAssetUrls(post.content || '<p>这篇文章还没有正文。</p>'),
    '{{TAGS}}': renderTags(post),
    '{{RELATED}}': renderRelated(post, posts),
    '{{STRUCTURED_DATA}}': JSON.stringify(structuredData).replaceAll('<', '\\u003c'),
    '{{COVER}}': escapeHtml(post.cover ? toPostRelativeUrl(post.cover) : ''),
    '{{COVER_ALT}}': escapeHtml(post.coverAlt || post.title),
    '{{COVER_HIDDEN}}': post.cover ? '' : ' hidden'
  };

  const rendered = Object.keys(replacements).reduce(function (result, token) {
    return result.replaceAll(token, replacements[token]);
  }, template);

  const leftoverToken = Object.keys(replacements).find(function (token) {
    return rendered.includes(token);
  });

  if (leftoverToken) {
    fail('文章模板仍有未替换的占位符 ' + leftoverToken + '：' + post.slug);
  }

  return rendered;
}

function getPostUrl(post) {
  return toAbsoluteUrl(post.url || 'posts/' + post.slug + '.html');
}

function getPostImage(post) {
  return toAbsoluteUrl(post.cover || defaultFeedImage);
}

function getImageType(url) {
  const extension = new URL(url).pathname.split('.').pop().toLowerCase();

  if (extension === 'jpg' || extension === 'jpeg') {
    return 'image/jpeg';
  }

  if (extension === 'png') {
    return 'image/png';
  }

  if (extension === 'gif') {
    return 'image/gif';
  }

  if (extension === 'avif') {
    return 'image/avif';
  }

  if (extension === 'svg') {
    return 'image/svg+xml';
  }

  if (extension === 'webp') {
    return 'image/webp';
  }

  if (extension === 'ico') {
    return 'image/x-icon';
  }

  return 'image/webp';
}

function renderFeedContent(post) {
  const image = getPostImage(post);
  const cover = [
    '<figure>',
    '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(post.coverAlt || post.title) + '">',
    '</figure>'
  ].join('');

  if (post.type === 'pdf') {
    return [
      cover,
      '<p>' + escapeHtml(post.summary || '') + '</p>',
      '<p><a href="' + escapeHtml(getPostUrl(post)) + '">查看 PDF 原文</a></p>'
    ].join('');
  }

  return cover + absolutizeHtmlUrls(post.content || '<p>这篇文章还没有正文。</p>');
}

function renderFeed(posts) {
  const latestPost = posts[0];
  const latestDate = latestPost ? latestPost.updated || latestPost.date : '';
  const latestPubDate = latestDate
    ? new Date(latestDate + 'T00:00:00+08:00').toUTCString()
    : new Date().toUTCString();
  const copyrightYear = latestDate
    ? new Date(latestDate + 'T00:00:00+08:00').getFullYear()
    : new Date().getFullYear();

  const items = posts.map(function (post) {
    const postUrl = getPostUrl(post);
    const image = getPostImage(post);
    const imageType = getImageType(image);
    const pubDate = new Date(post.date + 'T00:00:00+08:00').toUTCString();
    const categories = [post.category].concat(post.tags || []).filter(Boolean).map(function (tag) {
      return '      <category>' + escapeXml(tag) + '</category>';
    }).join('\n');
    const enclosure = post.type === 'pdf'
      ? '      <enclosure url="' + escapeXml(toAbsoluteUrl('files/' + encodeURIComponent(post.pdfName))) +
        '" type="application/pdf" length="' + post.fileSize + '" />'
      : '';

    return [
      '    <item>',
      '      <title>' + escapeXml(post.title) + '</title>',
      '      <link>' + escapeXml(postUrl) + '</link>',
      '      <guid isPermaLink="true">' + escapeXml(postUrl) + '</guid>',
      '      <pubDate>' + pubDate + '</pubDate>',
      categories,
      '      <author>' + siteEmail + ' (' + siteName + ')</author>',
      '      <dc:creator><![CDATA[' + siteName + ']]></dc:creator>',
      '      <description>' + cdata(post.summary || '') + '</description>',
      '      <content:encoded>' + cdata(renderFeedContent(post)) + '</content:encoded>',
      enclosure,
      '      <media:content url="' + escapeXml(image) + '" medium="image" type="' + imageType + '">',
      '        <media:title type="plain">' + escapeXml(post.title) + '</media:title>',
      '      </media:content>',
      '      <media:thumbnail url="' + escapeXml(image) + '" />',
      '    </item>'
    ].filter(Boolean).join('\n');
  }).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">',
    '  <channel>',
    '    <title>' + siteName + '</title>',
    '    <link>' + siteUrl + '</link>',
    '    <description>' + siteDescription + '</description>',
    '    <language>zh-CN</language>',
    '    <lastBuildDate>' + latestPubDate + '</lastBuildDate>',
    '    <pubDate>' + latestPubDate + '</pubDate>',
    '    <generator>Renff Space static content generator</generator>',
    '    <copyright>Copyright ' + copyrightYear + ' ' + siteName + '</copyright>',
    '    <managingEditor>' + siteEmail + ' (' + siteName + ')</managingEditor>',
    '    <webMaster>' + siteEmail + ' (' + siteName + ')</webMaster>',
    '    <ttl>1440</ttl>',
    '    <image>',
    '      <url>' + toAbsoluteUrl(defaultFeedImage) + '</url>',
    '      <title>' + siteName + '</title>',
    '      <link>' + siteUrl + '</link>',
    '    </image>',
    '    <atom:link href="' + siteUrl + 'feed.xml" rel="self" type="application/rss+xml"/>',
    items,
    '  </channel>',
    '</rss>',
    ''
  ].join('\n');
}

function renderSitemap(posts) {
  const urls = [
    { loc: siteUrl, lastmod: posts[0]?.date },
    { loc: siteUrl + 'projects.html', lastmod: posts[0]?.date },
    { loc: siteUrl + 'search.html', lastmod: posts[0]?.date }
  ].concat(posts.map(function (post) {
    return {
      loc: getPostUrl(post),
      lastmod: post.updated || post.date
    };
  }));

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls.map(function (entry) {
      return [
        '  <url>',
        '    <loc>' + escapeXml(entry.loc) + '</loc>',
        entry.lastmod ? '    <lastmod>' + escapeXml(entry.lastmod) + '</lastmod>' : '',
        '  </url>'
      ].filter(Boolean).join('\n');
    }).join('\n'),
    '</urlset>',
    ''
  ].join('\n');
}

function serializePosts(posts) {
  const serialized = posts.map(function (post) {
    return {
      slug: post.slug,
      title: post.title,
      date: post.date,
      updated: post.updated,
      category: post.category,
      tags: post.tags,
      readingTime: post.readingTime,
      summary: post.summary,
      cover: post.cover,
      coverAlt: post.coverAlt,
      url: post.url,
      type: post.type,
      searchText: post.searchText
    };
  });

  return [
    '/* This file is generated by scripts/generate-content.mjs. */',
    '/* Edit content/articles.json instead. */',
    'window.RENFF_BLOG_POSTS = ' + JSON.stringify(serialized, null, 2) + ';',
    ''
  ].join('\n');
}

async function copyStaticFiles() {
  await fs.copyFile(path.join(srcDirectory, 'index.html'), path.join(distDirectory, 'index.html'));
  await fs.copyFile(path.join(srcDirectory, 'projects.html'), path.join(distDirectory, 'projects.html'));
  await fs.copyFile(path.join(srcDirectory, 'search.html'), path.join(distDirectory, 'search.html'));

  const katexSourceDirectory = path.join(srcDirectory, 'assets', 'vendor');

  await fs.cp(path.join(srcDirectory, 'assets'), path.join(distDirectory, 'assets'), {
    recursive: true,
    filter: function (source) {
      return path.resolve(source) !== katexSourceDirectory;
    }
  });
}

async function copyKatexAssets() {
  const targetDirectory = path.join(distDirectory, 'assets', 'vendor', 'katex');
  const targetFonts = path.join(targetDirectory, 'fonts');
  await fs.mkdir(targetFonts, { recursive: true });

  const css = await fs.readFile(path.join(katexDistributionPath, 'katex.min.css'), 'utf8');
  const trimmedCss = css.replace(
    /,url\(fonts\/[^)]+\.(?:woff|ttf)\)\s*format\("(?:woff|truetype)"\)/g,
    ''
  );
  await fs.writeFile(path.join(targetDirectory, 'katex.min.css'), trimmedCss, 'utf8');

  const fontEntries = await fs.readdir(path.join(katexDistributionPath, 'fonts'), { withFileTypes: true });

  for (const entry of fontEntries) {
    if (entry.isFile() && entry.name.endsWith('.woff2')) {
      await fs.copyFile(
        path.join(katexDistributionPath, 'fonts', entry.name),
        path.join(targetFonts, entry.name)
      );
    }
  }
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(absolutePath));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

function hashFile(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 10);
}

async function fingerprintAssets() {
  const assetFiles = (await walk(path.join(distDirectory, 'assets'))).filter(function (file) {
    return file.endsWith('.css') || file.endsWith('.js');
  });
  const hashes = new Map();

  for (const file of assetFiles) {
    const key = path.relative(distDirectory, file).split(path.sep).join('/');
    hashes.set(key, hashFile(await fs.readFile(file)));
  }

  const htmlFiles = (await walk(distDirectory)).filter(function (file) {
    return file.endsWith('.html');
  });
  const referencePattern = /\b(href|src)=(["'])((?:\.\.\/|\.\/)?assets\/[^"'?#]+\.(?:css|js))(["'])/g;

  for (const file of htmlFiles) {
    const source = await fs.readFile(file, 'utf8');
    const rewritten = source.replace(referencePattern, function (match, attribute, quote, reference, closingQuote) {
      const key = reference.replace(/^(?:\.\.\/|\.\/)+/, '');
      const hash = hashes.get(key);
      return hash
        ? attribute + '=' + quote + reference + '?v=' + hash + closingQuote
        : match;
    });

    if (rewritten !== source) {
      await fs.writeFile(file, rewritten, 'utf8');
    }
  }
}

async function checkLocalReferences() {
  const missing = [];
  const htmlFiles = (await walk(distDirectory)).filter(function (file) {
    return file.endsWith('.html');
  });
  const cssFiles = (await walk(distDirectory)).filter(function (file) {
    return file.endsWith('.css');
  });
  const attributePattern = /\b(?:src|href)=(["'])([^"']+)\1/g;
  const cssUrlPattern = /url\((["']?)([^"')]+)\1\)/g;

  function checkReference(file, reference) {
    const value = String(reference || '').trim();

    if (!value || value.startsWith('#') || value.startsWith('//') ||
        /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(value)) {
      return;
    }

    const clean = decodeEntities(value.split(/[?#]/)[0]);

    if (!clean) {
      return;
    }

    let decoded = clean;

    try {
      decoded = decodeURIComponent(clean);
    } catch (error) {
      decoded = clean;
    }

    const target = decoded.startsWith('/')
      ? path.join(distDirectory, decoded)
      : path.resolve(path.dirname(file), decoded);

    if (!existsSync(target)) {
      missing.push(path.relative(distDirectory, file) + ' -> ' + value);
    }
  }

  for (const file of htmlFiles) {
    const source = await fs.readFile(file, 'utf8');
    let match;

    while ((match = attributePattern.exec(source)) !== null) {
      checkReference(file, match[2]);
    }

    attributePattern.lastIndex = 0;
  }

  for (const file of cssFiles) {
    const source = await fs.readFile(file, 'utf8');
    let match;

    while ((match = cssUrlPattern.exec(source)) !== null) {
      checkReference(file, match[2]);
    }

    cssUrlPattern.lastIndex = 0;
  }

  if (missing.length > 0) {
    fail('发现 ' + missing.length + ' 个本地资源引用不存在：\n  ' + missing.join('\n  '));
  }
}

async function main() {
  const workRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'renff-build-'));

  try {
    await fs.rm(distDirectory, { recursive: true, force: true });
    await fs.mkdir(distDirectory, { recursive: true });
    await fs.mkdir(sourcesDirectory, { recursive: true });

    const entries = await readManifest();
    const loaded = [];

    for (let index = 0; index < entries.length; index += 1) {
      const article = await loadArticle(entries[index], index);

      if (article) {
        loaded.push(article);
      }
    }

    const seenSlugs = new Set();

    for (const article of loaded) {
      if (seenSlugs.has(article.slug)) {
        fail('slug 重复：' + article.slug);
      }

      seenSlugs.add(article.slug);
    }

    const posts = [];

    for (const article of loaded) {
      posts.push(await buildArticle(article, workRoot));
    }

    for (const post of posts) {
      if (post.type === 'pdf') {
        post.fileSize = (await fs.stat(post.file)).size;
      }
    }

    posts.sort(function (first, second) {
      return new Date(second.updated || second.date) - new Date(first.updated || first.date);
    });

    const template = await fs.readFile(templatePath, 'utf8');
    const postsDirectory = path.join(distDirectory, 'posts');
    await fs.mkdir(postsDirectory, { recursive: true });

    await copyStaticFiles();
    await copyKatexAssets();

    for (const post of posts) {
      await fs.writeFile(
        path.join(postsDirectory, post.slug + '.html'),
        renderPost(template, post, posts),
        'utf8'
      );
    }

    await fs.writeFile(
      path.join(distDirectory, 'assets', 'js', 'blog-posts.js'),
      serializePosts(posts),
      'utf8'
    );

    await fs.writeFile(path.join(distDirectory, 'feed.xml'), renderFeed(posts), 'utf8');
    await fs.writeFile(path.join(distDirectory, 'sitemap.xml'), renderSitemap(posts), 'utf8');
    await fs.writeFile(
      path.join(distDirectory, 'robots.txt'),
      'User-agent: *\nAllow: /\n\nSitemap: ' + siteUrl + 'sitemap.xml\n',
      'utf8'
    );

    await fingerprintAssets();
    await checkLocalReferences();

    console.log('Generated ' + posts.length + ' post pages into dist/.');
    console.log('Sources: ' + posts.map(function (post) {
      return post.slug + ' (' + post.type + ')';
    }).join(', '));
  } finally {
    await fs.rm(workRoot, { recursive: true, force: true });
  }
}

main().catch(function (error) {
  console.error(error.message || error);
  process.exitCode = 1;
});
