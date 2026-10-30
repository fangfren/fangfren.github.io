'use strict';

(function () {
  const defaultAttributes = {
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  };
  const paths = {
    'person-outline': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'document-text-outline': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
    'code-slash-outline': '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
    'ellipsis-horizontal-outline': '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    'logo-github': '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7.3A5.7 5.7 0 0 0 19.2 3 5.3 5.3 0 0 0 19 0s-1.2-.4-3.9 1.5a13.4 13.4 0 0 0-7 0C5.4-.4 4.2 0 4.2 0A5.3 5.3 0 0 0 4 3a5.7 5.7 0 0 0-1.6 4.2c0 5.6 3.5 6.9 6.8 7.3A4.8 4.8 0 0 0 8 18v4"/><path d="M8 19c-3 .9-3-1.5-4-2"/>',
    'mail-outline': '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.9 5.7a2 2 0 0 1-2.2 0L2 7"/>',
    'location-outline': '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    'arrow-back-outline': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    'arrow-forward-outline': '<path d="m12 5 7 7-7 7"/><path d="M5 12h14"/>',
    'caret-down-outline': '<path d="m6 9 6 6 6-6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'search-outline': '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    'checkmark-outline': '<path d="m20 6-11 11-5-5"/>',
    'close-outline': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    'book-outline': '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
    'book-open-outline': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    'map-outline': '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15"/><path d="M15 6v15"/>',
    'rss-outline': '<path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>',
    'calendar-outline': '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    'time-outline': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'pricetag-outline': '<path d="M12.6 2.6a2 2 0 0 0-1.4-.6H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l9.2 9.2a2 2 0 0 0 2.8 0l7.2-7.2a2 2 0 0 0 0-2.8z"/><circle cx="7.5" cy="7.5" r="1"/>',
    'options-outline': '<path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/>',
    'external-link-outline': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    'chevron-forward-outline': '<path d="m9 18 6-6-6-6"/>',
    'copy-outline': '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    'checkmark-circle-outline': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.2 2.2 4.8-5.4"/>'
  };

  function create(name) {
    const markup = paths[name] || paths['ellipsis-horizontal-outline'];
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'site-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    Object.keys(defaultAttributes).forEach(function (attribute) {
      svg.setAttribute(attribute, defaultAttributes[attribute]);
    });
    svg.innerHTML = markup;
    return svg;
  }

  function render(root) {
    (root || document).querySelectorAll('ion-icon[name]').forEach(function (element) {
      if (element.querySelector('.site-icon')) {
        return;
      }

      element.replaceChildren(create(element.getAttribute('name')));
    });
  }

  window.RenffIcons = {
    create: create,
    render: render
  };

  render(document);
}());
