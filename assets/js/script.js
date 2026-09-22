'use strict';

const sidebar = document.querySelector('[data-sidebar]');
const sidebarButton = document.querySelector('[data-sidebar-btn]');

if (sidebar && sidebarButton) {
  sidebarButton.addEventListener('click', function () {
    const isActive = sidebar.classList.toggle('active');
    sidebarButton.setAttribute('aria-expanded', String(isActive));
  });
}

const select = document.querySelector('[data-select]');
const selectItems = document.querySelectorAll('[data-select-item]');
const selectValue = document.querySelector('[data-selecct-value]');
const filterButtons = document.querySelectorAll('[data-filter-btn]');
const filterItems = document.querySelectorAll('[data-filter-item]');

function filterProjects(selectedValue) {
  filterItems.forEach(function (item) {
    const matches = selectedValue === 'all' || selectedValue === item.dataset.category;
    item.classList.toggle('active', matches);
  });
}

if (select && selectValue) {
  select.addEventListener('click', function () {
    const isActive = select.classList.toggle('active');
    select.setAttribute('aria-expanded', String(isActive));
  });
}

selectItems.forEach(function (item) {
  item.addEventListener('click', function () {
    const selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    select.classList.remove('active');
    select.setAttribute('aria-expanded', 'false');
    filterProjects(selectedValue);
  });
});

filterButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    const selectedValue = this.innerText.toLowerCase();

    filterButtons.forEach(function (item) {
      item.classList.remove('active');
    });

    this.classList.add('active');
    selectValue.innerText = this.innerText;
    filterProjects(selectedValue);
  });
});

const blogPosts = Array.isArray(window.RENFF_BLOG_POSTS)
  ? window.RENFF_BLOG_POSTS.slice()
  : [];
const blogList = document.querySelector('[data-blog-list]');
const blogEmpty = document.querySelector('[data-blog-empty]');
const blogTimeline = document.querySelector('[data-blog-timeline]');
const blogTimelineList = document.querySelector('[data-blog-timeline-list]');
const blogTimelinePanel = document.querySelector('[data-blog-timeline-panel]');
const blogTimelineToggle = document.querySelector('[data-blog-timeline-toggle]');
const blogTimelineToggleText = document.querySelector('[data-blog-timeline-toggle-text]');
const blogModal = document.querySelector('[data-blog-modal]');
const blogModalScroll = document.querySelector('[data-blog-modal-scroll]');
const blogModalCloseButton = document.querySelector('.blog-modal-close');
const blogModalCover = document.querySelector('[data-blog-modal-cover]');
const blogModalImage = document.querySelector('[data-blog-modal-image]');
const blogModalCategory = document.querySelector('[data-blog-modal-category]');
const blogModalDate = document.querySelector('[data-blog-modal-date]');
const blogModalReadingTime = document.querySelector('[data-blog-modal-reading-time]');
const blogModalTitle = document.querySelector('[data-blog-modal-title]');
const blogModalSummary = document.querySelector('[data-blog-modal-summary]');
const blogModalContent = document.querySelector('[data-blog-content]');
const blogDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

let lastFocusedElement = null;

function formatBlogDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return Number.isNaN(date.getTime()) ? dateString : blogDateFormatter.format(date);
}

function createBlogCard(post) {
  const item = document.createElement('li');
  item.className = 'blog-post-item';

  const button = document.createElement('button');
  button.className = 'blog-post-link';
  button.type = 'button';
  button.dataset.blogSlug = post.slug;
  button.setAttribute('aria-label', '阅读文章：' + post.title);

  const banner = document.createElement(post.cover ? 'figure' : 'div');
  banner.className = 'blog-banner-box';

  if (post.cover) {
    const image = document.createElement('img');
    image.src = post.cover;
    image.alt = post.coverAlt || post.title;
    image.loading = 'lazy';
    image.decoding = 'async';
    banner.appendChild(image);
  } else {
    banner.classList.add('blog-banner-fallback');
    const marker = document.createElement('span');
    marker.textContent = post.category || 'Blog';
    banner.appendChild(marker);
  }

  const content = document.createElement('div');
  content.className = 'blog-content';

  const meta = document.createElement('div');
  meta.className = 'blog-meta';

  const category = document.createElement('span');
  category.className = 'blog-category';
  category.textContent = post.category || 'Blog';

  const dot = document.createElement('span');
  dot.className = 'dot';

  const time = document.createElement('time');
  time.dateTime = post.date;
  time.textContent = formatBlogDate(post.date);

  const title = document.createElement('h3');
  title.className = 'h4 blog-item-title';
  title.textContent = post.title;

  const summary = document.createElement('p');
  summary.className = 'blog-text';
  summary.textContent = post.summary || '';

  const readMore = document.createElement('span');
  readMore.className = 'blog-read-more';
  readMore.textContent = '阅读全文';

  meta.append(category, dot, time);
  content.append(meta, title, summary, readMore);
  button.append(banner, content);
  item.appendChild(button);

  return item;
}

