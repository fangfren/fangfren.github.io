'use strict';

(function () {
  const posts = Array.isArray(window.RENFF_BLOG_POSTS) ? window.RENFF_BLOG_POSTS : [];
  const projects = Array.isArray(window.RENFF_PROJECTS) ? window.RENFF_PROJECTS : [];
  const siteRoot = document.body.dataset.siteRoot || './';
  const maxResults = 8;

  function stripHtml(value) {
    const element = document.createElement('div');
    element.innerHTML = value || '';
    return element.textContent || '';
  }

  function normalizeText(value) {
    return String(value || '').toLocaleLowerCase('zh-CN');
  }

  function normalizeHref(value) {
    if (/^https?:\/\//.test(value)) {
      return value;
    }

    return siteRoot + value.replace(/^\.\//, '');
  }

  function getItems() {
    const postItems = posts.map(function (post) {
      const tags = Array.isArray(post.tags) ? post.tags : [];

      return {
        type: '文章',
        title: post.title,
        summary: post.summary || '',
        meta: [post.category, post.date, post.readingTime].filter(Boolean).join(' · '),
        tags: [post.category].concat(tags).filter(Boolean),
        href: normalizeHref(post.url || ('posts/' + post.slug + '.html')),
        searchText: [
          post.title,
          post.summary,
          post.category,
          tags.join(' '),
          stripHtml(post.content)
        ].join(' ')
      };
    });

    const projectItems = projects.map(function (project) {
      const tags = Array.isArray(project.tags) ? project.tags : [];

      return {
        type: '项目',
        title: project.title,
        summary: project.summary || project.description || '',
        meta: [project.categoryLabel, project.year, project.status].filter(Boolean).join(' · '),
        tags: [project.categoryLabel].concat(tags).filter(Boolean),
        href: normalizeHref('projects.html#' + project.slug),
        searchText: [
          project.title,
          project.kicker,
          project.summary,
          project.description,
          project.status,
          project.role,
          tags.join(' '),
          (project.highlights || []).join(' ')
        ].join(' ')
      };
    });

    return postItems.concat(projectItems);
  }

  function scoreItem(item, terms) {
    const title = normalizeText(item.title);
    const summary = normalizeText(item.summary);
    const tags = normalizeText(item.tags.join(' '));
    const searchText = normalizeText(item.searchText);
    let score = 0;

    terms.forEach(function (term) {
      if (title === term) {
        score += 20;
      } else if (title.indexOf(term) !== -1) {
        score += 10;
      }

      if (tags.indexOf(term) !== -1) {
        score += 6;
      }

      if (summary.indexOf(term) !== -1) {
        score += 4;
      }

      if (searchText.indexOf(term) !== -1) {
        score += 1;
      }
    });

    return score;
  }

  function search(query) {
    const normalizedQuery = normalizeText(query).trim();

    if (!normalizedQuery) {
      return getItems();
    }

    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    const results = getItems().map(function (item) {
      return {
        item: item,
        score: scoreItem(item, terms)
      };
    }).filter(function (result) {
      return result.score === terms.length || result.score >= terms.length * 3;
    });

    return results.sort(function (first, second) {
      return second.score - first.score;
    }).map(function (result) {
      return result.item;
    });
  }

  function createResult(item) {
    const link = document.createElement('a');
    link.className = 'site-search-result';
    link.href = item.href;

    const type = document.createElement('span');
    type.className = 'site-search-result-type';
    type.textContent = item.type;

    const copy = document.createElement('span');
    copy.className = 'site-search-result-copy';

    const title = document.createElement('strong');
    title.textContent = item.title;

    const meta = document.createElement('small');
    meta.textContent = item.meta;

    const summary = document.createElement('span');
    summary.className = 'site-search-result-summary';
    summary.textContent = item.summary;

    copy.append(title, meta, summary);

    const arrow = document.createElement('span');
    arrow.className = 'site-search-result-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.appendChild(window.RenffIcons.create('arrow-forward-outline'));

    link.append(type, copy, arrow);
    return link;
  }

  function renderResults(container, emptyState, query) {
    const results = search(query).slice(0, maxResults);
    container.replaceChildren();

    if (!query.trim()) {
      emptyState.textContent = '输入关键词，搜索文章与项目。';
      emptyState.hidden = false;
      return;
    }

    if (!results.length) {
      emptyState.textContent = '没有找到匹配的文章或项目。';
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
    results.forEach(function (item) {
      const listItem = document.createElement('li');
      listItem.appendChild(createResult(item));
      container.appendChild(listItem);
    });
  }

  function initializeInlineSearch() {
    const triggers = Array.from(document.querySelectorAll('[data-site-search-trigger]'));

    if (!triggers.length) {
      return;
    }

    const instances = [];

    function closeInstance(instance, restoreFocus) {
      if (!instance.isOpen) {
        return;
      }

      instance.isOpen = false;
      instance.panel.classList.remove('is-open');
      instance.panel.setAttribute('aria-hidden', 'true');
      instance.panel.setAttribute('inert', '');
      instance.trigger.setAttribute('aria-expanded', 'false');

      if (restoreFocus && document.contains(instance.trigger)) {
        instance.trigger.focus();
      }
    }

    function openInstance(instance) {
      instances.forEach(function (candidate) {
        if (candidate !== instance) {
          closeInstance(candidate, false);
        }
      });

      instance.input.value = '';
      instance.updateResults();
      instance.isOpen = true;
      instance.panel.classList.add('is-open');
      instance.panel.setAttribute('aria-hidden', 'false');
      instance.panel.removeAttribute('inert');
      instance.trigger.setAttribute('aria-expanded', 'true');

      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          focusInput(instance);
        });
      });
    }

    function focusInput(instance, attempt) {
      if (!instance.isOpen) {
        return;
      }

      instance.input.focus({ preventScroll: true });

      if (document.activeElement === instance.input) {
        return;
      }

      // The panel fades in, so the input can briefly reject focus while it is
      // still considered hidden. Retry across a few frames.
      if ((attempt || 0) < 4) {
        window.setTimeout(function () {
          focusInput(instance, (attempt || 0) + 1);
        }, 60);
      }
    }

    triggers.forEach(function (trigger, index) {
      const host = trigger.closest('.home-tools, .page-nav-actions, .blog-section-header') ||
        trigger.parentElement;
      const panelId = 'site-search-inline-' + index;
      const titleId = 'site-search-title-' + index;
      const panel = document.createElement('div');

      host.classList.add('site-search-host');
      panel.className = 'site-search-inline';
      panel.id = panelId;
      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-labelledby', titleId);
      panel.setAttribute('aria-hidden', 'true');
      panel.setAttribute('inert', '');
      panel.innerHTML = [
        '<div class="site-search-heading">',
        '  <div>',
        '    <p>Search / Index</p>',
        '    <h2 id="' + titleId + '">全站搜索</h2>',
        '  </div>',
        '</div>',
        '<label class="site-search-input-wrap">',
        '  <span class="sr-only">搜索文章和项目</span>',
        '  <input type="search" data-site-search-input autocomplete="off" placeholder="搜索文章、标签或项目...">',
        '</label>',
        '<p class="site-search-status" data-site-search-status aria-live="polite"></p>',
        '<p class="site-search-empty" data-site-search-empty></p>',
        '<ul class="site-search-results" data-site-search-results></ul>',
        '<div class="site-search-footer">',
        '  <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>',
        '  <span><kbd>Enter</kbd> 打开</span>',
        '  <span><kbd>Esc</kbd> 关闭</span>',
        '</div>'
      ].join('');

      host.appendChild(panel);

      const input = panel.querySelector('[data-site-search-input]');
      const results = panel.querySelector('[data-site-search-results]');
      const emptyState = panel.querySelector('[data-site-search-empty]');
      const status = panel.querySelector('[data-site-search-status]');
      const instance = {
        trigger: trigger,
        panel: panel,
        input: input,
        results: results,
        status: status,
        isOpen: false,
        updateResults: function () {
          renderResults(results, emptyState, input.value);
          const count = results.children.length;
          status.textContent = input.value.trim() && count ? '显示 ' + count + ' 条相关结果' : '';
        }
      };

      trigger.setAttribute('aria-controls', panelId);
      trigger.setAttribute('aria-expanded', 'false');
      trigger.addEventListener('click', function () {
        if (instance.isOpen) {
          closeInstance(instance, true);
        } else {
          openInstance(instance);
        }
      });

      input.addEventListener('input', instance.updateResults);
      panel.addEventListener('keydown', function (event) {
        const resultLinks = Array.from(results.querySelectorAll('a'));
        const currentIndex = resultLinks.indexOf(document.activeElement);

        if (event.key === 'Escape') {
          event.preventDefault();
          closeInstance(instance, true);
          return;
        }

        if (event.key === 'ArrowDown' && resultLinks.length) {
          event.preventDefault();
          resultLinks[(currentIndex + 1) % resultLinks.length].focus();
        }

        if (event.key === 'ArrowUp' && resultLinks.length) {
          event.preventDefault();
          const nextIndex = currentIndex === -1
            ? resultLinks.length - 1
            : (currentIndex - 1 + resultLinks.length) % resultLinks.length;
          resultLinks[nextIndex].focus();
        }

        if (event.key === 'Enter' && currentIndex === -1 && input.value.trim()) {
          event.preventDefault();
          window.location.href = siteRoot + 'search.html?q=' + encodeURIComponent(input.value.trim());
        }
      });

      instances.push(instance);
    });

    document.addEventListener('pointerdown', function (event) {
      instances.forEach(function (instance) {
        if (!instance.isOpen) {
          return;
        }

        if (!instance.panel.contains(event.target) && !instance.trigger.contains(event.target)) {
          closeInstance(instance, false);
        }
      });
    });

    document.addEventListener('keydown', function (event) {
      const target = event.target;
      const isTyping = target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable;

      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        const instance = instances.find(function (candidate) {
          return candidate.trigger.offsetParent !== null;
        }) || instances[0];

        if (instance.isOpen) {
          closeInstance(instance, true);
        } else {
          openInstance(instance);
        }
      } else if (event.key === '/' && !isTyping) {
        event.preventDefault();
        const instance = instances.find(function (candidate) {
          return candidate.trigger.offsetParent !== null;
        }) || instances[0];
        openInstance(instance);
      }
    });

    document.body.dataset.searchReady = 'true';
  }

  function initializeSearchPage() {
    const page = document.querySelector('[data-search-page]');

    if (!page) {
      return;
    }

    const form = page.querySelector('[data-search-page-form]');
    const input = page.querySelector('[data-search-page-input]');
    const results = page.querySelector('[data-search-page-results]');
    const emptyState = page.querySelector('[data-search-page-empty]');
    const initialQuery = new URLSearchParams(window.location.search).get('q') || '';
    input.value = initialQuery;

    function render(query) {
      renderResults(results, emptyState, query);
      const count = results.children.length;
      emptyState.textContent = query.trim()
        ? (count ? '' : '没有找到匹配的文章或项目。')
        : '输入关键词开始搜索。';
      emptyState.hidden = Boolean(query.trim() && count);
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const query = input.value.trim();
      const nextUrl = query ? './search.html?q=' + encodeURIComponent(query) : './search.html';
      window.history.replaceState(null, '', nextUrl);
      render(query);
    });

    render(initialQuery);
  }

  window.RenffSearch = {
    getItems: getItems,
    search: search,
    renderResults: renderResults
  };

  initializeInlineSearch();
  initializeSearchPage();
}());
