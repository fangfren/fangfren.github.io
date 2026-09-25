'use strict';

const homeQuotes = [
  { text: '千里之行，始于足下。', source: '老子《道德经》' },
  { text: '认识你自己。', source: '德尔斐箴言' },
  { text: '未经审视的人生不值得过。', source: '苏格拉底' },
  { text: '凡不能毁灭我的，必使我更强大。', source: '尼采' },
  { text: '知之为知之，不知为不知，是知也。', source: '《论语》' },
  { text: '山重水复疑无路，柳暗花明又一村。', source: '陆游《游山西村》' },
  { text: '不积跬步，无以至千里。', source: '荀子《劝学》' },
  { text: '凡是过往，皆为序章。', source: '莎士比亚《暴风雨》' },
  { text: '知足不辱，知止不殆。', source: '老子《道德经》' },
  { text: '路漫漫其修远兮，吾将上下而求索。', source: '屈原《离骚》' }
];

const homeBackdrop = document.querySelector('.home-backdrop');
const homeWallpaperImage = document.querySelector('[data-home-wallpaper]');
const homeWallpaperCredit = document.querySelector('[data-home-wallpaper-credit]');
const bingWallpaperEndpoint = 'https://bing.biturl.top/?resolution=1920&format=json&index=0&mkt=zh-CN';

function getSafeBingUrl(value, allowedPaths) {
  try {
    const bingUrl = new URL(value);
    const isBingHost = bingUrl.hostname === 'www.bing.com' || bingUrl.hostname === 'bing.com';

    if (bingUrl.protocol !== 'https:' || !isBingHost || !allowedPaths.includes(bingUrl.pathname)) {
      return '';
    }

    return bingUrl.href;
  } catch (error) {
    return '';
  }
}

function getSafeBingWallpaperUrl(value) {
  return getSafeBingUrl(value, ['/th']);
}

function getSafeBingCreditUrl(value) {
  return getSafeBingUrl(value, ['/search']);
}

function preloadImage(source) {
  return new Promise(function (resolve, reject) {
    const image = new Image();
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    image.addEventListener('load', function () {
      resolve();
    }, { once: true });
    image.addEventListener('error', reject, { once: true });
    image.src = source;
  });
}

async function updateBingWallpaper() {
  if (!homeBackdrop || !homeWallpaperImage) {
    return;
  }

  try {
    const response = await fetch(bingWallpaperEndpoint, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error('Bing wallpaper request failed');
    }

    const wallpaper = await response.json();
    const wallpaperUrl = getSafeBingWallpaperUrl(wallpaper.url);

    if (!wallpaperUrl) {
      throw new Error('Bing wallpaper URL is invalid');
    }

    await preloadImage(wallpaperUrl);

    homeWallpaperImage.src = wallpaperUrl;
    homeBackdrop.classList.add('has-bing-wallpaper');

    if (homeWallpaperCredit) {
      const creditUrl = getSafeBingCreditUrl(wallpaper.copyright_link) || 'https://www.bing.com/';
      homeWallpaperCredit.href = creditUrl;
      homeWallpaperCredit.textContent = wallpaper.copyright || 'Bing daily wallpaper';
    }
  } catch (error) {
    homeBackdrop.classList.remove('has-bing-wallpaper');
  }
}

function updateHomeQuote() {
  const quoteElement = document.querySelector('[data-home-quote]');
  const sourceElement = document.querySelector('[data-home-quote-source]');

  if (!quoteElement || !sourceElement) {
    return;
  }

  const currentText = quoteElement.textContent;
  let nextQuote = homeQuotes[Math.floor(Math.random() * homeQuotes.length)];

  if (homeQuotes.length > 1 && nextQuote.text === currentText) {
    nextQuote = homeQuotes[(homeQuotes.indexOf(nextQuote) + 1) % homeQuotes.length];
  }

  quoteElement.textContent = nextQuote.text;
  sourceElement.textContent = nextQuote.source;
}

const avatarFlip = document.querySelector('.hero-avatar-flip');

