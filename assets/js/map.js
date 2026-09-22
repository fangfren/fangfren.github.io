'use strict';

const mapModal = document.querySelector('[data-map-modal]');
const mapElement = document.querySelector('[data-map]');
const mapCloseButton = document.querySelector('.map-modal-close');
const mapOpenButtons = document.querySelectorAll('[data-map-open]');
const mapCloseButtons = document.querySelectorAll('[data-map-modal-close]');
let mapInstance = null;
let lastFocusedElement = null;

function initializeMap() {
  if (!mapElement || mapInstance || !window.L) {
    return;
  }

  const harbinCoordinates = [45.7567, 126.6424];
  mapInstance = window.L.map(mapElement, {
    center: harbinCoordinates,
    zoom: 11,
    scrollWheelZoom: true,
    zoomControl: true
  });

  window.L.tileLayer(
    'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    {
      subdomains: ['1', '2', '3', '4'],
      maxZoom: 18,
      attribution: '&copy; 高德地图'
    }
  ).addTo(mapInstance);

  window.L.marker(harbinCoordinates)
    .addTo(mapInstance)
    .bindPopup('哈尔滨市')
    .openPopup();

  window.setTimeout(function () {
    mapInstance.invalidateSize();
  }, 120);
}

function openMapModal() {
  if (!mapModal) {
    return;
  }

  lastFocusedElement = document.activeElement;
  mapModal.classList.add('active');
  mapModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('map-modal-open');
  initializeMap();

  if (mapCloseButton) {
    mapCloseButton.focus();
  }
}

function closeMapModal() {
  if (!mapModal) {
    return;
  }

  mapModal.classList.remove('active');
  mapModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('map-modal-open');

  if (lastFocusedElement && document.contains(lastFocusedElement)) {
    lastFocusedElement.focus();
  }
}

mapOpenButtons.forEach(function (button) {
  button.addEventListener('click', openMapModal);
});

mapCloseButtons.forEach(function (button) {
  button.addEventListener('click', closeMapModal);
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && mapModal && mapModal.classList.contains('active')) {
    closeMapModal();
  }
});