function createBlogTimelineItem(post) {
  const item = document.createElement('li');
  item.className = 'blog-timeline-item';

  const button = document.createElement('button');
  button.className = 'blog-timeline-button';
  button.type = 'button';
  button.dataset.blogScrollTarget = post.slug;
  button.setAttribute('aria-label', '跳转到文章：' + post.title);

  const marker = document.createElement('span');
  marker.className = 'blog-timeline-marker';
  marker.setAttribute('aria-hidden', 'true');

  const content = document.createElement('span');
  content.className = 'blog-timeline-content';

  const time = document.createElement('time');
  time.dateTime = post.date;
  time.textContent = formatBlogDate(post.date);

  const title = document.createElement('strong');
  title.className = 'blog-timeline-title';
  title.textContent = post.title;

  const meta = document.createElement('span');
  meta.className = 'blog-timeline-meta';
  meta.textContent = [post.category || 'Blog', post.readingTime]
    .filter(Boolean)
    .join(' · ');

  content.append(time, title, meta);
  button.append(marker, content);
  item.appendChild(button);

  return item;
}

function renderBlogPosts() {
  if (!blogList) {
    return;
  }

  blogPosts.sort(function (first, second) {
    return new Date(second.date) - new Date(first.date);
  });

  const cards = blogPosts.map(createBlogCard);
  blogList.replaceChildren(...cards);

  if (blogTimelineList) {
    const timelineItems = blogPosts.map(createBlogTimelineItem);
    blogTimelineList.replaceChildren(...timelineItems);
  }

  if (blogTimeline) {
    blogTimeline.hidden = blogPosts.length === 0;
  }

  if (blogEmpty) {
    blogEmpty.hidden = blogPosts.length > 0;
  }
}

function setTimelineCollapsed(collapsed) {
  if (!blogTimeline || !blogTimelineToggle || !blogTimelinePanel) {
    return;
  }

  blogTimeline.classList.toggle('is-collapsed', collapsed);
  blogTimelineToggle.setAttribute('aria-expanded', String(!collapsed));
  blogTimelinePanel.setAttribute('aria-hidden', String(collapsed));
  blogTimelinePanel.toggleAttribute('inert', collapsed);

  if (blogTimelineToggleText) {
    blogTimelineToggleText.textContent = collapsed ? '展开时间线' : '收起时间线';
  }
}

function scrollToBlogCard(slug) {
  if (!blogList) {
    return;
  }

  const card = Array.from(blogList.querySelectorAll('[data-blog-slug]')).find(function (item) {
    return item.dataset.blogSlug === slug;
  });

  if (!card) {
    return;
  }

  card.focus({ preventScroll: true });
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });

  card.classList.remove('blog-post-highlight');
  window.requestAnimationFrame(function () {
    card.classList.add('blog-post-highlight');
  });

  window.setTimeout(function () {
    card.classList.remove('blog-post-highlight');
  }, 1800);
}

function closeBlogPost(updateHash) {
  if (!blogModal) {
    return;
  }

  blogModal.classList.remove('active');
  blogModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('blog-modal-open');

  if (updateHash && window.location.hash.indexOf('#blog/') === 0) {
    history.replaceState(null, '', '#blog');
  }

  if (lastFocusedElement && document.contains(lastFocusedElement)) {
    lastFocusedElement.focus();
  }
}