if (avatarFlip) {
  avatarFlip.addEventListener('click', function () {
    const isFlipped = avatarFlip.classList.toggle('is-flipped');
    avatarFlip.setAttribute('aria-pressed', String(isFlipped));
  });
}

const sidebar = document.querySelector('[data-sidebar]');
const sidebarButton = document.querySelector('[data-sidebar-btn]');

if (sidebar && sidebarButton) {
  sidebarButton.addEventListener('click', function () {
    const isActive = sidebar.classList.toggle('active');
    sidebarButton.setAttribute('aria-expanded', String(isActive));
  });
}

const blogPosts = Array.isArray(window.RENFF_BLOG_POSTS)
  ? window.RENFF_BLOG_POSTS.slice()
  : [];
const blogList = document.querySelector('[data-blog-list]');
const blogEmpty = document.querySelector('[data-blog-empty]');
const blogTimeline = document.querySelector('[data-blog-timeline]');
const blogTimelineList = document.querySelector('[data-blog-timeline-list]');
const blogTimelinePanel = document.querySelector('[data-blog-timeline-panel]');
const blogTimelineToggle = document.querySelector('[data-blog-timeline-toggle]');
const blogTagList = document.querySelector('[data-blog-tag-list]');
const blogSearchForm = document.querySelector('[data-blog-search-form]');
const blogSearchInput = document.querySelector('[data-blog-search-input]');
const blogSearchStatus = document.querySelector('[data-blog-search-status]');
let selectedBlogTag = '';
const blogDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

function formatBlogDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return Number.isNaN(date.getTime()) ? dateString : blogDateFormatter.format(date);
}

function showBlogBannerFallback(banner, post) {
  if (banner.querySelector('.blog-banner-marker')) {
    return;
  }

  banner.classList.add('blog-banner-fallback');
  const marker = document.createElement('span');
  marker.className = 'blog-banner-marker';
  marker.textContent = post.category || 'Blog';
  banner.appendChild(marker);
}

function createBlogCard(post) {
  const item = document.createElement('li');
  item.className = 'blog-post-item';

  const link = document.createElement('a');
  link.className = 'blog-post-link';
  link.href = post.url || './blog.html?slug=' + encodeURIComponent(post.slug);
  link.dataset.blogSlug = post.slug;
  link.dataset.blogSearch = [
    post.title,
    post.summary,
    post.category,
    (post.tags || []).join(' ')
  ].join(' ').toLocaleLowerCase('zh-CN');
  link.dataset.blogTags = (post.tags || []).join('|');
  link.setAttribute('aria-label', '阅读文章：' + post.title);

  const banner = document.createElement(post.cover ? 'figure' : 'div');
  banner.className = 'blog-banner-box';

  if (post.cover) {
    const image = document.createElement('img');
    image.src = post.cover;
    image.alt = post.coverAlt || post.title;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', function () {
      image.remove();
      showBlogBannerFallback(banner, post);
    });
    banner.appendChild(image);
  } else {
    showBlogBannerFallback(banner, post);
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

  const tags = document.createElement('ul');
  tags.className = 'blog-card-tags';
  tags.setAttribute('aria-label', post.title + ' 文章标签');

  (post.tags || []).slice(0, 3).forEach(function (tag) {
    const item = document.createElement('li');
    item.textContent = tag;
    tags.appendChild(item);
  });

  const readMore = document.createElement('span');
  readMore.className = 'blog-read-more';
  readMore.textContent = '阅读全文';

  meta.append(category, dot, time);
  content.append(meta, title, summary, tags, readMore);
  link.append(banner, content);
  item.appendChild(link);

  return item;
}

