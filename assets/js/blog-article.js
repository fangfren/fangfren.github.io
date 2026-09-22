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
const articleContent = document.querySelector('[data-article-content]');
const descriptionMeta = document.querySelector('meta[name="description"]');
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return Number.isNaN(date.getTime()) ? dateString : dateFormatter.format(date);
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

  articleCategory.textContent = post.category || 'Blog';
  articleDate.dateTime = post.date;
  articleDate.textContent = formatDate(post.date);
  articleReadingTime.textContent = post.readingTime || '';
  articleTitle.textContent = post.title;
  articleSummary.textContent = post.summary || '';
  articleContent.innerHTML = post.content || '<p>这篇文章还没有正文。</p>';

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
