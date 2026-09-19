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
    return;
  }

  pages.forEach(function (page) {
    page.classList.toggle('active', page.dataset.page === target);
  });

  if (updateHash) {
    history.replaceState(null, '', '#' + target);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navigationLinks.forEach(function (link) {
  link.addEventListener('click', function () {
    showPage(this.dataset.navTarget, true);
  });
});

showPage(window.location.hash.slice(1) || 'about', false);