function openBlogPost(post, updateHash) {
  if (!post || !blogModal) {
    return;
  }

  lastFocusedElement = document.activeElement;
  blogModalCategory.textContent = post.category || 'Blog';
  blogModalDate.dateTime = post.date;
  blogModalDate.textContent = formatBlogDate(post.date);
  blogModalReadingTime.textContent = post.readingTime || '';
  blogModalTitle.textContent = post.title;
  blogModalSummary.textContent = post.summary || '';
  blogModalContent.innerHTML = post.content || '<p>这篇文章还没有正文。</p>';

  if (post.cover) {
    blogModalImage.src = post.cover;
    blogModalImage.alt = post.coverAlt || post.title;
    blogModalCover.hidden = false;
  } else {
    blogModalImage.removeAttribute('src');
    blogModalImage.alt = '';
    blogModalCover.hidden = true;
  }

  blogModal.classList.add('active');
  blogModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('blog-modal-open');
  blogModalScroll.scrollTop = 0;

  if (updateHash) {
    history.replaceState(null, '', '#blog/' + encodeURIComponent(post.slug));
  }

  if (blogModalCloseButton) {
    blogModalCloseButton.focus();
  }
}

if (blogList) {
  blogList.addEventListener('click', function (event) {
    const card = event.target.closest('[data-blog-slug]');

    if (!card) {
      return;
    }

    const post = blogPosts.find(function (item) {
      return item.slug === card.dataset.blogSlug;
    });

    openBlogPost(post, true);
  });
}

if (blogTimelineToggle) {
  blogTimelineToggle.addEventListener('click', function () {
    setTimelineCollapsed(blogTimelineToggle.getAttribute('aria-expanded') === 'true');
  });
}

if (blogTimelineList) {
  blogTimelineList.addEventListener('click', function (event) {
    const timelineButton = event.target.closest('[data-blog-scroll-target]');

    if (!timelineButton) {
      return;
    }

    scrollToBlogCard(timelineButton.dataset.blogScrollTarget);
  });
}

document.querySelectorAll('[data-blog-modal-close]').forEach(function (button) {
  button.addEventListener('click', function () {
    closeBlogPost(true);
  });
});

document.addEventListener('keydown', function (event) {
  if (!blogModal || !blogModal.classList.contains('active')) {
    return;
  }

  if (event.key === 'Escape') {
    closeBlogPost(true);
    return;
  }

  if (event.key === 'Tab') {
    event.preventDefault();

    if (blogModalCloseButton) {
      blogModalCloseButton.focus();
    }
  }
});

const navigationLinks = document.querySelectorAll('[data-nav-link]');
const pages = document.querySelectorAll('[data-page]');

function showPage(target, updateHash) {
  let targetExists = false;

  navigationLinks.forEach(function (link) {
    const isActive = link.dataset.navTarget === target;
    link.classList.toggle('active', isActive);
    targetExists = targetExists || isActive;
  });

  if (!targetExists) {
    return false;
  }

  pages.forEach(function (page) {
    page.classList.toggle('active', page.dataset.page === target);
  });

  if (updateHash) {
    history.replaceState(null, '', '#' + target);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  return true;
}

function getRouteFromHash() {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  const parts = hash.split('/');

  return {
    page: parts[0] || 'about',
    postSlug: parts[1] || ''
  };
}

function showRoute(route) {
  const post = route.page === 'blog'
    ? blogPosts.find(function (item) { return item.slug === route.postSlug; })
    : null;

  if (!showPage(route.page, false)) {
    showPage('about', false);
    closeBlogPost(false);
    return;
  }

  if (post) {
    openBlogPost(post, false);
  } else {
    closeBlogPost(false);
  }
}

navigationLinks.forEach(function (link) {
  link.addEventListener('click', function () {
    closeBlogPost(false);
    showPage(this.dataset.navTarget, true);
  });
});

window.addEventListener('hashchange', function () {
  showRoute(getRouteFromHash());
});

renderBlogPosts();
setTimelineCollapsed(false);
showRoute(getRouteFromHash());