function createBlogTimelineItem(post) {
  const item = document.createElement('li');
  item.className = 'blog-timeline-item';

  const button = document.createElement('button');
  button.className = 'blog-timeline-button';
  button.type = 'button';
  button.dataset.blogScrollTarget = post.slug;
  button.dataset.blogSearch = [
    post.title,
    post.summary,
    post.category,
    (post.tags || []).join(' ')
  ].join(' ').toLocaleLowerCase('zh-CN');
  button.dataset.blogTags = (post.tags || []).join('|');
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

function renderBlogTags() {
  if (!blogTagList) {
    return;
  }

  const tags = Array.from(new Set(blogPosts.flatMap(function (post) {
    return Array.isArray(post.tags) ? post.tags : [];
  }))).sort(function (first, second) {
    return first.localeCompare(second, 'zh-CN');
  });

  const buttons = ['全部'].concat(tags).map(function (tag, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'blog-tag-filter';
    button.dataset.blogTag = index === 0 ? '' : tag;
    button.textContent = tag;
    button.classList.toggle('active', selectedBlogTag === button.dataset.blogTag);
    return button;
  });

  blogTagList.replaceChildren(...buttons);
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
    const timelineItems = blogPosts.slice().reverse().map(createBlogTimelineItem);
    blogTimelineList.replaceChildren(...timelineItems);
  }

  if (blogTimeline) {
    blogTimeline.hidden = blogPosts.length === 0;
  }

  if (blogEmpty) {
    blogEmpty.hidden = blogPosts.length > 0;
  }

  renderBlogTags();
  filterBlogPosts(blogSearchInput ? blogSearchInput.value : '');
}

function filterBlogPosts(query) {
  const keyword = query.trim().toLocaleLowerCase('zh-CN');
  let matches = 0;

  if (blogList) {
    Array.from(blogList.querySelectorAll('[data-blog-slug]')).forEach(function (card) {
      const matchesKeyword = !keyword || card.dataset.blogSearch.indexOf(keyword) !== -1;
      const cardTags = (card.dataset.blogTags || '').split('|');
      const matchesTag = !selectedBlogTag || cardTags.indexOf(selectedBlogTag) !== -1;
      const isMatch = matchesKeyword && matchesTag;
      card.closest('.blog-post-item').hidden = !isMatch;

      if (isMatch) {
        matches += 1;
      }
    });
  }

  if (blogTimelineList) {
    Array.from(blogTimelineList.querySelectorAll('[data-blog-scroll-target]')).forEach(function (button) {
      const matchesKeyword = !keyword || button.dataset.blogSearch.indexOf(keyword) !== -1;
      const itemTags = (button.dataset.blogTags || '').split('|');
      const matchesTag = !selectedBlogTag || itemTags.indexOf(selectedBlogTag) !== -1;
      const isMatch = matchesKeyword && matchesTag;
      button.closest('.blog-timeline-item').hidden = !isMatch;
    });
  }

  if (blogEmpty) {
    blogEmpty.hidden = matches > 0;
    blogEmpty.textContent = blogPosts.length === 0
      ? '还没有发布文章。'
      : '没有找到匹配的文章。';
  }

  if (blogSearchStatus) {
    const filters = [];

    if (keyword) {
      filters.push('关键词“' + query.trim() + '”');
    }

    if (selectedBlogTag) {
      filters.push('标签“' + selectedBlogTag + '”');
    }

    blogSearchStatus.textContent = filters.length
      ? filters.join(' + ') + '：找到 ' + matches + ' 篇文章'
      : '';
  }
}

function updateFeedStatus() {
  const statusElement = document.querySelector('[data-feed-status]');

  if (!statusElement) {
    return;
  }

  if (!blogPosts.length) {
    statusElement.textContent = '订阅源已就绪，等待第一篇文章。';
    return;
  }

  const latestPost = blogPosts.reduce(function (latest, post) {
    const postDate = post.updated || post.date;
    const latestDate = latest.updated || latest.date;
    return new Date(postDate) > new Date(latestDate) ? post : latest;
  });

  statusElement.textContent = '已收录 ' + blogPosts.length + ' 篇文章 · 最近更新 '
    + formatBlogDate(latestPost.updated || latestPost.date);
}

