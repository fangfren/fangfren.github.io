'use strict';

const mapElement = document.querySelector('[data-map]');

if (mapElement && window.L) {
  const harbinCoordinates = [45.7567, 126.6424];
  const map = window.L.map(mapElement, {
    center: harbinCoordinates,
    zoom: 11,
    scrollWheelZoom: true,
    zoomControl: true
  });

  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  window.L.marker(harbinCoordinates)
    .addTo(map)
    .bindPopup('哈尔滨市')
    .openPopup();
}
