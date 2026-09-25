import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteUrl = 'https://fangfren.github.io/';
const siteName = 'Renff Space';
const siteDescription = '记录代码、学习与持续创造。';
const siteEmail = 'renf502@163.com';
const defaultFeedImage = 'assets/images/profile_photo.png';
const postsScriptPath = path.join(projectRoot, 'assets', 'js', 'blog-posts.js');
const templatePath = path.join(projectRoot, 'templates', 'post.html');

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeXml(value) {
  return escapeHtml(value)
    .replaceAll('&#39;', '&apos;');
}

function cdata(value) {
  return '<![CDATA[' + String(value || '').replaceAll(']]>', ']]]]><![CDATA[>') + ']]>';
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Shanghai'
  }).format(new Date(dateString + 'T00:00:00+08:00'));
}

function toAbsoluteUrl(value) {
  return new URL(value.replace(/^\.\//, ''), siteUrl).href;
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

  return 'image/webp';
}

function absolutizeHtmlUrls(value) {
  return String(value || '').replace(
    /\b(src|href)=(["'])(\.\/[^"']+)\2/g,
    function (match, attribute, quote, relativeUrl) {
      return attribute + '=' + quote + toAbsoluteUrl(relativeUrl) + quote;
    }
  );
}

function renderFeedContent(post) {
  const image = getPostImage(post);
  const cover = [
    '<figure>',
    '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(post.coverAlt || post.title) + '">',
    '</figure>'
  ].join('');

  return cover + absolutizeHtmlUrls(post.content || '<p>这篇文章还没有正文。</p>');
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
  const image = post.cover ? toAbsoluteUrl(post.cover) : siteUrl + 'assets/images/home-scenery.webp';
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
      name: 'Renff Space',
      url: siteUrl
    },
    publisher: {
      '@type': 'Person',
      name: 'Renff Space',
      url: siteUrl
    },
    keywords: [post.category].concat(post.tags || []).filter(Boolean).join(', ')
  };

  const replacements = {
    '{{TITLE}}': escapeHtml(post.title),
    '{{SUMMARY}}': escapeHtml(post.summary || ''),
    '{{URL}}': escapeHtml(postUrl),
    '{{IMAGE}}': escapeHtml(image),
    '{{DATE}}': escapeHtml(post.date),
    '{{DATE_LABEL}}': escapeHtml(formatDate(post.date)),
    '{{READING_TIME}}': escapeHtml(post.readingTime || ''),
    '{{CATEGORY}}': escapeHtml(post.category || 'Blog'),
    '{{CONTENT}}': post.content || '<p>这篇文章还没有正文。</p>',
    '{{TAGS}}': renderTags(post),
    '{{RELATED}}': renderRelated(post, posts),
    '{{STRUCTURED_DATA}}': JSON.stringify(structuredData).replaceAll('<', '\\u003c'),
    '{{COVER}}': escapeHtml(post.cover ? post.cover.replace(/^\.\//, '../') : ''),
    '{{COVER_ALT}}': escapeHtml(post.coverAlt || post.title),
    '{{COVER_HIDDEN}}': post.cover ? '' : ' hidden'
  };

  return Object.keys(replacements).reduce(function (result, token) {
    return result.replaceAll(token, replacements[token]);
  }, template);
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
    { loc: siteUrl + 'blog.html', lastmod: posts[0]?.date }
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

const postsSource = await fs.readFile(postsScriptPath, 'utf8');
const context = { window: {} };
vm.runInNewContext(postsSource, context, { filename: postsScriptPath });
const posts = context.window.RENFF_BLOG_POSTS
  .slice()
  .sort(function (first, second) {
    return new Date(second.date) - new Date(first.date);
  });
const template = await fs.readFile(templatePath, 'utf8');
const postsDirectory = path.join(projectRoot, 'posts');

await fs.mkdir(postsDirectory, { recursive: true });

for (const post of posts) {
  await fs.writeFile(
    path.join(postsDirectory, post.slug + '.html'),
    renderPost(template, post, posts),
    'utf8'
  );
}

await fs.writeFile(path.join(projectRoot, 'feed.xml'), renderFeed(posts), 'utf8');
await fs.writeFile(path.join(projectRoot, 'sitemap.xml'), renderSitemap(posts), 'utf8');
await fs.writeFile(
  path.join(projectRoot, 'robots.txt'),
  'User-agent: *\nAllow: /\n\nSitemap: ' + siteUrl + 'sitemap.xml\n',
  'utf8'
);

console.log('Generated ' + posts.length + ' post pages, feed.xml, sitemap.xml and robots.txt.');