function setBlogSearchOpen(isOpen) {
  if (!blogSearchForm || !blogSearchInput) {
    return;
  }

  blogSearchForm.classList.toggle('is-open', isOpen);

  const submitButton = blogSearchForm.querySelector('.blog-search-submit');

  blogSearchInput.disabled = !isOpen;

  if (submitButton) {
    submitButton.setAttribute('aria-label', isOpen ? '确认搜索' : '打开搜索');
  }

  if (isOpen) {
    blogSearchInput.focus();
  } else if (blogSearchInput.value) {
    blogSearchInput.value = '';
    filterBlogPosts('');
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

if (blogSearchForm) {
  blogSearchForm.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!blogSearchForm.classList.contains('is-open')) {
      setBlogSearchOpen(true);
      return;
    }

    filterBlogPosts(blogSearchInput.value);
  });
}

if (blogSearchInput) {
  blogSearchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      setBlogSearchOpen(false);

      const submitButton = blogSearchForm.querySelector('.blog-search-submit');

      if (submitButton) {
        submitButton.focus();
      }
    }
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

if (blogTagList) {
  blogTagList.addEventListener('click', function (event) {
    const button = event.target.closest('[data-blog-tag]');

    if (!button) {
      return;
    }

    selectedBlogTag = button.dataset.blogTag;
    renderBlogTags();
    filterBlogPosts(blogSearchInput ? blogSearchInput.value : '');
  });
}

const copyButtons = document.querySelectorAll('[data-copy-value]');

function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(value);
  }

  return new Promise(function (resolve, reject) {
    const input = document.createElement('textarea');
    input.value = value;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();

    try {
      const copied = document.execCommand('copy');
      input.remove();
      copied ? resolve() : reject(new Error('Copy command failed'));
    } catch (error) {
      input.remove();
      reject(error);
    }
  });
}

function setCopyButtonState(button, copied) {
  const iconElement = button.querySelector('ion-icon');
  const labelElement = button.querySelector('span');

  button.classList.toggle('is-copied', copied);

  if (iconElement && window.RenffIcons) {
    iconElement.replaceChildren(window.RenffIcons.create(copied ? 'checkmark-outline' : 'copy-outline'));
  }

  if (labelElement) {
    labelElement.textContent = copied ? '已复制' : '复制地址';
  }
}

copyButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    copyText(button.dataset.copyValue).then(function () {
      setCopyButtonState(button, true);
      window.clearTimeout(Number(button.dataset.copyResetTimer));
      button.dataset.copyResetTimer = String(window.setTimeout(function () {
        setCopyButtonState(button, false);
      }, 1800));
    }).catch(function () {
      const labelElement = button.querySelector('span');

      if (labelElement) {
        labelElement.textContent = '复制失败';
      }
    });
  });
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

  document.body.dataset.page = target;

  if (target === 'home') {
    updateHomeQuote();
  }

  if (updateHash) {
    history.replaceState(null, '', '#' + target);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  return true;
}

function getRouteFromHash() {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  const parts = hash.split('/');
  const page = parts[0] || 'home';

  if (page === 'portfolio') {
    window.location.replace('./projects.html');
    return { page: 'home' };
  }

  return { page: page === 'about' ? 'home' : page };
}

function showRoute(route) {
  if (!showPage(route.page, false)) {
    showPage('home', false);
  }
}

navigationLinks.forEach(function (link) {
  link.addEventListener('click', function (event) {
    event.preventDefault();
    showPage(this.dataset.navTarget, true);
  });
});

window.addEventListener('hashchange', function () {
  showRoute(getRouteFromHash());
});

renderBlogPosts();
updateFeedStatus();
setTimelineCollapsed(false);
showRoute(getRouteFromHash());

const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const shouldLoadRemoteWallpaper = !(connection && (connection.saveData || /2g/.test(connection.effectiveType || '')));

if (shouldLoadRemoteWallpaper) {
  const scheduleWallpaper = window.requestIdleCallback || function (callback) {
    return window.setTimeout(callback, 1800);
  };

  scheduleWallpaper(function () {
    updateBingWallpaper();
  }, { timeout: 3500 });
}
