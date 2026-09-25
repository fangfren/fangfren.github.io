'use strict';

(function () {
  const projects = Array.isArray(window.RENFF_PROJECTS) ? window.RENFF_PROJECTS : [];

  function createIcon(name) {
    const wrapper = document.createElement('span');
    wrapper.className = 'project-icon';
    wrapper.setAttribute('aria-hidden', 'true');
    wrapper.appendChild(window.RenffIcons.create(name));
    return wrapper;
  }

  function createProjectCard(project, compact) {
    const item = document.createElement('li');
    item.className = 'project-item active';
    item.id = project.slug;
    item.dataset.projectSlug = project.slug;
    item.dataset.category = project.category;

    const card = document.createElement('article');
    card.className = 'project-card';

    const media = document.createElement('figure');
    media.className = 'project-img';

    const repositoryLink = document.createElement('a');
    repositoryLink.className = 'project-media-link';
    repositoryLink.href = compact ? './projects.html#' + project.slug : project.repository;
    repositoryLink.setAttribute('aria-label', '查看 ' + project.title);

    if (!compact) {
      repositoryLink.target = '_blank';
      repositoryLink.rel = 'noopener noreferrer';
    }

    const hoverIcon = document.createElement('span');
    hoverIcon.className = 'project-item-icon-box';
    hoverIcon.appendChild(window.RenffIcons.create('logo-github'));

    const image = document.createElement('img');
    image.src = project.cover;
    image.alt = project.coverAlt || project.title + ' 项目封面';
    image.loading = 'lazy';
    image.decoding = 'async';

    repositoryLink.append(hoverIcon, image);
    media.appendChild(repositoryLink);

    const content = document.createElement('div');
    content.className = 'project-content';

    const topLine = document.createElement('div');
    topLine.className = 'project-topline';

    const kicker = document.createElement('p');
    kicker.className = 'project-kicker';
    kicker.textContent = project.kicker;

    const status = document.createElement('span');
    status.className = 'project-status';
    status.textContent = project.status;

    topLine.append(kicker, status);

    const title = document.createElement('h3');
    title.className = 'project-title';

    const titleLink = document.createElement('a');
    titleLink.href = compact ? './projects.html#' + project.slug : project.repository;
    titleLink.textContent = project.title;

    if (!compact) {
      titleLink.target = '_blank';
      titleLink.rel = 'noopener noreferrer';
    }

    title.appendChild(titleLink);

    const meta = document.createElement('div');
    meta.className = 'project-meta';

    [
      ['calendar-outline', project.year],
      ['person-outline', project.role]
    ].forEach(function (entry) {
      const metaItem = document.createElement('span');
      metaItem.append(createIcon(entry[0]), document.createTextNode(entry[1]));
      meta.appendChild(metaItem);
    });

    const description = document.createElement('p');
    description.className = 'project-description';
    description.textContent = compact ? project.summary : project.description;

    const highlights = document.createElement('ul');
    highlights.className = 'project-highlights';

    (project.highlights || []).forEach(function (highlight) {
      const highlightItem = document.createElement('li');
      highlightItem.append(
        createIcon('checkmark-outline'),
        document.createTextNode(highlight)
      );
      highlights.appendChild(highlightItem);
    });

    const tags = document.createElement('ul');
    tags.className = 'project-tags';
    tags.setAttribute('aria-label', project.title + ' 技术栈');

    (project.tags || []).forEach(function (tag) {
      const tagItem = document.createElement('li');
      tagItem.textContent = tag;
      tags.appendChild(tagItem);
    });

    const actions = document.createElement('div');
    actions.className = 'project-actions';

    const repoAction = document.createElement('a');
    repoAction.className = 'project-action primary';
    repoAction.href = project.repository;
    repoAction.target = '_blank';
    repoAction.rel = 'noopener noreferrer';
    repoAction.append(
      createIcon('logo-github'),
      document.createTextNode('Repository')
    );

    const readmeAction = document.createElement('a');
    readmeAction.className = 'project-action';
    readmeAction.href = project.readme;
    readmeAction.target = '_blank';
    readmeAction.rel = 'noopener noreferrer';
    readmeAction.append(
      createIcon('book-open-outline'),
      document.createTextNode('README')
    );

    actions.append(repoAction, readmeAction);
    content.append(topLine, title, meta, description, highlights, tags, actions);
    card.append(media, content);
    item.appendChild(card);

    return item;
  }

  function filterProjects(value, scope) {
    const items = scope.querySelectorAll('[data-project-slug]');

    items.forEach(function (item) {
      const isMatch = value === 'all' || item.dataset.category === value;
      item.hidden = !isMatch;
      item.classList.toggle('is-filtered-out', !isMatch);
    });
  }

  function setupFilters(scope) {
    const filterRoot = scope.querySelector('[data-project-filters]');

    if (!filterRoot) {
      return;
    }

    filterRoot.addEventListener('click', function (event) {
      const button = event.target.closest('[data-project-filter]');

      if (!button) {
        return;
      }

      filterRoot.querySelectorAll('[data-project-filter]').forEach(function (item) {
        item.classList.toggle('active', item === button);
      });

      filterProjects(button.dataset.projectFilter, scope);
    });
  }

  function renderProjectList(list) {
    const limit = Number(list.dataset.projectLimit || projects.length);
    const compact = list.dataset.projectCompact === 'true';
    const cards = projects.slice(0, limit).map(function (project) {
      return createProjectCard(project, compact);
    });

    list.replaceChildren(...cards);
  }

  function updateStats() {
    document.querySelectorAll('[data-project-stat]').forEach(function (element) {
      const stat = element.dataset.projectStat;

      if (stat === 'count') {
        element.textContent = String(projects.length).padStart(2, '0');
      }

      if (stat === 'languages') {
        const languages = new Set(projects.map(function (project) {
          return project.categoryLabel;
        }));
        element.textContent = String(languages.size).padStart(2, '0');
      }
    });
  }

  function initialize() {
    document.querySelectorAll('[data-project-list]').forEach(function (list) {
      renderProjectList(list);
      setupFilters(list.closest('[data-project-section]') || document);
    });

    updateStats();
    window.RenffIcons.render(document);
  }

  window.RenffProjects = {
    createProjectCard: createProjectCard,
    filterProjects: filterProjects,
    render: function (list) {
      renderProjectList(list);
      window.RenffIcons.render(list);
    }
  };

  initialize();
}());
