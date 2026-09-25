'use strict';

const posts = Array.isArray(window.RENFF_BLOG_POSTS)
  ? window.RENFF_BLOG_POSTS
  : [];
const articleCard = document.querySelector('[data-article-card]');
const articleNotFound = document.querySelector('[data-article-not-found]');
const articleCover = document.querySelector('[data-article-cover]');
const articleCoverImage = document.querySelector('[data-article-cover-image]');
const articleCategory = document.querySelector('[data-article-category]');
const articleDate = document.querySelector('[data-article-date]');
const articleReadingTime = document.querySelector('[data-article-reading-time]');
const articleTitle = document.querySelector('[data-article-title]');
const articleSummary = document.querySelector('[data-article-summary]');
const articleTags = document.querySelector('[data-article-tags]');
const articleContent = document.querySelector('[data-article-content]');
const articleRelated = document.querySelector('[data-article-related]');
const articleRelatedList = document.querySelector('[data-article-related-list]');
const descriptionMeta = document.querySelector('meta[name="description"]');
const canonicalLink = document.querySelector('link[rel="canonical"]');
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return Number.isNaN(date.getTime()) ? dateString : dateFormatter.format(date);
}

function setMeta(selector, attribute, value) {
  const element = document.querySelector(selector);

  if (element && value) {
    element.setAttribute(attribute, value);
  }
}

function getArticleUrl(post) {
  return new URL(post.url || './blog.html?slug=' + encodeURIComponent(post.slug), window.location.href).href;
}

function updateStructuredData(post, articleUrl) {
  const existing = document.querySelector('#article-structured-data');

  if (existing) {
    existing.remove();
  }

  const script = document.createElement('script');
  script.id = 'article-structured-data';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary || '',
    datePublished: post.date,
    dateModified: post.updated || post.date,
    inLanguage: 'zh-CN',
    mainEntityOfPage: articleUrl,
    image: post.cover ? new URL(post.cover, window.location.href).href : undefined,
    author: {
      '@type': 'Person',
      name: 'Renff Space',
      url: 'https://fangfren.github.io/'
    },
    publisher: {
      '@type': 'Person',
      name: 'Renff Space',
      url: 'https://fangfren.github.io/'
    },
    keywords: [post.category].concat(post.tags || []).filter(Boolean).join(', ')
  });

  document.head.appendChild(script);
}

function renderTags(post) {
  const tags = [post.category].concat(post.tags || []).filter(Boolean);
  articleTags.replaceChildren();

  tags.forEach(function (tag) {
    const item = document.createElement('li');
    item.textContent = tag;
    articleTags.appendChild(item);
  });

  articleTags.hidden = tags.length === 0;
}

function renderRelatedPosts(post) {
  if (!articleRelated || !articleRelatedList) {
    return;
  }

  const postTags = new Set([post.category].concat(post.tags || []).filter(Boolean));
  const related = posts
    .filter(function (item) {
      return item.slug !== post.slug;
    })
    .map(function (item) {
      const overlap = [item.category].concat(item.tags || []).filter(function (tag) {
        return postTags.has(tag);
      }).length;

      return { post: item, score: overlap };
    })
    .sort(function (first, second) {
      return second.score - first.score;
    })
    .slice(0, 2);

  if (!related.length) {
    articleRelated.hidden = true;
    return;
  }

  related.forEach(function (entry) {
    const link = document.createElement('a');
    link.href = entry.post.url || './blog.html?slug=' + encodeURIComponent(entry.post.slug);

    const category = document.createElement('span');
    category.textContent = entry.post.category || 'Blog';

    const title = document.createElement('strong');
    title.textContent = entry.post.title;

    link.append(category, title);
    articleRelatedList.appendChild(link);
  });

  articleRelated.hidden = false;
}

const slug = new URLSearchParams(window.location.search).get('slug');
const post = posts.find(function (item) {
  return item.slug === slug;
});

if (!post) {
  articleCard.hidden = true;
  articleNotFound.hidden = false;
} else {
  document.title = post.title + ' | Renff Space';

  if (descriptionMeta) {
    descriptionMeta.setAttribute('content', post.summary || post.title);
  }

  const articleUrl = getArticleUrl(post);
  setMeta('meta[property="og:title"]', 'content', post.title);
  setMeta('meta[property="og:description"]', 'content', post.summary || post.title);
  setMeta('meta[property="og:url"]', 'content', articleUrl);
  setMeta('meta[property="og:image"]', 'content', post.cover ? new URL(post.cover, window.location.href).href : '');
  setMeta('meta[name="twitter:title"]', 'content', post.title);
  setMeta('meta[name="twitter:description"]', 'content', post.summary || post.title);
  setMeta('meta[name="twitter:image"]', 'content', post.cover ? new URL(post.cover, window.location.href).href : '');

  if (canonicalLink) {
    canonicalLink.setAttribute('href', articleUrl);
  }

  articleCategory.textContent = post.category || 'Blog';
  articleDate.dateTime = post.date;
  articleDate.textContent = formatDate(post.date);
  articleReadingTime.textContent = post.readingTime || '';
  articleTitle.textContent = post.title;
  articleSummary.textContent = post.summary || '';
  renderTags(post);
  articleContent.innerHTML = post.content || '<p>这篇文章还没有正文。</p>';
  renderRelatedPosts(post);
  updateStructuredData(post, articleUrl);

  if (post.cover) {
    articleCoverImage.addEventListener('error', function () {
      articleCover.hidden = true;
    }, { once: true });
    articleCoverImage.src = post.cover;
    articleCoverImage.alt = post.coverAlt || post.title;
    articleCover.hidden = false;
  } else {
    articleCover.hidden = true;
  }
}
